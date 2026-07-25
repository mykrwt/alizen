import type { FileNode } from "@/lib/types";
import { saveAs } from "file-saver";
import JSZip from "jszip";

/** Bundle a project's files into a ZIP and trigger a browser download. */
export async function downloadZip(name: string, files: FileNode[]): Promise<void> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.path, file.content);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${slug(name) || "alize-project"}.zip`);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
