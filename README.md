# PreflightQA

Cursor나 Claude Code 채팅에서 쓰는 QA 보조 도구입니다. 별도 웹 화면은 켜지 않습니다. 웹 대시보드를 다시 쓸 때는 `backup/dashboard/README.md`를 봅니다.

채팅에 사이트 주소를 주면 도구가 첫 화면을 열고, 기능 목록 초안을 채팅에 보여 줍니다. 화면, 할 수 있는 일, 기대 결과는 사용자가 채웁니다. 안 되면과 중요도는 비워도 됩니다. 그 다음에 테스트 시나리오를 만들고, 자동으로 할 수 있는 것만 실행한 뒤 결과를 채팅에 적습니다.

로그인, 결제, 글을 남기는 제출은 하지 않습니다. 페이지마다 화면을 찍는 일은 보류입니다.

## 준비

1. `npm install`
2. `npx playwright install chromium`
3. `npm install --prefix mcp`

Cursor는 `.cursor/mcp.json`을 읽습니다. Claude Code에서는 저장소 루트에서 이렇게 등록합니다.

```
claude mcp add --scope project --transport stdio preflight-qa -- npx --prefix mcp tsx mcp/src/index.ts
```

진행 순서는 `mcp/INSTRUCTIONS.md`에 있습니다.

`npm test`는 주소 판별, 기능 초안, 실행 금지 규칙, 리포트 문장을 확인합니다.
