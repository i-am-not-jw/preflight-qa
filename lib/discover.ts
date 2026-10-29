import { mkdir } from "node:fs/promises";
import { crawl } from "./crawl";
import { draftFeatures } from "./features";
import { assertPublicPageUrl } from "./public-url";
import { projectDir, removeProject, saveProject } from "./store";
import type { Project } from "./types";

export async function discover(input: { url: string; description: string }): Promise<Project> {
  const start = await assertPublicPageUrl(input.url);
  const id = crypto.randomUUID();
  const description = input.description.trim().slice(0, 500);
  await mkdir(projectDir(id), { recursive: true });

  try {
    const pages = await crawl(start, projectDir(id));
    if (pages.length === 0) {
      throw new Error("살펴볼 페이지를 찾지 못했습니다.");
    }
    const project: Project = {
      id,
      url: start.toString(),
      description,
      createdAt: new Date().toISOString(),
      summary: "",
      areas: [],
      pages,
      llmError: null,
    };
    const readable = pages.some((page) => !page.error);
    if (!readable) {
      project.llmError = "페이지를 열지 못해서 기능 초안을 만들지 않았습니다.";
    } else {
      try {
        const draft = await draftFeatures({ description, pages });
        project.summary = draft.summary;
        project.areas = draft.areas;
      } catch (error) {
        project.llmError = error instanceof Error ? error.message : "기능 초안을 만들지 못했습니다.";
      }
    }
    await saveProject(project);
    return project;
  } catch (error) {
    await removeProject(id);
    throw error;
  }
}
