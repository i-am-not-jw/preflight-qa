import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const FILE_EXT =
  /\.(pdf|zip|gz|tgz|png|jpe?g|gif|webp|svg|ico|css|js|mjs|mp4|mp3|woff2?|dmg|apk|xml|txt)(\?|#|$)/i;

// shortcut: www와 맨 도메인만 같은 사이트로 본다. 서브도메인은 따라가지 않는다. 앱이 app.과 www.로 나뉘면 그때 넓힌다.
export function sameSite(start: URL, candidate: URL): boolean {
  return siteHost(start.hostname) === siteHost(candidate.hostname);
}

export function isPrivateAddress(ip: string): boolean {
  let value = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) value = mapped[1];
  if (value.includes(":")) {
    return (
      value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe80")
    );
  }
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function parsePageUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("bad_url");
  }
  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("bad_url_format");
  }
  if (url.username || url.password) {
    throw new Error("credentials_in_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http_only");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new Error("private_url");
    }
    return url;
  }
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".") ||
    /^\d+$/.test(host) ||
    /^0x/i.test(host) ||
    (/^[\d.]+$/.test(host) && !isIP(host))
  ) {
    throw new Error("local_url");
  }
  return url;
}

export async function assertPublicPageUrl(input: string): Promise<URL> {
  const url = parsePageUrl(input);
  if (isIP(url.hostname)) return url;
  let addresses: { address: string }[];
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("dns_fail");
  }
  if (addresses.length === 0 || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("private_url");
  }
  return url;
}

export function shouldVisit(start: URL, raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw, start);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!sameSite(start, url)) return null;
  if (FILE_EXT.test(url.pathname)) return null;
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function siteHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}
