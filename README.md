# PreflightQA

로컬에서 켜는 QA 보조 도구입니다. 웹 화면은 시작 페이지의 주소와 클릭 결과를 텍스트로 남기는 미리보기입니다. 기능 목록 표는 Claude Code나 Cursor가 작성하고, 확인이 끝나면 `/en/features/<project>`에서 봅니다.

시작 페이지에서 같은 사이트의 주소와 해시 경로를 모으고, 보이는 링크와 버튼을 최대 20개까지 눌러 이동한 곳을 적습니다. 로그인, 결제, 글을 남기는 제출은 하지 않습니다. 페이지마다 화면을 찍는 일은 보류입니다.

## 준비

1. `npm install`
2. `npx playwright install chromium`
3. `npm install --prefix mcp`

## 실행

개발 중에는 `npm run dev` 후 http://localhost:3000/en 입니다.

공개 주소는 개발 서버로 켜면 폼이 동작하지 않습니다. 공개용은 아래처럼 운영 빌드로 켭니다.

```
npm run build
PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright" npm start
```

영어는 `/en`, 한국어는 `/ko`입니다. 주소에 언어가 없으면 `/en`으로 갑니다.

공개 주소는 https://preflight.kogenote.com/en 과 https://preflight.kogenote.com/ko 입니다. 이 주소는 이 컴퓨터에서 `npm start`가 켜져 있을 때만 열립니다.

`npm test`는 주소 판별, 기능 초안 파싱, 언어 경로, 실행 금지 규칙, 리포트 문장을 확인합니다.

## Claude Code와 Cursor

도구 서버는 `mcp/`에 있습니다. 저장소 루트에서 한 번 설치합니다.

```
npm install --prefix mcp
```

Cursor는 `.cursor/mcp.json`을 읽습니다. Claude Code에서는 저장소 루트에서 이렇게 등록합니다.

```
claude mcp add --scope project --transport stdio preflight-qa -- npx --prefix mcp tsx mcp/src/index.ts
```

진행 순서는 `mcp/INSTRUCTIONS.md`에 있습니다. 페이지를 읽고, 기능 목록을 사용자에게 확인받고, 테스트 케이스를 저장하고, 자동 항목만 실행한 뒤 리포트를 만듭니다.
