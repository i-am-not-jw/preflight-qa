export type ReportInput = {
  project: string;
  features: { major?: string; middle?: string; minor?: string; description?: string; name?: string; pageUrl?: string }[];
  cases: { feature?: string; type?: string; steps?: unknown[]; expected?: string; mode?: string }[];
  runs: { url?: string; ok?: boolean; steps?: { action?: string; ok?: boolean; detail?: string }[] }[];
  baseline: {
    url?: string;
    status?: number | null;
    loadMs?: number;
    consoleErrors?: string[];
    failedRequests?: { url: string; status?: number; error?: string }[];
    brokenLinks?: { url: string; status: number }[];
    mobileOverflow?: boolean;
  } | null;
};

function lines(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

export function buildReport(input: ReportInput): { markdown: string; html: string } {
  const manual = input.cases.filter((item) => item.mode === "manual");
  const featureLines = input.features.map((item) =>
    item.major || item.middle || item.minor
      ? [item.major || "-", item.middle || "-", item.minor || "-", item.description || ""].join(" | ")
      : `${item.name ?? "Untitled"}${item.description ? `: ${item.description}` : ""}`,
  );
  const caseLines = input.cases.map(
    (item) => `${item.mode ?? "auto"} ${item.type ?? ""} ${item.feature ?? ""} — ${item.expected ?? ""}`.trim(),
  );
  const runLines = input.runs.map((item) => `${item.ok ? "passed" : "failed"} ${item.url ?? ""}`.trim());
  const manualLines = manual.map((item) => `${item.feature ?? "Check"}: ${item.expected ?? ""}`.trim());
  const baselineLines = input.baseline
    ? [
        `Status ${input.baseline.status ?? "unknown"} in ${input.baseline.loadMs ?? "?"} ms`,
        `Console errors: ${(input.baseline.consoleErrors ?? []).length}`,
        `Failed requests: ${(input.baseline.failedRequests ?? []).length}`,
        `Broken same-domain links: ${(input.baseline.brokenLinks ?? []).length}`,
        `Mobile overflow at 390x844: ${input.baseline.mobileOverflow ? "yes" : "no"}`,
      ]
    : [];
  const markdown = [
    `# PreflightQA ${input.project}`,
    "",
    "## Features",
    lines(featureLines),
    "",
    "## Test cases",
    lines(caseLines),
    "",
    "## Auto runs",
    lines(runLines),
    "",
    "## Baseline",
    lines(baselineLines),
    "",
    "## Manual checklist",
    lines(manualLines),
    "",
  ].join("\n");
  const body = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>PreflightQA ${input.project.replace(/[&<>"]/g, "")}</title></head>
<body><pre>${body}</pre></body>
</html>
`;
  return { markdown, html };
}
