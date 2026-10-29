import type { Feature, FeatureArea, PageCapture } from "./types";

const SYSTEM = `당신은 QA 엔지니어입니다. 공개 페이지에서 읽은 내용만으로 기능 목록 초안을 만듭니다.
로그인 뒤에만 있을 법한 기능, 결제, 실제 데이터 제출은 추측하지 마세요.
메뉴, 버튼, 제목, 폼에 실제로 있는 것만 기능으로 적으세요.
답은 JSON 하나만 주세요. 문장은 한국어로 씁니다.
형식:
{"summary":"이 제품이 무엇인지 한 문단","areas":[{"name":"영역","features":[{"name":"기능","description":"사용자가 하는 일","pageUrl":"수집된 주소 중 하나","foundBy":"어떤 메뉴, 버튼, 제목, 폼에서 보였는지"}]}]}`;

export function parseModelJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("모델 답에서 기능 목록을 찾지 못했습니다.");
  }
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new Error("모델 답을 기능 목록으로 읽지 못했습니다.");
  }
}

export function normalizeDraft(value: unknown): { summary: string; areas: FeatureArea[] } {
  if (!value || typeof value !== "object") {
    throw new Error("모델이 기능 목록 형식으로 답하지 않았습니다.");
  }
  const record = value as { summary?: unknown; areas?: unknown };
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  if (!summary) throw new Error("모델이 제품 요약을 주지 않았습니다.");
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
}): Promise<{ summary: string; areas: FeatureArea[] }> {
  const key = process.env.LLM_API_KEY;
  if (!key) {
    throw new Error(
      "기능 초안을 만들 키가 없습니다. 프로젝트 폴더의 .env.local 파일에 LLM_API_KEY를 넣은 뒤 다시 살펴보세요.",
    );
  }
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
          { role: "system", content: SYSTEM },
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
      throw new Error("모델 응답이 60초 안에 오지 않았습니다.");
    }
    throw new Error("모델에 연결하지 못했습니다. LLM_BASE_URL과 네트워크를 확인해 주세요.");
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(`모델이 거절했습니다 (${response.status}). ${detail}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("모델이 빈 답을 보냈습니다.");
  return normalizeDraft(parseModelJson(text));
}
