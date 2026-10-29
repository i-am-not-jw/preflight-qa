import { chromium, type Page } from "playwright";
import { blockedClick } from "./click-block.ts";
import { assertPublicPageUrl, isLoopbackHost, shouldVisit } from "./public-url";
import type { ClickCapture, PageCapture } from "./types";

const CLICK_LIMIT = 20;

export async function crawl(start: URL, options?: { allowLocal?: boolean }): Promise<PageCapture[]> {
  const allowLocal = options?.allowLocal === true;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    if (detail.includes("Executable doesn't exist") || detail.includes("Please run the following command")) {
      throw new Error("browser_missing");
    }
    throw new Error(detail ? `browser_fail: ${detail.slice(0, 180)}` : "browser_fail");
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(15_000);
    let dialogText = "";
    page.on("dialog", (dialog) => {
      dialogText = dialog.message().replace(/\s+/g, " ").trim().slice(0, 160);
      void dialog.dismiss();
    });
    // shortcut: 시작 페이지만 연다. 찾은 주소를 따라 스크린샷을 찍는 일은 보류다.
    return [await inspectPage(page, start, allowLocal, () => dialogText, () => (dialogText = ""))];
  } finally {
    await browser.close();
  }
}

async function inspectPage(
  page: Page,
  start: URL,
  allowLocal: boolean,
  readDialog: () => string,
  clearDialog: () => void,
): Promise<PageCapture> {
  const opened = shouldVisit(start, start.toString()) ?? start.toString();
  try {
    const response = await page.goto(opened, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForLoadState("networkidle", { timeout: 2_000 }).catch(() => {});
    const landed = new URL(page.url());
    const type = response?.headers()["content-type"] ?? "";
    if (type && !type.includes("html")) return blankPage(opened, "page_open_failed");
    if (!shouldVisit(start, landed.toString())) return blankPage(opened, "off_site");
    try {
      await ensurePublic(landed, allowLocal);
    } catch {
      return blankPage(opened, "not_public");
    }
    const extracted = await readPage(page);
    const home = page.url();
    const clicks = await pressClickables(page, home, readDialog, clearDialog);
    const paths = [
      ...new Set(extracted.hrefs.map((href) => shouldVisit(start, href)).filter((href): href is string => Boolean(href))),
    ];
    return {
      url: home,
      title: extracted.title,
      status: response?.status() ?? null,
      headings: extracted.headings,
      nav: extracted.nav,
      buttons: extracted.buttons,
      links: extracted.links,
      forms: extracted.forms,
      paths,
      clicks,
      screenshotFile: "",
      error: null,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 180) : "";
    return blankPage(opened, detail ? `page_open_failed: ${detail}` : "page_open_failed");
  }
}

async function pressClickables(
  page: Page,
  home: string,
  readDialog: () => string,
  clearDialog: () => void,
): Promise<ClickCapture[]> {
  const clicks: ClickCapture[] = [];
  const targets = page.locator("a[href], button, [role='button'], [role='link']").filter({ visible: true });
  const count = Math.min(await targets.count(), CLICK_LIMIT);
  for (let index = 0; index < count; index += 1) {
    const target = targets.nth(index);
    const text = (await target.innerText({ timeout: 2_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 80);
    const href = (await target.getAttribute("href")) ?? "";
    const blocked = blockedClick(home, text);
    const submits = await target
      .locator("xpath=ancestor-or-self::input[@type='submit'] | ancestor-or-self::button[not(@type='button')][ancestor::form]")
      .count()
      .catch(() => 0);
    if (blocked || submits) {
      clicks.push({ text, href, to: blocked || "submit_blocked", note: "" });
      continue;
    }
    clearDialog();
    const beforeHeads = await headingText(page);
    try {
      await target.click({ timeout: 5_000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 5_000 }).catch(() => {});
    } catch (error) {
      const detail = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 160) : "click_failed";
      clicks.push({ text, href, to: "click_failed", note: detail });
      await page.goto(home, { waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => {});
      continue;
    }
    const after = page.url();
    if (after !== home) {
      clicks.push({ text, href, to: after, note: "" });
    } else {
      const afterHeads = await headingText(page);
      const added = afterHeads.find((heading) => !beforeHeads.includes(heading)) ?? "";
      clicks.push({ text, href, to: "same_page", note: readDialog() || added });
    }
    await page.goto(home, { waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => {});
  }
  return clicks;
}

async function headingText(page: Page): Promise<string[]> {
  return page.evaluate<string[]>(
    `(() => [...document.querySelectorAll("h1, h2, h3")].map((el) => (el.textContent || "").replace(/\\s+/g, " ").trim()).filter(Boolean).slice(0, 30))()`,
  );
}

async function readPage(page: Page) {
  // A string so tsx cannot rewrite it. The page does not have the compiler helper.
  return page.evaluate<{
    title: string;
    headings: string[];
    nav: string[];
    buttons: string[];
    links: { text: string; href: string }[];
    forms: { method: string; action: string; fields: { name: string; type: string; label: string }[] }[];
    hrefs: string[];
  }>(`(() => {
    const clip = (value, max) => (value ?? "").replace(/\\s+/g, " ").trim().slice(0, max);
    const visible = (el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const fieldLabel = (el) => {
      const id = el.getAttribute("id");
      const from = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
      const wrap = el.closest("label");
      return clip(from?.textContent || wrap?.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder"), 80);
    };
    const headings = [...document.querySelectorAll("h1, h2, h3")].filter(visible).map((el) => clip(el.textContent, 120)).filter(Boolean).slice(0, 30);
    const nav = [...document.querySelectorAll("nav a, header a")].filter(visible).map((el) => clip(el.textContent, 80)).filter(Boolean).slice(0, 30);
    const buttons = [...document.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button']")].filter(visible).map((el) => clip(el.textContent || el.getAttribute("value") || el.getAttribute("aria-label"), 80)).filter(Boolean).slice(0, 30);
    const anchors = [...document.querySelectorAll("a[href]")].filter(visible);
    const links = anchors.slice(0, 30).map((el) => ({ text: clip(el.textContent, 80), href: el.href }));
    const forms = [...document.querySelectorAll("form")].filter(visible).slice(0, 8).map((form) => ({
      method: (form.getAttribute("method") || "get").toLowerCase(),
      action: form.action,
      fields: [...form.querySelectorAll("input, textarea, select")].filter((el) => el.getAttribute("type") !== "hidden").slice(0, 20).map((el) => ({
        name: el.getAttribute("name") || "",
        type: el.getAttribute("type") || (el.tagName === "INPUT" ? "text" : el.tagName.toLowerCase()),
        label: fieldLabel(el),
      })),
    }));
    return {
      title: clip(document.title, 160),
      headings,
      nav,
      buttons,
      links,
      forms,
      hrefs: anchors.map((el) => el.href).slice(0, 200),
    };
  })()`);
}

async function ensurePublic(url: URL, allowLocal: boolean): Promise<void> {
  if (allowLocal && isLoopbackHost(url.hostname)) return;
  await assertPublicPageUrl(url.toString());
}

function blankPage(url: string, error: string): PageCapture {
  return {
    url,
    title: "",
    status: null,
    headings: [],
    nav: [],
    buttons: [],
    links: [],
    forms: [],
    paths: [],
    clicks: [],
    screenshotFile: "",
    error,
  };
}
