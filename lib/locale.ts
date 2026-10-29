export function localizedPath(pathname: string): string | null {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return null;
  }
  const first = pathname.split("/")[1] ?? "";
  if (first === "ko" || first === "en") return null;
  if (pathname === "/") return "/en";
  return `/en${pathname}`;
}
