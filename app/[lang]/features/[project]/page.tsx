import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t, type Lang } from "@/lib/i18n";
import { readFeatureTable, type FeatureRow } from "@/lib/feature-table";

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
        <FeatureRows lang={lang} rows={rows} />
      )}
    </main>
  );
}

function FeatureRows({ lang, rows }: { lang: Lang; rows: FeatureRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-stone-200 text-left">
            <th className="border border-stone-300 px-3 py-2">{t(lang, "major")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "middle")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "minor")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "feature_desc")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.major}-${row.middle}-${row.minor}-${index}`}>
              <td className="border border-stone-300 px-3 py-2 font-medium">{row.major}</td>
              <td className="border border-stone-300 px-3 py-2">{row.middle}</td>
              <td className="border border-stone-300 px-3 py-2">{row.minor}</td>
              <td className="border border-stone-300 px-3 py-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
