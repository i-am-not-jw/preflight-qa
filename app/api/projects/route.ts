import { discover } from "@/lib/discover";
import { isLang } from "@/lib/i18n";

export async function POST(request: Request) {
  let body: { url?: unknown; description?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof body.url !== "string" || !body.url.trim()) {
    return Response.json({ error: "missing_url" }, { status: 400 });
  }
  const description = typeof body.description === "string" ? body.description : "";
  const lang = typeof body.lang === "string" && isLang(body.lang) ? body.lang : "en";
  try {
    const project = await discover({ url: body.url, description, lang });
    return Response.json({ id: project.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "discover_fail";
    return Response.json({ error: message }, { status: 400 });
  }
}
