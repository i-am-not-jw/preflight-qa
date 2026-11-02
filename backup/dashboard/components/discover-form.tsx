"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { t, translate, type Lang } from "@/lib/i18n";

export function DiscoverForm({ lang }: { lang: Lang }) {
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
          lang,
        }),
      });
      const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !body?.id) {
        setError(translate(lang, body?.error ?? "discover_fail"));
        setPending(false);
        return;
      }
      router.push(`/${lang}/projects/${body.id}`);
    } catch {
      setError(t(lang, "network"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="url" className="block text-sm font-medium">
          {t(lang, "url_label")}
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
          {t(lang, "description_label")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder={t(lang, "description_placeholder")}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? t(lang, "pending") : t(lang, "submit")}
      </button>
      <p className="text-sm text-stone-600">{t(lang, "note")}</p>
    </form>
  );
}
