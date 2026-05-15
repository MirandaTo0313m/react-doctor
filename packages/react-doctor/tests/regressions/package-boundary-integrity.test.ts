/**
 * Regression tests for the post-`@react-doctor/*`-extraction package
 * boundaries.
 *
 * Covered:
 *   #249 — any name exported by BOTH `@react-doctor/project-info` and
 *          `@react-doctor/core` must be the SAME runtime reference
 *          (i.e. core re-exports it; it isn't re-declared).
 */

import { describe, expect, it } from "vite-plus/test";
import * as core from "@react-doctor/core";
import * as projectInfo from "@react-doctor/project-info";

describe("shared exports between @react-doctor/core and @react-doctor/project-info (#249)", () => {
  const projectInfoExportNames = new Set(Object.keys(projectInfo));
  const sharedExportNames = Object.keys(core)
    .filter((exportName) => projectInfoExportNames.has(exportName))
    .sort();

  it("there is at least one shared runtime export to validate", () => {
    expect(sharedExportNames.length).toBeGreaterThan(0);
  });

  it("every shared export is the same runtime reference in both packages", () => {
    const boundaryViolations: string[] = [];
    for (const sharedExportName of sharedExportNames) {
      const coreValue = Reflect.get(core, sharedExportName);
      const projectInfoValue = Reflect.get(projectInfo, sharedExportName);
      // HACK: a `export type { X } from "..."` slip would leave both
      // lookups as `undefined`; `undefined === undefined` would let
      // drift sneak past. Require runtime presence first.
      if (coreValue === undefined || projectInfoValue === undefined) {
        boundaryViolations.push(
          `${sharedExportName}: present at type-level only — use a value re-export`,
        );
        continue;
      }
      if (!Object.is(coreValue, projectInfoValue)) {
        boundaryViolations.push(
          `${sharedExportName}: core has its own copy — re-export from @react-doctor/project-info`,
        );
      }
    }
    expect(boundaryViolations).toEqual([]);
  });
});
