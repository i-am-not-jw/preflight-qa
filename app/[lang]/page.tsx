import { DiscoverForm } from "@/components/discover-form";
import { isLang, t } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium text-stone-500">PreflightQA</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(lang, "title")}</h1>
      <p className="mt-3 text-stone-700">{t(lang, "intro")}</p>
      <div className="mt-8">
        <DiscoverForm lang={lang} />
      </div>
    </main>
  );
}
