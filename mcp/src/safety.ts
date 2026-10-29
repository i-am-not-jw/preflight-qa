import { blockedClick } from "../../lib/click-block.ts";

export type Step = {
  action: "goto" | "click" | "fill" | "expect_text" | "expect_visible" | "screenshot";
  text?: string;
  role?: string;
  value?: string;
  url?: string;
  name?: string;
};

export function rejectStep(pageUrl: string, step: Step): string | null {
  if (step.action !== "click") return null;
  return blockedClick(pageUrl, `${step.text ?? ""} ${step.name ?? ""}`);
}
