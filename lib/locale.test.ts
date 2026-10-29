import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { translate } from "./i18n.ts";
import { localizedPath } from "./locale.ts";

describe("locale path", () => {
  it("sends a bare path to Korean and leaves a language path alone", () => {
    assert.equal(localizedPath("/"), "/ko");
    assert.equal(localizedPath("/projects/abc"), "/ko/projects/abc");
    assert.equal(localizedPath("/en"), null);
    assert.equal(localizedPath("/en/projects/abc"), null);
    assert.equal(localizedPath("/api/projects"), null);
  });

  it("shows the same error in the selected language", () => {
    assert.equal(translate("en", "local_url").includes("public"), true);
    assert.equal(translate("ko", "browser_fail: timeout").startsWith("브라우저"), true);
    assert.equal(translate("en", "plain provider text"), "plain provider text");
    assert.equal(
      translate("en", "기능 초안을 만들 키가 없습니다. 프로젝트 폴더의 .env.local 파일에 LLM_API_KEY를 넣은 뒤 다시 살펴보세요."),
      translate("en", "no_key"),
    );
  });
});
