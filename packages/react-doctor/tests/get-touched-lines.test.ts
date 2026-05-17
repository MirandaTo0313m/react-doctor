import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  filterDiagnosticsByTouchedLines,
  getDiffInfo,
  getTouchedLines,
  parseUnifiedDiffTouchedLines,
} from "@react-doctor/core";
import type { Diagnostic } from "@react-doctor/types";

const runGit = (cwd: string, args: string[]): void => {
  const result = spawnSync("git", args, { cwd, stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString()}`);
  }
};

const SAMPLE_DIFF = `diff --git a/src/App.tsx b/src/App.tsx
index 1234567..abcdef0 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -5,0 +6,3 @@
+const added = 1;
+const alsoAdded = 2;
+const stillAdded = 3;
@@ -42,1 +45,1 @@
-old line
+new line
diff --git a/src/Other.tsx b/src/Other.tsx
index 222..333 100644
--- a/src/Other.tsx
+++ b/src/Other.tsx
@@ -10,0 +11,1 @@
+const single = "added";
`;

describe("parseUnifiedDiffTouchedLines", () => {
  it("extracts touched line ranges per file", () => {
    const byFile = parseUnifiedDiffTouchedLines(SAMPLE_DIFF);
    const appRanges = byFile.get("src/App.tsx");
    expect(appRanges).toBeDefined();
    expect(appRanges).toEqual([
      { startLine: 6, endLine: 8 },
      { startLine: 45, endLine: 45 },
    ]);

    const otherRanges = byFile.get("src/Other.tsx");
    expect(otherRanges).toEqual([{ startLine: 11, endLine: 11 }]);
  });

  it("returns an empty map for an empty diff", () => {
    expect(parseUnifiedDiffTouchedLines("")).toEqual(new Map());
  });

  it("does not reset state when a removed content line starts with `-- `", () => {
    // The removed line below renders as "--- old content" in the diff
    // body once the deletion prefix is prepended. A bare
    // `line.startsWith("--- ")` check would treat it as a file-header
    // reset and silently drop every subsequent hunk for this file.
    const diffWithDashedRemoval = `--- a/schema.sql
+++ b/schema.sql
@@ -3,2 +3,3 @@
-- old SQL comment
+-- new SQL comment
+SELECT 1;
@@ -10,0 +12,1 @@
+ALTER TABLE foo ADD COLUMN bar INT;
`;
    const byFile = parseUnifiedDiffTouchedLines(diffWithDashedRemoval);
    expect(byFile.get("schema.sql")?.length).toBe(2);
  });

  it("ignores pure-deletion hunks (count of 0 on the new file side)", () => {
    const deleteOnlyDiff = `--- a/foo.ts
+++ b/foo.ts
@@ -3,2 +3,0 @@
-only deletes
-here
`;
    const byFile = parseUnifiedDiffTouchedLines(deleteOnlyDiff);
    expect(byFile.get("foo.ts")).toEqual([]);
  });
});

describe("filterDiagnosticsByTouchedLines", () => {
  const projectRoot = "/repo";
  const buildDiagnostic = (filePath: string, line: number): Diagnostic => ({
    filePath,
    plugin: "react-doctor",
    rule: "no-array-index-as-key",
    severity: "error",
    message: "Array index used as React key",
    help: "",
    line,
    column: 1,
    category: "Correctness",
  });

  it("keeps diagnostics on touched lines and drops the rest", () => {
    const touched = parseUnifiedDiffTouchedLines(SAMPLE_DIFF);
    const onTouchedLine = buildDiagnostic(path.join(projectRoot, "src/App.tsx"), 7);
    const offTouchedLine = buildDiagnostic(path.join(projectRoot, "src/App.tsx"), 99);
    const offTouchedFile = buildDiagnostic(path.join(projectRoot, "src/Untouched.tsx"), 1);
    const filtered = filterDiagnosticsByTouchedLines(
      [onTouchedLine, offTouchedLine, offTouchedFile],
      touched,
      projectRoot,
    );
    expect(filtered).toEqual([onTouchedLine]);
  });

  it("handles relative file paths the same as absolute ones", () => {
    const touched = parseUnifiedDiffTouchedLines(SAMPLE_DIFF);
    const relative = buildDiagnostic("src/App.tsx", 6);
    const filtered = filterDiagnosticsByTouchedLines([relative], touched, projectRoot);
    expect(filtered).toEqual([relative]);
  });

  it("returns an empty array when no touched lines were collected", () => {
    const diagnostic = buildDiagnostic("src/App.tsx", 5);
    const filtered = filterDiagnosticsByTouchedLines([diagnostic], new Map(), projectRoot);
    expect(filtered).toEqual([]);
  });
});

describe("getDiffInfo + getTouchedLines integration", () => {
  let repoDirectory: string;

  beforeEach(() => {
    repoDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "rd-touched-lines-repo-"));
    runGit(repoDirectory, ["init", "--quiet", "-b", "main"]);
    runGit(repoDirectory, ["config", "user.email", "test@example.com"]);
    runGit(repoDirectory, ["config", "user.name", "Test"]);
    runGit(repoDirectory, ["commit", "--allow-empty", "-m", "init"]);
  });

  afterEach(() => {
    fs.rmSync(repoDirectory, { recursive: true, force: true });
  });

  it("captures staged-only changes in the touched-lines diff when isCurrentChanges is true", () => {
    const filePath = path.join(repoDirectory, "src/App.tsx");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "line1\nline2\nline3\nline4\n");
    runGit(repoDirectory, ["add", "."]);
    runGit(repoDirectory, ["commit", "-m", "add initial App.tsx"]);

    fs.writeFileSync(filePath, "line1\nstaged change\nline2\nline3\nline4\n");
    runGit(repoDirectory, ["add", "src/App.tsx"]);

    const diffInfo = getDiffInfo(repoDirectory);
    expect(diffInfo).not.toBeNull();
    expect(diffInfo?.isCurrentChanges).toBe(true);
    expect(diffInfo?.diffBaseRef).toBe("HEAD");

    const touched = getTouchedLines({
      directory: repoDirectory,
      baseRef: diffInfo?.diffBaseRef ?? null,
      filePaths: diffInfo?.changedFiles ?? [],
    });
    expect(touched.get("src/App.tsx")?.length ?? 0).toBeGreaterThan(0);
  });
});
