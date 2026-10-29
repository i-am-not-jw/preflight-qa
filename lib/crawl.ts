import path from "node:path";
import { chromium } from "playwright";
import { assertPublicPageUrl, isLoopbackHost, shouldVisit } from "./public-url";
import type { PageCapture } from "./types";

const MAX_PAGES = 15;

export async function crawl(
  start: URL,
  dir: string,
  options?: { maxPages?: number; allowLocal?: boolean },
): Promise<PageCapture[]> {
  const maxPages = Math.min(MAX_PAGES, Math.max(1, options?.maxPages ?? MAX_PAGES));
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

  const pages: PageCapture[] = [];
  const seen = new Set<string>();
  const checkedHosts = new Set<string>([start.hostname.toLowerCase()]);
  const first = shouldVisit(start, start.toString());
  const queue = first ? [first] : [start.toString()];

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(15_000);
    page.on("dialog", (dialog) => {
      void dialog.dismiss();
    });

    while (queue.length > 0 && pages.length < maxPages) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      try {
        const response = await page.goto(current, { waitUntil: "domcontentloaded", timeout: 15_000 });
        // shortcut: networkidle은 2초만 기다린다. 광고가 많은 페이지가 크롤을 멈추면 그때 늘린다.
        await page.waitForLoadState("networkidle", { timeout: 2_000 }).catch(() => {});
        const landed = new URL(page.url());
        const type = response?.headers()["content-type"] ?? "";
        if (type && !type.includes("html")) continue;
        if (!shouldVisit(start, landed.toString())) {
          pages.push(blankPage(current, "off_site"));
          continue;
        }
        try {
          await ensurePublic(landed, checkedHosts, allowLocal);
        } catch {
          pages.push(blankPage(current, "not_public"));
          continue;
        }
        // A string so tsx cannot rewrite it. The page does not have the compiler helper.
        const extracted = await page.evaluate<{
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
        const file = `page-${pages.length + 1}.png`;
        let screenshotFile = "";
        try {
          await page.screenshot({ path: path.join(dir, file), type: "png" });
          screenshotFile = file;
        } catch {
          screenshotFile = "";
        }
        pages.push({
          url: page.url(),
          title: extracted.title,
          status: response?.status() ?? null,
          headings: extracted.headings,
          nav: extracted.nav,
          buttons: extracted.buttons,
          links: extracted.links,
          forms: extracted.forms,
          screenshotFile,
          error: null,
        });
        for (const href of extracted.hrefs) {
          const next = shouldVisit(start, href);
          if (!next || seen.has(next) || queue.includes(next)) continue;
          try {
            await ensurePublic(new URL(next), checkedHosts, allowLocal);
          } catch {
            continue;
          }
          queue.push(next);
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 180) : "";
        pages.push(blankPage(current, detail ? `page_open_failed: ${detail}` : "page_open_failed"));
      }
    }
  } finally {
    await browser.close();
  }

  return pages;
}

async function ensurePublic(url: URL, checkedHosts: Set<string>, allowLocal: boolean): Promise<void> {
  const host = url.hostname.toLowerCase();
  if (checkedHosts.has(host)) return;
  if (allowLocal && isLoopbackHost(host)) {
    checkedHosts.add(host);
    return;
  }
  await assertPublicPageUrl(url.toString());
  checkedHosts.add(host);
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
    screenshotFile: "",
    error,
  };
}
