import Link from "next/link";
import type { Lang } from "@/lib/i18n";

export function LangSwitch({ lang, path }: { lang: Lang; path: string }) {
  const item = (code: Lang, label: string) =>
    lang === code ? (
      <span className="font-medium text-stone-900">{label}</span>
    ) : (
      <Link href={`/${code}${path}`} className="underline">
        {label}
      </Link>
    );

  return (
    <p className="text-sm text-stone-500">
      {item("ko", "한국어")}
      <span className="mx-2">·</span>
      {item("en", "English")}
    </p>
  );
}
