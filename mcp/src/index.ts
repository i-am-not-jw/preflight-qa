import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { crawl } from "../../lib/crawl.ts";
import { parsePageUrl } from "../../lib/public-url.ts";
import { buildReport } from "./report.ts";
import { baseline, runCase } from "./run.ts";
import type { Step } from "./safety.ts";
import { projectPath, readJson, root, writeJson } from "./store.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const instructions = await readFile(path.join(here, "../INSTRUCTIONS.md"), "utf8");

const stepSchema = z.object({
  action: z.enum(["goto", "click", "fill", "expect_text", "expect_visible", "screenshot"]),
  text: z.string().optional(),
  role: z.enum(["button", "link", "textbox", "heading"]).optional(),
  value: z.string().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
});

const featureSchema = z.object({
  major: z.string(),
  middle: z.string(),
  minor: z.string(),
  description: z.string(),
});

const caseSchema = z.object({
  feature: z.string(),
  type: z.enum(["happy", "negative", "edge"]),
  steps: z.array(z.union([z.string(), stepSchema])),
  expected: z.string(),
  mode: z.enum(["auto", "manual"]),
});

export async function crawlSite(url: string) {
  const start = parsePageUrl(url, { allowLocal: true });
  const pages = await crawl(start, { allowLocal: true });
  return {
    pages: pages.map((page) => ({
      url: page.url,
      status: page.status,
      title: page.title,
      headings: page.headings,
      nav: page.nav,
      buttons: page.buttons,
      links: page.links,
      formFields: page.forms.flatMap((form) =>
        form.fields.map((field) => ({ ...field, method: form.method, action: form.action })),
      ),
      paths: page.paths,
      clicks: page.clicks,
      error: page.error,
    })),
  };
}

function textResult(value: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
  };
}

async function saved<T>(file: string, value: T) {
  await writeJson(file, value);
  return { file };
}

const server = new McpServer(
  { name: "preflight-qa", version: "0.1.0" },
  { instructions: "You write the feature list and test cases. Tools browse, save, run, and report. Follow the preflight prompt." },
);

server.registerPrompt(
  "preflight",
  { description: "Review a site: crawl, review features, test, and report." },
  () => ({ messages: [{ role: "user", content: { type: "text", text: instructions } }] }),
);

server.registerTool(
  "crawl_site",
  {
    description:
      "Open the start page without logging in or submitting forms. Localhost is allowed. Returns same-site addresses, including hashes, and where up to 20 clicks go. Does not take screenshots or follow the site map.",
    inputSchema: {
      url: z.string().describe("Site URL. http://localhost is allowed."),
    },
  },
  async ({ url }) => {
    try {
      return textResult(await crawlSite(url));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "crawl_failed", true);
    }
  },
);

server.registerTool(
  "save_feature_list",
  {
    description:
      "Save the reviewed feature table. Each row has major, middle, minor, and description. Use - for an empty cell.",
    inputSchema: {
      project: z.string().describe("Short project name, such as example."),
      features: z.array(featureSchema),
    },
  },
  async ({ project, features }) => {
    try {
      const file = path.join(projectPath(project), "features.json");
      return textResult(await saved(file, { features }));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "save_failed", true);
    }
  },
);

server.registerTool(
  "save_test_cases",
  {
    description: "Save test cases. Auto steps use goto, click, fill, expect_text, expect_visible, and screenshot.",
    inputSchema: {
      project: z.string(),
      cases: z.array(caseSchema),
    },
  },
  async ({ project, cases }) => {
    try {
      const file = path.join(projectPath(project), "cases.json");
      return textResult(await saved(file, { cases }));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "save_failed", true);
    }
  },
);

server.registerTool(
  "run_test_case",
  {
    description:
      "Run one auto case. Does not pay or submit a form on a site the user does not own. Pass project to keep the result for the report.",
    inputSchema: {
      url: z.string(),
      steps: z.array(stepSchema),
      project: z.string().optional(),
    },
  },
  async ({ url, steps, project }) => {
    try {
      const shotDir = project
        ? path.join(projectPath(project), "shots", randomUUID())
        : path.join(root, ".preflight", "shots", randomUUID());
      const result = await runCase(url, steps as Step[], shotDir);
      if (project) {
        const file = path.join(projectPath(project), "runs.json");
        const prior = (await readJson<{ runs: unknown[] }>(file)) ?? { runs: [] };
        prior.runs.push(result);
        await writeJson(file, prior);
      }
      return textResult(result, !result.ok);
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "run_failed", true);
    }
  },
);

server.registerTool(
  "baseline_checks",
  {
    description:
      "Load the page and report status, time, console errors, failed requests, broken same-domain links, and mobile overflow at 390x844.",
    inputSchema: {
      url: z.string(),
      project: z.string().optional(),
    },
  },
  async ({ url, project }) => {
    try {
      const result = await baseline(url);
      if (project) await writeJson(path.join(projectPath(project), "baseline.json"), result);
      return textResult(result);
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "baseline_failed", true);
    }
  },
);

server.registerTool(
  "write_report",
  {
    description: "Write Markdown and HTML reports from the saved project files.",
    inputSchema: { project: z.string() },
  },
  async ({ project }) => {
    try {
      const dir = projectPath(project);
      const features = (await readJson<{
        features: { major?: string; middle?: string; minor?: string; description?: string; name?: string }[];
      }>(path.join(dir, "features.json"))) ?? { features: [] };
      const cases = (await readJson<{ cases: { feature?: string; type?: string; steps?: unknown[]; expected?: string; mode?: string }[] }>(
        path.join(dir, "cases.json"),
      )) ?? { cases: [] };
      const runs = (await readJson<{ runs: { url?: string; ok?: boolean; steps?: { action?: string; ok?: boolean; detail?: string }[] }[] }>(
        path.join(dir, "runs.json"),
      )) ?? { runs: [] };
      const baselineFile = await readJson<{
        url?: string;
        status?: number | null;
        loadMs?: number;
        consoleErrors?: string[];
        failedRequests?: { url: string; status?: number; error?: string }[];
        brokenLinks?: { url: string; status: number }[];
        mobileOverflow?: boolean;
      }>(path.join(dir, "baseline.json"));
      const report = buildReport({
        project,
        features: features.features,
        cases: cases.cases,
        runs: runs.runs,
        baseline: baselineFile,
      });
      const markdown = path.join(dir, "report.md");
      const html = path.join(dir, "report.html");
      await mkdir(dir, { recursive: true });
      await writeFile(markdown, report.markdown);
      await writeFile(html, report.html);
      return textResult({ markdown, html });
    } catch (error) {
      return textResult(error instanceof Error ? error.message : "report_failed", true);
    }
  },
);

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  await server.connect(new StdioServerTransport());
}
