import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureTableView } from "@/components/feature-table-view";
import { readFeatureTable } from "@/lib/feature-table";
import { isLang, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function FeatureTablePage({
  params,
}: {
  params: Promise<{ lang: string; project: string }>;
}) {
  const { lang, project } = await params;
  if (!isLang(lang)) notFound();
  const rows = await readFeatureTable(project);
  if (!rows) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>{t(lang, "missing")}</p>
        <Link href={`/${lang}`} className="mt-4 inline-block underline">
          {t(lang, "back")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href={`/${lang}`} className="inline-block text-sm text-stone-500 underline">
        {t(lang, "back")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{project}</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600">{t(lang, "empty_table")}</p>
      ) : (
        <FeatureTableView lang={lang} rows={rows} />
      )}
    </main>
  );
}
