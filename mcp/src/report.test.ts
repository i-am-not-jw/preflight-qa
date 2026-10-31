import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReport } from "./report.ts";

describe("report", () => {
  it("lists a reviewed feature and a manual check", () => {
    const report = buildReport({
      project: "example",
      features: [{ screen: "Find a bus", action: "화면 언어를 바꾼다.", expected: "선택한 언어로 다시 보인다.", otherwise: "", importance: "필수" }],
      cases: [{ feature: "Learn more", type: "happy", mode: "manual", expected: "A help page opens" }],
      runs: [],
      baseline: null,
    });
    assert.equal(report.markdown.includes("Find a bus | 화면 언어를 바꾼다. | 선택한 언어로 다시 보인다. |  | 필수"), true);
    assert.equal(report.markdown.includes("Manual checklist"), true);
    assert.equal(report.html.includes("<pre>"), true);
  });
});