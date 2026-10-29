# PreflightQA

로컬에서 켜는 QA 보조 도구입니다. 지금은 주소 입력과 기능 초안까지만 됩니다.

공개 주소를 넣으면 같은 사이트의 공개 페이지를 최대 15개 읽고, 페이지 제목, 제목글, 메뉴, 버튼, 링크, 폼, 화면 캡처를 모읍니다. 그다음 모델이 기능 목록 초안을 만듭니다. 로그인, 결제, 글을 남기는 제출은 하지 않습니다.

## 준비

1. `npm install`
2. `npx playwright install chromium`
3. `.env.example`을 `.env.local`로 복사하고 `LLM_API_KEY`를 채웁니다. 키가 없어도 페이지 수집은 되고, 기능 초안만 비어 있습니다.

## 실행

`npm run dev` 후 브라우저에서 http://localhost:3000/ko

한국어는 `/ko`, 영어는 `/en`입니다. 주소에 언어가 없으면 `/ko`로 갑니다.

공개 주소는 https://preflight.kogenote.com/ko 와 https://preflight.kogenote.com/en 입니다. 이 주소는 이 컴퓨터에서 `npm run dev`가 켜져 있을 때만 열립니다.

`npm test`는 주소 판별, 기능 초안 파싱, 언어 경로를 확인합니다.
