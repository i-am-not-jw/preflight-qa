import Image from "next/image";
import Link from "next/link";
import { readProject } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await readProject(id);
  if (!project) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>이 결과를 찾지 못했습니다.</p>
        <Link href="/" className="mt-4 inline-block underline">
          처음으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-stone-500 underline">
        처음으로
      </Link>
      <p className="mt-4 text-sm font-medium text-stone-500">기능 초안</p>
      <h1 className="mt-1 break-all text-2xl font-semibold">{project.url}</h1>
      {project.description ? <p className="mt-2 text-stone-700">{project.description}</p> : null}

      {project.llmError ? (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">{project.llmError}</p>
      ) : (
        <p className="mt-6 text-stone-800">{project.summary}</p>
      )}

      {project.areas.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600">묶인 기능이 없습니다. 아래는 실제로 연 페이지입니다.</p>
      ) : (
        project.areas.map((area) => (
          <section key={area.name} className="mt-8">
            <h2 className="text-lg font-semibold">{area.name}</h2>
            <ul className="mt-3 space-y-3">
              {area.features.map((feature) => (
                <li key={`${area.name}-${feature.name}`} className="rounded-xl bg-white p-4 shadow-sm">
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="mt-1 text-stone-700">{feature.description}</p>
                  <p className="mt-2 break-all text-sm">
                    페이지:{" "}
                    <a href={feature.pageUrl} className="underline">
                      {feature.pageUrl}
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-stone-600">근거: {feature.foundBy}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">살펴본 페이지 ({project.pages.length})</h2>
        <div className="mt-4 space-y-8">
          {project.pages.map((page) => (
            <article key={page.url} className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-medium">{page.title || page.url}</h3>
              <p className="mt-1 break-all text-sm text-stone-600">
                {page.url}
                {page.status ? ` · ${page.status}` : ""}
              </p>
              {page.error ? <p className="mt-2 text-sm text-red-700">{page.error}</p> : null}
              {page.screenshotFile ? (
                <Image
                  src={`/api/projects/${project.id}/screenshot/${page.screenshotFile}`}
                  alt={`${page.title || page.url} 화면`}
                  width={1280}
                  height={800}
                  unoptimized
                  loading="eager"
                  className="mt-3 h-auto w-full rounded-lg border border-stone-200"
                />
              ) : null}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-stone-700">이 페이지에서 읽은 것</summary>
                <p className="mt-2">제목: {page.headings.join(" · ") || "없음"}</p>
                <p className="mt-1">메뉴: {page.nav.join(" · ") || "없음"}</p>
                <p className="mt-1">버튼: {page.buttons.join(" · ") || "없음"}</p>
                <p className="mt-1">폼: {page.forms.length === 0 ? "없음" : `${page.forms.length}개`}</p>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
