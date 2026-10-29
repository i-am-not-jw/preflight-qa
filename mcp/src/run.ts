import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { isLoopbackHost, parsePageUrl, sameSite } from "../../lib/public-url.ts";
import { rejectStep, type Step } from "./safety.ts";

export type StepResult = { action: string; ok: boolean; detail?: string; screenshot?: string };

async function browser<T>(run: (page: Page) => Promise<T>): Promise<T> {
  const launched = await chromium.launch({ headless: true });
  try {
    const context = await launched.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(15_000);
    page.on("dialog", (dialog) => {
      void dialog.dismiss();
    });
    return await run(page);
  } finally {
    await launched.close();
  }
}

function locator(page: Page, step: Step) {
  const name = step.text || step.name || "";
  if (step.role === "button" || step.role === "link" || step.role === "textbox" || step.role === "heading") {
    return page.getByRole(step.role, { name, exact: false }).first();
  }
  if (step.name) return page.getByLabel(step.name, { exact: false }).first();
  return page.getByText(name, { exact: false }).first();
}

async function act(page: Page, step: Step, pageUrl: string, shotDir: string, shots: number): Promise<StepResult> {
  const blocked = rejectStep(pageUrl, step);
  if (blocked) return { action: step.action, ok: false, detail: blocked };
  if (step.action === "goto") {
    const next = parsePageUrl(step.url || step.text || pageUrl, { allowLocal: true });
    if (!isLoopbackHost(next.hostname) && !sameSite(new URL(pageUrl), next)) {
      return { action: step.action, ok: false, detail: "off_site" };
    }
    await page.goto(next.toString(), { waitUntil: "domcontentloaded" });
    return { action: step.action, ok: true, detail: page.url() };
  }
  if (step.action === "click") {
    const target = locator(page, step);
    if (!isLoopbackHost(new URL(page.url()).hostname)) {
      const submits = await target
        .locator("xpath=ancestor-or-self::input[@type='submit'] | ancestor-or-self::button[not(@type='button')][ancestor::form]")
        .count();
      if (submits) return { action: step.action, ok: false, detail: "submit_blocked" };
    }
    await target.click({ timeout: 8_000 });
    return { action: step.action, ok: true };
  }
  if (step.action === "fill") {
    await locator(page, step).fill(step.value ?? "", { timeout: 8_000 });
    return { action: step.action, ok: true };
  }
  if (step.action === "expect_text" || step.action === "expect_visible") {
    await locator(page, step).waitFor({ state: "visible", timeout: 8_000 });
    return { action: step.action, ok: true };
  }
  const file = path.join(shotDir, `shot-${shots + 1}.png`);
  await page.screenshot({ path: file, type: "png" });
  return { action: step.action, ok: true, screenshot: file };
}

export async function runCase(url: string, steps: Step[], shotDir: string) {
  const start = parsePageUrl(url, { allowLocal: true });
  await mkdir(shotDir, { recursive: true });
  return browser(async (page) => {
    await page.goto(start.toString(), { waitUntil: "domcontentloaded" });
    const results: StepResult[] = [];
    for (const step of steps) {
      try {
        const shots = results.filter((item) => item.screenshot).length;
        const result = await act(page, step, start.toString(), shotDir, shots);
        results.push(result);
        if (!result.ok) break;
      } catch (error) {
        results.push({
          action: step.action,
          ok: false,
          detail: error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 180) : "step_failed",
        });
        break;
      }
    }
    return { url: start.toString(), ok: results.every((item) => item.ok), steps: results };
  });
}

export async function baseline(url: string) {
  const start = parsePageUrl(url, { allowLocal: true });
  return browser(async (page) => {
    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status?: number; error?: string }[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
    });
    page.on("requestfailed", (request) => {
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() });
    });
    const started = Date.now();
    const response = await page.goto(start.toString(), { waitUntil: "domcontentloaded" });
    const loadMs = Date.now() - started;
    const hrefs = await page.evaluate<string[]>(
      "(() => [...document.querySelectorAll('a[href]')].map((el) => el.href).slice(0, 40))()",
    );
    const brokenLinks: { url: string; status: number }[] = [];
    const seen = new Set<string>();
    for (const href of hrefs) {
      if (brokenLinks.length >= 20 || seen.has(href)) continue;
      let link: URL;
      try {
        link = new URL(href);
      } catch {
        continue;
      }
      if (!sameSite(start, link)) continue;
      seen.add(href);
      try {
        const checked = await page.request.get(href, { timeout: 10_000 });
        if (checked.status() >= 400) brokenLinks.push({ url: href, status: checked.status() });
      } catch {
        brokenLinks.push({ url: href, status: 0 });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(start.toString(), { waitUntil: "domcontentloaded" });
    const mobileOverflow = await page.evaluate<boolean>(
      "(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)()",
    );
    return {
      url: start.toString(),
      status: response?.status() ?? null,
      loadMs,
      consoleErrors: consoleErrors.slice(0, 20),
      failedRequests: failedRequests.slice(0, 20),
      brokenLinks,
      mobileOverflow,
    };
  });
}
