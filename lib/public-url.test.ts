import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPrivateAddress, parsePageUrl, sameSite, shouldVisit } from "./public-url.ts";

const start = new URL("https://www.example.com/home");

describe("public urls", () => {
  it("adds https and treats www as the same site", () => {
    assert.equal(parsePageUrl("example.com/docs").href, "https://example.com/docs");
    assert.equal(sameSite(start, new URL("https://example.com/pricing")), true);
    assert.equal(sameSite(start, new URL("https://blog.example.com")), false);
  });

  it("rejects local, private, and non-page targets", () => {
    for (const input of [
      "http://localhost:3000",
      "http://127.0.0.1",
      "http://10.1.2.3",
      "http://192.168.0.5",
      "http://169.254.169.254",
      "http://user:pass@example.com",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "http://intranet",
      "http://127.1",
    ]) {
      assert.throws(() => parsePageUrl(input), Error, input);
    }
    assert.equal(isPrivateAddress("::1"), true);
    assert.equal(isPrivateAddress("8.8.8.8"), false);
    assert.equal(shouldVisit(start, "https://example.com/file.pdf"), null);
    assert.equal(shouldVisit(start, "https://other.example/docs"), null);
    assert.equal(shouldVisit(start, "https://example.com/docs#top"), "https://example.com/docs");
  });
});
