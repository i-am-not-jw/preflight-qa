import Link from "next/link";
import { DiscoverForm } from "@/components/discover-form";
import { listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjects();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium text-stone-500">PreflightQA</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">기능 목록부터 봅니다</h1>
      <p className="mt-3 text-stone-700">
        공개된 웹앱 주소를 넣으면, 로그인 없이 보이는 페이지를 최대 15개 읽고 기능 목록 초안을 만듭니다.
        목록을 고치고, 테스트 케이스를 만들고, 실행하고, 리포트를 내는 단계는 다음입니다.
      </p>
      <div className="mt-8">
        <DiscoverForm />
      </div>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">이전에 살펴본 사이트</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">아직 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="text-stone-900 underline">
                  {project.url}
                </Link>
                <span className="ml-2 text-sm text-stone-500">
                  {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(project.createdAt),
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
