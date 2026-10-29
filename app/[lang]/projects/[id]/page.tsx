import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t, translate, type Lang } from "@/lib/i18n";
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href={`/${lang}`} className="inline-block text-sm text-stone-500 underline">
        {t(lang, "back")}
      </Link>
      <p className="mt-4 text-sm font-medium text-stone-500">{t(lang, "draft")}</p>
      <h1 className="mt-1 break-all text-2xl font-semibold">{project.url}</h1>
      {project.description ? <p className="mt-2 text-stone-700">{project.description}</p> : null}

      {project.llmError ? (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {translate(lang, project.llmError)}
        </p>
      ) : (
        <p className="mt-6 text-stone-800">{project.summary}</p>
      )}

      {project.areas.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600">{t(lang, "no_areas")}</p>
      ) : (
        <FeatureList lang={lang} areas={project.areas} />
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t(lang, "pages", { count: project.pages.length })}</h2>
        <div className="mt-4 space-y-8">
          {project.pages.map((page) => (
            <article key={page.url} className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-medium">{page.title || page.url}</h3>
              <p className="mt-1 break-all text-sm text-stone-600">
                {page.url}
                {page.status ? ` · ${page.status}` : ""}
              </p>
              {page.error ? <p className="mt-2 text-sm text-red-700">{translate(lang, page.error)}</p> : null}
              {page.screenshotFile ? (
                <Image
                  src={`/api/projects/${project.id}/screenshot/${page.screenshotFile}`}
                  alt={t(lang, "screen", { title: page.title || page.url })}
                  width={1280}
                  height={800}
                  unoptimized
                  loading="eager"
                  className="mt-3 h-auto w-full rounded-lg border border-stone-200"
                />
              ) : null}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-stone-700">{t(lang, "read")}</summary>
                <p className="mt-2">
                  {t(lang, "headings")}: {page.headings.join(" · ") || t(lang, "none")}
                </p>
                <p className="mt-1">
                  {t(lang, "nav")}: {page.nav.join(" · ") || t(lang, "none")}
                </p>
                <p className="mt-1">
                  {t(lang, "buttons")}: {page.buttons.join(" · ") || t(lang, "none")}
                </p>
                <p className="mt-1">
                  {t(lang, "forms")}: {page.forms.length === 0 ? t(lang, "none") : t(lang, "form_count", { count: page.forms.length })}
                </p>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function FeatureList({
  lang,
  areas,
}: {
  lang: Lang;
  areas: { name: string; features: { name: string; description: string; pageUrl: string; foundBy: string }[] }[];
}) {
  return areas.map((area) => (
    <section key={area.name} className="mt-8">
      <h2 className="text-lg font-semibold">{area.name}</h2>
      <ul className="mt-3 space-y-3">
        {area.features.map((feature) => (
          <li key={`${area.name}-${feature.name}`} className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-medium">{feature.name}</h3>
            <p className="mt-1 text-stone-700">{feature.description}</p>
            <p className="mt-2 break-all text-sm">
              {t(lang, "page")}:{" "}
              <a href={feature.pageUrl} className="underline">
                {feature.pageUrl}
              </a>
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {t(lang, "evidence")}: {feature.foundBy}
            </p>
          </li>
        ))}
      </ul>
    </section>
  ));
}
