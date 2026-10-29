"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function DiscoverForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.get("url"),
          description: data.get("description") ?? "",
        }),
      });
      const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "살펴보지 못했습니다.");
        setPending(false);
        return;
      }
      router.push(`/projects/${body.id}`);
    } catch {
      setError("서버에 연결하지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="url" className="block text-sm font-medium">
          사이트 주소
        </label>
        <input
          id="url"
          name="url"
          type="text"
          required
          placeholder="https://example.com"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          이 제품이 무엇인지 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="예: 팀이 일정을 공유하는 캘린더"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? "페이지를 살펴보는 중…" : "기능 찾아보기"}
      </button>
      <p className="text-sm text-stone-600">
        로그인, 결제, 글을 남기는 제출은 하지 않습니다. 페이지가 많으면 1~2분 걸릴 수 있습니다.
      </p>
    </form>
  );
}
