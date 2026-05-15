/**
 * Regression tests for the post-`@react-doctor/*`-extraction package
 * boundaries. These pin behavior that's easy to silently regress when
 * someone touches the workspace dependency graph or moves a constant
 * between packages.
 *
 * Covered:
 *   #249 — shared constants live in @react-doctor/project-info and are
 *          re-exported (not re-declared) by @react-doctor/core
 */

import { describe, expect, it } from "vite-plus/test";
import * as core from "@react-doctor/core";
import * as projectInfo from "@react-doctor/project-info";

// HACK: PR #249 (Bugbot review): SOURCE_FILE_PATTERN,
// GIT_LS_FILES_MAX_BUFFER_BYTES, and IGNORED_DIRECTORIES were
// independently re-declared with identical values in both
// `core/src/constants.ts` and `project-info/src/constants.ts`. Since
// `@react-doctor/core` already depends on `@react-doctor/project-info`,
// the duplication was pure drift risk — touching one copy and missing
// the other would silently fork behavior between scan stages that
// happened to import from the "wrong" package. The strict
// reference-equality asserts below lock in the fix (core re-exports
// these three through its barrel from project-info).
describe("shared constants between core and project-info (#249)", () => {
  it("core re-exports SOURCE_FILE_PATTERN / GIT_LS_FILES_MAX_BUFFER_BYTES / IGNORED_DIRECTORIES from project-info", () => {
    // HACK: if any of these assertions fail, `core/src/constants.ts`
    // has re-declared the constant instead of re-exporting it from
    // `@react-doctor/project-info` — fix the export, not the test.
    expect(core.SOURCE_FILE_PATTERN).toBe(projectInfo.SOURCE_FILE_PATTERN);
    expect(core.GIT_LS_FILES_MAX_BUFFER_BYTES).toBe(projectInfo.GIT_LS_FILES_MAX_BUFFER_BYTES);
    expect(core.IGNORED_DIRECTORIES).toBe(projectInfo.IGNORED_DIRECTORIES);
  });
});
