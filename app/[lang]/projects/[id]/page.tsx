import Link from "next/link";
import { notFound } from "next/navigation";
import { draftFeatureRows } from "@/lib/feature-rows";
import type { FeatureRow } from "@/lib/feature-table";
import { isLang, t, type Lang } from "@/lib/i18n";
import { readProject } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const project = await readProject(id);
  if (!project) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>{t(lang, "missing")}</p>
        <Link href={`/${lang}`} className="mt-4 inline-block underline">
          {t(lang, "back")}
        </Link>
      </main>
    );
  }

  const rows = draftFeatureRows(project.pages, lang);
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href={`/${lang}`} className="inline-block text-sm text-stone-500 underline">
        {t(lang, "back")}
      </Link>
      <p className="mt-4 break-all text-sm text-stone-500">{project.url}</p>
      <h1 className="mt-1 text-2xl font-semibold">{t(lang, "draft")}</h1>
      {project.description ? <p className="mt-2 text-stone-700">{project.description}</p> : null}
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600">{t(lang, "no_areas")}</p>
      ) : (
        <FeatureTable lang={lang} rows={rows} />
      )}

      <details className="mt-10 text-sm text-stone-600">
        <summary className="cursor-pointer">{t(lang, "paths")}</summary>
        <div className="mt-4 space-y-6">
          {project.pages.map((page) => (
            <article key={page.url}>
              <p className="break-all">
                {page.url}
                {page.status ? ` · ${page.status}` : ""}
              </p>
              <ul className="mt-2 space-y-1 break-all">
                {(page.paths ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </details>
    </main>
  );
}

function FeatureTable({ lang, rows }: { lang: Lang; rows: FeatureRow[] }) {
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
            <tr key={`${row.major}-${row.middle}-${row.minor}-${index}`} className="bg-white">
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

