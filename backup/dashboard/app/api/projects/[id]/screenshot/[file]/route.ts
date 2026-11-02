import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectDir } from "@/lib/store";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await ctx.params;
  if (!/^page-\d+\.png$/.test(file)) {
    return new Response("찾지 못했습니다.", { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(projectDir(id), file));
    return new Response(bytes, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("찾지 못했습니다.", { status: 404 });
  }
}
