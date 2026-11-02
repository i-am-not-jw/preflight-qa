import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeDraft, parseModelJson } from "./features.ts";

describe("feature draft parsing", () => {
  it("reads JSON wrapped in an explanation", () => {
    const draft = normalizeDraft(
      parseModelJson(
        '초안입니다.\n```json\n{"summary":"예시 사이트","areas":[{"name":"안내","features":[{"name":"문서","description":"문서를 본다","pageUrl":"https://example.com","foundBy":"제목 Example"}]}]}\n```',
      ),
    );
    assert.equal(draft.summary, "예시 사이트");
    assert.equal(draft.areas[0].features[0].foundBy, "제목 Example");
  });

  it("drops a feature that has no evidence", () => {
    const draft = normalizeDraft({
      summary: "예시",
      areas: [{ name: "안내", features: [{ name: "문서", description: "본다" }] }],
    });
    assert.equal(draft.areas.length, 0);
  });
});
