import type { FeatureRow } from "./feature-table.ts";
import type { ClickCapture } from "./types";

type DraftLang = "ko" | "en";

const skipped = new Set(["click_failed", "payment_blocked", "submit_blocked"]);
const languageName = /^(english|korean|japanese|한국어|영어|일본어|日本語)$/i;

function usable(clicks: ClickCapture[]): ClickCapture[] {
  return clicks.filter((click) => {
    if (skipped.has(click.to)) return false;
    if (click.href === "#main-content") return false;
    if (!click.href && click.to.startsWith("http")) return false;
    return true;
  });
}

function say(lang: DraftLang, ko: string, en: string): string {
  return lang === "ko" ? ko : en;
}

export function draftFeatureRows(
  pages: { clicks?: ClickCapture[] }[],
  lang: DraftLang,
): FeatureRow[] {
  const clicks = usable(pages[0]?.clicks ?? []);
  const find = clicks.find((click) => click.href === "#find");
  const finder = find?.text || "-";
  const languages = clicks.filter((click) => languageName.test(click.text));
  const maps = clicks.filter((click) => /google maps/i.test(click.text));
  const attractions = clicks.filter((click) => /attraction/i.test(click.text));
  const routes = clicks.filter((click) => {
    if (!click.to.startsWith("http") || click.href.startsWith("#")) return false;
    try {
      return new URL(click.to).pathname !== "/";
    } catch {
      return false;
    }
  });
  const night = routes.filter((click) => /night|야간/i.test(click.text));
  const day = routes.filter((click) => !night.includes(click));
  const sections = clicks.filter((click) => click.href.startsWith("#") && click.href !== "#find");
  const rows: FeatureRow[] = [];
  const add = (screen: string, action: string) => {
    rows.push({ screen, action, expected: "", otherwise: "", importance: "" });
  };

  if (languages.length > 0) add(finder, say(lang, "화면 언어를 바꾼다.", "Switch the page language."));
  if (day.length > 0) {
    add(finder, say(lang, "출발지에서 도착 지역으로 가는 노선을 고른다.", "Choose a route from the departure place to an area."));
  }
  if (night.length > 0) add(finder, say(lang, "밤에 운행하는 노선을 확인한다.", "Check which route runs at night."));
  for (const click of maps) add(finder, say(lang, "구글 맵에서 목적지를 연다.", "Open the destination in Google Maps."));
  if (attractions.length > 0) add(finder, say(lang, "주요 관광지를 목적지로 고른다.", "Choose a main attraction as the destination."));
  for (const click of sections) add(click.text || finder, say(lang, `${click.text} 화면을 연다.`, `Open the ${click.text} screen.`));
  return rows;
}
