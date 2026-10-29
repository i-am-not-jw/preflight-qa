import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rejectStep, type Step } from "./safety.ts";

const click = (text: string): Step => ({ action: "click", text });

describe("step safety", () => {
  it("blocks payment clicks and public form submits", () => {
    assert.equal(rejectStep("https://shop.example", click("Buy now")), "payment_blocked");
    assert.equal(rejectStep("http://localhost:3000", click("Buy now")), "payment_blocked");
    assert.equal(rejectStep("https://example.com", click("Submit")), "submit_blocked");
    assert.equal(rejectStep("http://127.0.0.1:3000", click("Submit")), null);
    assert.equal(rejectStep("https://example.com", click("Learn more")), null);
  });
});
