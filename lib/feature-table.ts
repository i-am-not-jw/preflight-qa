import { readFile } from "node:fs/promises";
import path from "node:path";

export type FeatureRow = {
  screen: string;
  action: string;
  expected: string;
  otherwise: string;
  importance: string;
};

export async function readFeatureTable(project: string): Promise<FeatureRow[] | null> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(project)) return null;
  try {
    const raw = JSON.parse(
      await readFile(path.join(process.cwd(), ".preflight", project, "features.json"), "utf8"),
    ) as { features?: FeatureRow[] };
    return Array.isArray(raw.features) ? raw.features : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
