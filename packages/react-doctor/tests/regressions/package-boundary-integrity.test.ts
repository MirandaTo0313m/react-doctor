/**
 * Regression tests for the post-`@react-doctor/*`-extraction package
 * boundaries.
 *
 * Covered:
 *   #249 — any name exported by BOTH `@react-doctor/project-info` and
 *          `@react-doctor/core` must be the SAME runtime reference
 *          (i.e. core re-exports it; it isn't re-declared).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import * as core from "@react-doctor/core";
import * as projectInfo from "@react-doctor/project-info";

const CORE_SRC_DIR = path.resolve(import.meta.dirname, "..", "..", "..", "core", "src");

const collectTypeScriptSources = (rootDir: string): Map<string, string> => {
  const sourcesByRelativePath = new Map<string, string>();
  const directoriesToWalk: string[] = [rootDir];
  while (directoriesToWalk.length > 0) {
    const currentDirectory = directoriesToWalk.pop();
    if (currentDirectory === undefined) continue;
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        directoriesToWalk.push(entryPath);
        continue;
      }
      if (!entry.name.endsWith(".ts")) continue;
      sourcesByRelativePath.set(
        path.relative(rootDir, entryPath),
        fs.readFileSync(entryPath, "utf8"),
      );
    }
  }
  return sourcesByRelativePath;
};

const CORE_SOURCES = collectTypeScriptSources(CORE_SRC_DIR);

const findCoreOwnDeclarations = (exportName: string): string[] => {
  // ^export\s+const\s+<name>\b matches a top-of-line declaration only,
  // so a re-export line like `export { NAME } from "..."` is skipped.
  const declarationPattern = new RegExp(String.raw`^export\s+const\s+${exportName}\b`, "m");
  const filesWithOwnDeclaration: string[] = [];
  for (const [relativePath, sourceText] of CORE_SOURCES) {
    if (declarationPattern.test(sourceText)) {
      filesWithOwnDeclaration.push(relativePath);
    }
  }
  return filesWithOwnDeclaration;
};

describe("shared exports between @react-doctor/core and @react-doctor/project-info (#249)", () => {
  const projectInfoExportNames = new Set(Object.keys(projectInfo));
  const sharedExportNames = Object.keys(core)
    .filter((exportName) => projectInfoExportNames.has(exportName))
    .sort();

  it("there is at least one shared runtime export to validate", () => {
    expect(sharedExportNames.length).toBeGreaterThan(0);
  });

  it("every shared export is re-exported (not re-declared) by core", () => {
    const boundaryViolations: string[] = [];
    for (const sharedExportName of sharedExportNames) {
      const coreValue = Reflect.get(core, sharedExportName);
      const projectInfoValue = Reflect.get(projectInfo, sharedExportName);
      // HACK: a `export type { X } from "..."` slip leaves both lookups
      // as `undefined`; `undefined === undefined` would let drift sneak
      // past. Require runtime presence first.
      if (coreValue === undefined || projectInfoValue === undefined) {
        boundaryViolations.push(
          `${sharedExportName}: present at type-level only — use a value re-export`,
        );
        continue;
      }
      // HACK: `Object.is` catches re-declaration for object-typed
      // constants (RegExp, Set, etc.) because each `new X(...)` returns
      // a fresh reference, but it's blind for primitives:
      // `Object.is(52428800, 52428800)` is true even if `core` declares
      // its own copy. Scan core's source for top-of-line declarations
      // to catch the primitive case.
      const coreOwnDeclarations = findCoreOwnDeclarations(sharedExportName);
      if (coreOwnDeclarations.length > 0) {
        boundaryViolations.push(
          `${sharedExportName}: core declares its own copy in ${coreOwnDeclarations.join(", ")} — remove and re-export from @react-doctor/project-info`,
        );
        continue;
      }
      if (!Object.is(coreValue, projectInfoValue)) {
        boundaryViolations.push(
          `${sharedExportName}: core's runtime value diverges from project-info's`,
        );
      }
    }
    expect(boundaryViolations).toEqual([]);
  });
});
