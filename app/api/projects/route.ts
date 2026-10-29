import { discover } from "@/lib/discover";

export async function POST(request: Request) {
  let body: { url?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }
  if (typeof body.url !== "string" || !body.url.trim()) {
    return Response.json({ error: "사이트 주소를 넣어 주세요." }, { status: 400 });
  }
  const description = typeof body.description === "string" ? body.description : "";
  try {
    const project = await discover({ url: body.url, description });
    return Response.json({ id: project.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "살펴보지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
