import { isLoopbackHost } from "../../lib/public-url.ts";

export type Step = {
  action: "goto" | "click" | "fill" | "expect_text" | "expect_visible" | "screenshot";
  text?: string;
  role?: string;
  value?: string;
  url?: string;
  name?: string;
};

const payment =
  /\b(pay|payment|purchase|buy now|place order|checkout|subscribe|donate|complete purchase)\b/i;
const submitLabel = /^(submit|send|sign up|register|log in|login|create account)$/i;

export function rejectStep(pageUrl: string, step: Step): string | null {
  if (step.action !== "click") return null;
  const label = `${step.text ?? ""} ${step.name ?? ""}`.trim();
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
