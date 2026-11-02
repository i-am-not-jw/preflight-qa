import { notFound } from "next/navigation";
import { HtmlLang } from "@/components/html-lang";
import { isLang } from "@/lib/i18n";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <HtmlLang lang={lang} />
      {children}
    </>
  );
}
