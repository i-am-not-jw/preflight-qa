import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { localizedPath } from "./lib/locale";

export function proxy(request: NextRequest) {
  const next = localizedPath(request.nextUrl.pathname);
  if (!next) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = next;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
