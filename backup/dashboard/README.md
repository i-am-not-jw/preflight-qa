# 웹 대시보드 백업

이 폴더는 나중에 다시 쓸 수 있도록 치워 둔 웹 화면입니다. 지금 PreflightQA는 Cursor나 Claude Code 채팅으로만 씁니다.

다시 켜려면 아래 파일과 폴더를 저장소 루트로 되돌립니다.

- `app`, `components`
- `proxy.ts`, `next.config.ts`, `eslint.config.mjs`
- `lib/` 안의 파일을 저장소 `lib/`로

루트 `package.json`에 이 스크립트를 다시 넣습니다.

```
"dev": "next dev --port 3100",
"build": "next build",
"start": "next start --port 3100",
"lint": "eslint"
```

그다음 `npm run build`와 `npm start`로 http://localhost:3100/en 을 엽니다. Next.js 패키지는 루트 `package.json`에 그대로 있습니다.
