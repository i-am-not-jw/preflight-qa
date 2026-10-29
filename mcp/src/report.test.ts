import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReport } from "./report.ts";

describe("report", () => {
  it("lists a reviewed feature and a manual check", () => {
    const report = buildReport({
      project: "example",
      features: [{ name: "Learn more", pageUrl: "https://example.com/" }],
      cases: [{ feature: "Learn more", type: "happy", mode: "manual", expected: "A help page opens" }],
      runs: [],
      baseline: null,
    });
    assert.equal(report.markdown.includes("Learn more"), true);
    assert.equal(report.markdown.includes("Manual checklist"), true);
    assert.equal(report.html.includes("<pre>"), true);
  });
});