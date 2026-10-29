import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReport } from "./report.ts";

describe("report", () => {
  it("lists a reviewed feature and a manual check", () => {
    const report = buildReport({
      project: "example",
      features: [{ major: "Find a bus", middle: "language", minor: "-", description: "한국어, 영어, 일본어 설정" }],
      cases: [{ feature: "Learn more", type: "happy", mode: "manual", expected: "A help page opens" }],
      runs: [],
      baseline: null,
    });
    assert.equal(report.markdown.includes("Find a bus | language | - | 한국어, 영어, 일본어 설정"), true);
    assert.equal(report.markdown.includes("Manual checklist"), true);
    assert.equal(report.html.includes("<pre>"), true);
  });
});