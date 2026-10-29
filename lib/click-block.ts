import { isLoopbackHost } from "./public-url.ts";

const payment =
  /\b(pay|payment|purchase|buy now|place order|checkout|subscribe|donate|complete purchase)\b/i;
const submitLabel = /^(submit|send|sign up|register|log in|login|create account)$/i;

export function blockedClick(pageUrl: string, text: string): string | null {
  const label = text.trim();
  if (payment.test(label)) return "payment_blocked";
  let host = "";
  try {
    host = new URL(pageUrl).hostname;
  } catch {
    host = "";
  }
  if (!isLoopbackHost(host) && submitLabel.test(label)) return "submit_blocked";
  return null;
}
