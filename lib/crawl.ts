import path from "node:path";
import { chromium } from "playwright";
import { assertPublicPageUrl, shouldVisit } from "./public-url";
import type { PageCapture } from "./types";

const MAX_PAGES = 15;

export async function crawl(start: URL, dir: string): Promise<PageCapture[]> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    if (detail.includes("Executable doesn't exist") || detail.includes("Please run the following command")) {
      throw new Error("페이지를 열 브라우저가 없습니다. 터미널에서 npx playwright install chromium 을 실행한 뒤 다시 시도하세요.");
    }
    throw new Error(detail ? `브라우저를 열지 못했습니다. ${detail.slice(0, 180)}` : "브라우저를 열지 못했습니다.");
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

    while (queue.length > 0 && pages.length < MAX_PAGES) {
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
          pages.push(blankPage(current, "같은 사이트의 페이지가 아니라서 내용을 저장하지 않았습니다."));
          continue;
        }
        try {
          await ensurePublic(landed, checkedHosts);
        } catch {
          pages.push(blankPage(current, "공개된 주소가 아니라서 내용을 저장하지 않았습니다."));
          continue;
        }
        const extracted = await page.evaluate(() => {
          const clip = (value: string | null | undefined, max: number) =>
            (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
          const visible = (el: Element) => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          };
          const fieldLabel = (el: Element) => {
            const id = el.getAttribute("id");
            const from = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
            const wrap = el.closest("label");
            return clip(
              from?.textContent || wrap?.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder"),
              80,
            );
          };
          const headings = [...document.querySelectorAll("h1, h2, h3")]
            .filter(visible)
            .map((el) => clip(el.textContent, 120))
            .filter(Boolean)
            .slice(0, 30);
          const nav = [...document.querySelectorAll("nav a, header a")]
            .filter(visible)
            .map((el) => clip(el.textContent, 80))
            .filter(Boolean)
            .slice(0, 30);
          const buttons = [...document.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button']")]
            .filter(visible)
            .map((el) => clip(el.textContent || el.getAttribute("value") || el.getAttribute("aria-label"), 80))
            .filter(Boolean)
            .slice(0, 30);
          const anchors = [...document.querySelectorAll("a[href]")].filter(visible);
          const links = anchors.slice(0, 30).map((el) => ({
            text: clip(el.textContent, 80),
            href: (el as HTMLAnchorElement).href,
          }));
          const forms = [...document.querySelectorAll("form")]
            .filter(visible)
            .slice(0, 8)
            .map((form) => ({
              method: (form.getAttribute("method") || "get").toLowerCase(),
              action: (form as HTMLFormElement).action,
              fields: [...form.querySelectorAll("input, textarea, select")]
                .filter((el) => el.getAttribute("type") !== "hidden")
                .slice(0, 20)
                .map((el) => ({
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
            hrefs: anchors.map((el) => (el as HTMLAnchorElement).href).slice(0, 200),
          };
        });
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
            await ensurePublic(new URL(next), checkedHosts);
          } catch {
            continue;
          }
          queue.push(next);
        }
      } catch {
        pages.push(blankPage(current, "이 페이지를 열지 못했습니다."));
      }
    }
  } finally {
    await browser.close();
  }

  return pages;
}

async function ensurePublic(url: URL, checkedHosts: Set<string>): Promise<void> {
  const host = url.hostname.toLowerCase();
  if (checkedHosts.has(host)) return;
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
