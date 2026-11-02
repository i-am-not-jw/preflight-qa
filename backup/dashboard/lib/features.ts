import type { Lang } from "./i18n";
import type { Feature, FeatureArea, PageCapture } from "./types";

function system(lang: Lang) {
  const language = lang === "en" ? "English" : "Korean";
  return `You are a QA engineer. Draft a feature list only from the public pages you were given.
Do not guess features that would exist only after login, payment, or submitting real data.
Use only menus, buttons, headings, and forms that are actually present.
Reply with one JSON object and nothing else. Write every sentence in ${language}.
Shape:
{"summary":"one paragraph on what this product is","areas":[{"name":"area","features":[{"name":"feature","description":"what the user does","pageUrl":"one of the collected urls","foundBy":"which menu, button, heading, or form showed it"}]}]}`;
}

export function parseModelJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("model_json_missing");
  }
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new Error("model_json_bad");
  }
}

export function normalizeDraft(value: unknown): { summary: string; areas: FeatureArea[] } {
  if (!value || typeof value !== "object") {
    throw new Error("model_shape");
  }
  const record = value as { summary?: unknown; areas?: unknown };
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  if (!summary) throw new Error("model_summary");
  const areas: FeatureArea[] = [];
  if (Array.isArray(record.areas)) {
    for (const area of record.areas) {
      if (!area || typeof area !== "object") continue;
      const areaRecord = area as { name?: unknown; features?: unknown };
      const name = typeof areaRecord.name === "string" ? areaRecord.name.trim() : "";
      const features = Array.isArray(areaRecord.features)
        ? areaRecord.features.flatMap((feature) => {
            const cleaned = cleanFeature(feature);
            return cleaned ? [cleaned] : [];
          })
        : [];
      // shortcut: 영역 20개, 영역당 기능 12개까지만 남긴다. 초안이 그보다 길면 그때 늘린다.
      if (name && features.length) areas.push({ name, features: features.slice(0, 12) });
      if (areas.length >= 20) break;
    }
  }
  return { summary, areas };
}

function cleanFeature(value: unknown): Feature | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const pageUrl = typeof item.pageUrl === "string" ? item.pageUrl.trim() : "";
  const foundBy = typeof item.foundBy === "string" ? item.foundBy.trim() : "";
  if (!name || !description || !pageUrl || !foundBy) return null;
  return { name, description, pageUrl, foundBy };
}

export async function draftFeatures(input: {
  description: string;
  pages: PageCapture[];
  lang: Lang;
}): Promise<{ summary: string; areas: FeatureArea[] }> {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error("no_key");
  const base = (process.env.LLM_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "grok-4";
  // shortcut: 토큰 상한과 JSON 모드 플래그는 없다. 답이 잘리거나 설명 문장에 감싸지면 그때 넣는다.
  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system(input.lang) },
          {
            role: "user",
            content: JSON.stringify({
              description: input.description,
              pages: input.pages.filter((page) => !page.error).map((page) => ({
                url: page.url,
                title: page.title,
                headings: page.headings,
                nav: page.nav,
                buttons: page.buttons,
                links: page.links.map((link) => link.text).filter(Boolean),
                forms: page.forms,
              })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("model_timeout");
    }
    throw new Error("model_connect");
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(`model_rejected: ${response.status} ${detail}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("model_empty");
  return normalizeDraft(parseModelJson(text));
}
