import Link from "next/link";
import { DiscoverForm } from "@/components/discover-form";
import { LangSwitch } from "@/components/lang-switch";
import { formatWhen, isLang, t } from "@/lib/i18n";
import { listProjects } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const projects = await listProjects();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <LangSwitch lang={lang} path="" />
      <p className="mt-4 text-sm font-medium text-stone-500">PreflightQA</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(lang, "title")}</h1>
      <p className="mt-3 text-stone-700">{t(lang, "intro")}</p>
      <div className="mt-8">
        <DiscoverForm lang={lang} />
      </div>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t(lang, "past")}</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">{t(lang, "empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/${lang}/projects/${project.id}`} className="text-stone-900 underline">
                  {project.url}
                </Link>
                <span className="ml-2 text-sm text-stone-500">{formatWhen(lang, project.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
