import { cn } from "@/lib/utils";
import { filesToTree } from "@/lib/webcontainer/runner";
import { describe, expect, it } from "vitest";

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("foo", false && "no", "bar")).toBe("foo bar");
  });
});

describe("filesToTree", () => {
  it("nests flat FileNodes into the WebContainer tree shape", () => {
    const tree = filesToTree([
      { path: "src/App.tsx", content: "export default () => null;" },
      { path: "index.html", content: "<html />" },
    ]) as { [k: string]: { file?: { contents?: string } } };

    expect(Object.keys(tree).sort()).toEqual(["index.html", "src"]);
    expect(tree["index.html"]?.file?.contents).toBe("<html />");
    const src = tree.src as unknown as { [k: string]: { file: { contents: string } } };
    expect(src["App.tsx"].file.contents).toBe("export default () => null;");
  });
});
