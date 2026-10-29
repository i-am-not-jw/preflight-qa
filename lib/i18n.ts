export const langs = ["ko", "en"] as const;
export type Lang = (typeof langs)[number];

const copy = {
  ko: {
    bad_url: "공개된 사이트 주소를 넣어 주세요.",
    bad_url_format: "주소 형식이 아닙니다. https:// 로 시작하는 공개 주소를 넣어 주세요.",
    credentials_in_url: "아이디나 비밀번호가 들어 있는 주소는 받지 않습니다.",
    http_only: "http 또는 https 주소만 살펴봅니다.",
    private_url: "공개된 사이트가 아닙니다. 집이나 회사 안의 주소는 살펴보지 않습니다.",
    local_url: "이 컴퓨터나 회사 안의 주소는 살펴보지 않습니다. 공개된 사이트 주소를 넣어 주세요.",
    dns_fail: "이 주소를 찾지 못했습니다.",
    browser_missing: "페이지를 열 브라우저가 없습니다. 터미널에서 npx playwright install chromium 을 실행한 뒤 다시 시도하세요.",
    browser_fail: "브라우저를 열지 못했습니다.",
    off_site: "같은 사이트의 페이지가 아니라서 내용을 저장하지 않았습니다.",
    not_public: "공개된 주소가 아니라서 내용을 저장하지 않았습니다.",
    page_open_failed: "이 페이지를 열지 못했습니다.",
    model_json_missing: "모델 답에서 기능 목록을 찾지 못했습니다.",
    model_json_bad: "모델 답을 기능 목록으로 읽지 못했습니다.",
    model_shape: "모델이 기능 목록 형식으로 답하지 않았습니다.",
    model_summary: "모델이 제품 요약을 주지 않았습니다.",
    no_key: "이 화면은 페이지와 화면 캡처를 보여주는 미리보기입니다. 기능 목록은 Claude Code나 Cursor에서 작성합니다.",
    model_timeout: "모델 응답이 60초 안에 오지 않았습니다.",
    model_connect: "모델에 연결하지 못했습니다. LLM_BASE_URL과 네트워크를 확인해 주세요.",
    model_rejected: "모델이 거절했습니다.",
    model_empty: "모델이 빈 답을 보냈습니다.",
    no_pages: "살펴볼 페이지를 찾지 못했습니다.",
    pages_unreadable: "페이지를 열지 못해서 기능 초안을 만들지 않았습니다.",
    discover_fail: "살펴보지 못했습니다.",
    bad_request: "요청을 읽지 못했습니다.",
    missing_url: "사이트 주소를 넣어 주세요.",
    network: "서버에 연결하지 못했습니다.",
    title: "기능 목록부터 봅니다",
    intro: "공개된 웹앱 주소를 넣으면, 로그인 없이 보이는 페이지를 최대 15개 읽고 기능 목록 초안을 만듭니다. 목록을 고치고, 테스트 케이스를 만들고, 실행하고, 리포트를 내는 단계는 다음입니다.",
    url_label: "사이트 주소",
    description_label: "이 제품이 무엇인지 (선택)",
    description_placeholder: "예: 팀이 일정을 공유하는 캘린더",
    submit: "기능 찾아보기",
    pending: "페이지를 살펴보는 중…",
    note: "로그인, 결제, 글을 남기는 제출은 하지 않습니다. 페이지가 많으면 1~2분 걸릴 수 있습니다.",
    back: "처음으로",
    missing: "이 결과를 찾지 못했습니다.",
    draft: "기능 초안",
    no_areas: "묶인 기능이 없습니다. 아래는 실제로 연 페이지입니다.",
    pages: "살펴본 페이지 ({count})",
    read: "이 페이지에서 읽은 것",
    headings: "제목",
    nav: "메뉴",
    buttons: "버튼",
    forms: "폼",
    none: "없음",
    form_count: "{count}개",
    page: "페이지",
    evidence: "근거",
    screen: "{title} 화면",
  },
  en: {
    bad_url: "Enter a public site address.",
    bad_url_format: "That address is not valid. Use a public address that starts with https://.",
    credentials_in_url: "Addresses that contain a username or password are not accepted.",
    http_only: "Only http and https addresses can be opened.",
    private_url: "That is not a public site. Addresses inside a home or office network are skipped.",
    local_url: "Addresses on this computer or a private network are skipped. Enter a public site address.",
    dns_fail: "That address could not be found.",
    browser_missing: "The browser that opens pages is not installed. Run npx playwright install chromium, then try again.",
    browser_fail: "The browser could not be opened.",
    off_site: "The page left this site, so its contents were not saved.",
    not_public: "The landing address was not public, so its contents were not saved.",
    page_open_failed: "This page could not be opened.",
    model_json_missing: "The model reply did not contain a feature list.",
    model_json_bad: "The model reply could not be read as a feature list.",
    model_shape: "The model did not reply in the feature list shape.",
    model_summary: "The model did not return a product summary.",
    no_key: "This page previews the pages and screenshots. The feature list is written in Claude Code or Cursor.",
    model_timeout: "The model did not reply within 60 seconds.",
    model_connect: "Could not reach the model. Check LLM_BASE_URL and the network.",
    model_rejected: "The model refused the request.",
    model_empty: "The model sent an empty reply.",
    no_pages: "No pages were found to open.",
    pages_unreadable: "The pages could not be opened, so no feature draft was made.",
    discover_fail: "The site could not be reviewed.",
    bad_request: "The request could not be read.",
    missing_url: "Enter a site address.",
    network: "Could not reach the server.",
    title: "Start with the feature list",
    intro: "Enter a public web app address. PreflightQA reads up to 15 pages that open without logging in, then drafts a feature list. Editing that list, writing test cases, running them, and the report come next.",
    url_label: "Site address",
    description_label: "What this product is (optional)",
    description_placeholder: "Example: a calendar a team uses to share schedules",
    submit: "Find features",
    pending: "Reading pages…",
    note: "It will not log in, pay, or submit a form. A large site can take a minute or two.",
    back: "Home",
    missing: "This result was not found.",
    draft: "Feature draft",
    no_areas: "No features were grouped. Below are the pages that actually opened.",
    pages: "Pages opened ({count})",
    read: "What was read on this page",
    headings: "Headings",
    nav: "Menu",
    buttons: "Buttons",
    forms: "Forms",
    none: "None",
    form_count: "{count}",
    page: "Page",
    evidence: "Found from",
    screen: "Screen of {title}",
  },
} as const;

export type CopyKey = keyof (typeof copy)["ko"];

export function isLang(value: string): value is Lang {
  return value === "ko" || value === "en";
}

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const table = copy[lang] as Record<string, string>;
  let text = table[key] ?? (copy.ko as Record<string, string>)[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function translate(lang: Lang, message: string | null | undefined): string {
  if (!message) return "";
  const ko = copy.ko as Record<string, string>;
  if (
    message ===
    "기능 초안을 만들 키가 없습니다. 프로젝트 폴더의 .env.local 파일에 LLM_API_KEY를 넣은 뒤 다시 살펴보세요."
  ) {
    return t(lang, "no_key");
  }
  if (ko[message]) return t(lang, message);
  // shortcut: results saved before language codes still hold the Korean sentence. Match it back to a code.
  const legacy = Object.keys(ko).find((key) => ko[key] === message);
  if (legacy) return t(lang, legacy);
  const split = message.indexOf(": ");
  if (split > 0 && (copy.ko as Record<string, string>)[message.slice(0, split)]) {
    return `${t(lang, message.slice(0, split))} ${message.slice(split + 2)}`;
  }
  return message;
}
