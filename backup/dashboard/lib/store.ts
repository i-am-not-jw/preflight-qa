import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "./types";

const projectsRoot = path.join(process.cwd(), "data", "projects");

export function projectDir(id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("결과를 찾지 못했습니다.");
  }
  return path.join(projectsRoot, id);
}

export async function saveProject(project: Project): Promise<void> {
  const dir = projectDir(project.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "project.json"), JSON.stringify(project, null, 2));
}

export async function readProject(id: string): Promise<Project | null> {
  let file: string;
  try {
    file = path.join(projectDir(id), "project.json");
  } catch {
    return null;
  }
  try {
    return JSON.parse(await readFile(file, "utf8")) as Project;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeProject(id: string): Promise<void> {
  await rm(projectDir(id), { recursive: true, force: true });
}
