/**
 * Regression tests defending against "silent drift" — places where two
 * supposedly-coupled invariants can diverge with no compile error, no
 * test failure, and no user-visible warning, until much later when the
 * forked behavior surfaces as a bug.
 *
 * Covered drift classes:
 *   #249 — shared exports between @react-doctor/core and
 *          @react-doctor/project-info are re-exports, not re-declarations
 *          (runtime reference + source-level scan)
 *   #249 — types exported by @react-doctor/types are not locally
 *          re-declared in any consumer package (TypeScript would not
 *          catch a structurally-similar parallel declaration imported
 *          via a different path)
 *   #249 — the two "Score unavailable …" message literals appear ONLY
 *          in their constants module (defends against re-inlined copies
 *          that bypass the imported constant — Bugbot's original
 *          finding at the SOURCE level, not just runtime)
 *   #249 — workspace-facing URL constants (SCORE_API_URL,
 *          SHARE_BASE_URL) are not inlined in any CLI source file
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import * as core from "@react-doctor/core";
import * as projectInfo from "@react-doctor/project-info";
import {
  SCORE_UNAVAILABLE_API_FAILURE_MESSAGE,
  SCORE_UNAVAILABLE_OFFLINE_MESSAGE,
} from "../../src/cli/utils/constants.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

// CLI-relevant package source roots. `packages/website/` is deployed
// separately as a Next.js app and legitimately re-declares some
// constants (e.g. SHARE_BASE_URL for SSR rendering), so it's excluded.
const CLI_PACKAGE_SOURCE_ROOTS = [
  "packages/types/src",
  "packages/project-info/src",
  "packages/core/src",
  "packages/react-doctor/src",
  "packages/oxlint-plugin-react-doctor/src",
  "packages/eslint-plugin-react-doctor/src",
].map((relativePath) => path.join(REPO_ROOT, relativePath));

interface WorkspaceSourceFile {
  absolutePath: string;
  repoRelativePath: string;
  packageRelativePath: string;
  packageRoot: string;
  content: string;
}

const collectTypeScriptSources = (rootDirectories: string[]): WorkspaceSourceFile[] => {
  const sources: WorkspaceSourceFile[] = [];
  for (const packageRoot of rootDirectories) {
    if (!fs.existsSync(packageRoot)) continue;
    const directoriesToWalk: string[] = [packageRoot];
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
        sources.push({
          absolutePath: entryPath,
          repoRelativePath: path.relative(REPO_ROOT, entryPath),
          packageRelativePath: path.relative(packageRoot, entryPath),
          packageRoot,
          content: fs.readFileSync(entryPath, "utf8"),
        });
      }
    }
  }
  return sources;
};

const ALL_WORKSPACE_SOURCES = collectTypeScriptSources(CLI_PACKAGE_SOURCE_ROOTS);

const CORE_SOURCES = ALL_WORKSPACE_SOURCES.filter((source) =>
  source.packageRoot.endsWith(path.join("packages", "core", "src")),
);

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
      const declarationPattern = new RegExp(
        String.raw`^export\s+const\s+${sharedExportName}\b`,
        "m",
      );
      const filesWithOwnDeclaration = CORE_SOURCES.filter((source) =>
        declarationPattern.test(source.content),
      ).map((source) => source.packageRelativePath);
      if (filesWithOwnDeclaration.length > 0) {
        boundaryViolations.push(
          `${sharedExportName}: core declares its own copy in ${filesWithOwnDeclaration.join(", ")} — remove and re-export from @react-doctor/project-info`,
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

// Names exported by `@react-doctor/types`. Types are stripped at
// runtime, so we can't enumerate them via `Object.keys(types)` like we
// do for constants. Parse the barrel source instead — `export type {
// A, B, C } from "..."` blocks. Anything imported as a value would
// surface in `Object.keys`; this regex matches type-only re-exports.
const extractTypeBarrelExports = (barrelSource: string): string[] => {
  const exportNames: string[] = [];
  const exportBlockPattern = /export\s+type\s*\{([^}]*)\}/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = exportBlockPattern.exec(barrelSource)) !== null) {
    for (const rawName of blockMatch[1].split(",")) {
      const trimmedName = rawName.trim();
      if (trimmedName.length > 0) exportNames.push(trimmedName);
    }
  }
  return exportNames.sort();
};

describe("types exported by @react-doctor/types are not re-declared in consumer packages (#249)", () => {
  const typesBarrelSource = fs.readFileSync(
    path.join(REPO_ROOT, "packages/types/src/index.ts"),
    "utf8",
  );
  const typesPackageExports = extractTypeBarrelExports(typesBarrelSource);

  // Consumers = every CLI source except types itself.
  const consumerSources = ALL_WORKSPACE_SOURCES.filter(
    (source) => !source.packageRoot.endsWith(path.join("packages", "types", "src")),
  );

  it("the types barrel exposes at least one named type", () => {
    expect(typesPackageExports.length).toBeGreaterThan(0);
  });

  it("no consumer package re-declares a type owned by @react-doctor/types", () => {
    const violations: string[] = [];
    for (const typeName of typesPackageExports) {
      // ^(export\s+)?(interface|type)\s+NAME\b — matches a top-of-line
      // declaration regardless of whether it's exported. Re-export
      // lines (`export type { NAME } from "..."`) don't match because
      // they have `{` between `type` and the name.
      const declarationPattern = new RegExp(
        String.raw`^(export\s+)?(interface|type)\s+${typeName}\b`,
        "m",
      );
      const filesRedeclaring = consumerSources.filter((source) =>
        declarationPattern.test(source.content),
      );
      for (const source of filesRedeclaring) {
        violations.push(
          `${typeName} re-declared in ${source.repoRelativePath} — import from @react-doctor/types`,
        );
      }
    }
    expect(violations).toEqual([]);
  });
});

interface MagicStringLocalityRule {
  label: string;
  literal: string;
  allowedRepoRelativePath: string;
  remediation: string;
}

const MAGIC_STRING_LOCALITY_RULES: MagicStringLocalityRule[] = [
  {
    label: "SCORE_UNAVAILABLE_OFFLINE_MESSAGE",
    literal: SCORE_UNAVAILABLE_OFFLINE_MESSAGE,
    allowedRepoRelativePath: "packages/react-doctor/src/cli/utils/constants.ts",
    remediation:
      "import SCORE_UNAVAILABLE_OFFLINE_MESSAGE from @react-doctor/react-doctor cli/utils/constants",
  },
  {
    label: "SCORE_UNAVAILABLE_API_FAILURE_MESSAGE",
    literal: SCORE_UNAVAILABLE_API_FAILURE_MESSAGE,
    allowedRepoRelativePath: "packages/react-doctor/src/cli/utils/constants.ts",
    remediation:
      "import SCORE_UNAVAILABLE_API_FAILURE_MESSAGE from @react-doctor/react-doctor cli/utils/constants",
  },
  {
    label: "SCORE_API_URL",
    literal: "https://www.react.doctor/api/score",
    allowedRepoRelativePath: "packages/core/src/constants.ts",
    remediation: "import SCORE_API_URL from @react-doctor/core",
  },
  {
    label: "SHARE_BASE_URL",
    literal: "https://www.react.doctor/share",
    allowedRepoRelativePath: "packages/core/src/constants.ts",
    remediation: "import SHARE_BASE_URL from @react-doctor/core",
  },
];

describe("magic string locality — each user-facing constant has exactly one source of truth (#249)", () => {
  it.each(MAGIC_STRING_LOCALITY_RULES)(
    "$label only appears in $allowedRepoRelativePath",
    ({ literal, allowedRepoRelativePath, remediation }) => {
      const offendingFiles = ALL_WORKSPACE_SOURCES.filter(
        (source) =>
          source.repoRelativePath !== allowedRepoRelativePath && source.content.includes(literal),
      ).map((source) => source.repoRelativePath);
      expect(offendingFiles, `Inline duplicate of "${literal}" — ${remediation}`).toEqual([]);
    },
  );
});
