import type { DiagnosticSurface, ReactDoctorConfig } from "./config.js";
import type { Diagnostic } from "./diagnostic.js";
import type { ProjectInfo } from "./project-info.js";
import type { ScoreResult } from "./score.js";

export interface InspectResult {
  diagnostics: Diagnostic[];
  score: ScoreResult | null;
  skippedChecks: string[];
  /**
   * Human-readable explanation for each entry in `skippedChecks`. Keyed
   * by check name (e.g. `"lint"`). Optional so existing consumers that
   * only read `skippedChecks` keep working unchanged — but JSON output
   * and CI integrations should prefer this for diagnostic clarity
   * (e.g. distinguishing "oxlint native binding missing" from "oxlint
   * spawn timed out on a large project").
   */
  skippedCheckReasons?: Record<string, string>;
  project: ProjectInfo;
  elapsedMilliseconds: number;
  /**
   * Diagnostics that matched a baseline fingerprint and were therefore
   * excluded from `diagnostics`. Empty when baseline mode is off.
   */
  baselineDiagnostics?: Diagnostic[];
  /**
   * Count of diagnostics dropped because the active diff did not
   * touch their source line. Populated only when `touchedLinesOnly`
   * is active. Useful for explaining the gap between the "Found N
   * issues" and "N reported here" numbers in PR comments.
   */
  diagnosticsHiddenByTouchedLines?: number;
}

export interface InspectOptions {
  lint?: boolean;
  verbose?: boolean;
  scoreOnly?: boolean;
  offline?: boolean;
  silent?: boolean;
  includePaths?: string[];
  configOverride?: ReactDoctorConfig | null;
  respectInlineDisables?: boolean;
  /**
   * Surface that consumes the printed diagnostic output (terminal
   * summary + per-rule list). Defaults to `"cli"`, which shows every
   * diagnostic. Set to `"prComment"` when capturing output destined
   * for a PR comment — weak-signal rule families (default: `design`
   * tag) are dropped from the printed list and replaced with a
   * one-line "N more demoted" hint so they don't bury real React
   * findings. The returned `InspectResult.diagnostics` always
   * contains the full, unfiltered list so JSON consumers can see
   * everything.
   */
  outputSurface?: DiagnosticSurface;
  /**
   * Override baseline mode for this `inspect()` call. When omitted, the
   * setting falls back to `userConfig.baseline`. Pass `false` to force
   * baseline off (useful when --update-baseline is recording a fresh
   * snapshot and shouldn't itself be filtered by the existing one).
   */
  baseline?: boolean | string;
  /**
   * When true, drop diagnostics whose line isn't covered by the active
   * diff's touched-line ranges. Requires diff mode (paths in
   * `includePaths` must come from a diff). Falls back to
   * `userConfig.touchedLinesOnly`.
   */
  touchedLinesOnly?: boolean;
  /**
   * Optional pre-computed per-file touched line ranges to use when
   * `touchedLinesOnly` is set. Avoids re-shelling out to `git diff`
   * from inside `inspect()` when the caller (e.g. the CLI) already
   * computed them at the project boundary.
   */
  touchedLinesByFile?: ReadonlyMap<string, ReadonlyArray<{ startLine: number; endLine: number }>>;
}

export interface DiffInfo {
  currentBranch: string;
  baseBranch: string;
  changedFiles: string[];
  isCurrentChanges?: boolean;
  /**
   * Resolved git ref to diff against when computing touched-line
   * ranges. For branch-vs-branch comparisons this is the `git merge-base`
   * of `currentBranch` and `baseBranch` so unrelated commits on the
   * base don't appear "touched" on the feature branch. For uncommitted
   * working-tree changes (`isCurrentChanges: true`), this is `null` -
   * `git diff` without a base ref already covers the right scope.
   */
  diffBaseRef?: string | null;
}

export type JsonReportMode = "full" | "diff" | "staged";

export interface JsonReportDiffInfo {
  baseBranch: string;
  currentBranch: string;
  changedFileCount: number;
  isCurrentChanges: boolean;
}

export interface JsonReportProjectEntry {
  directory: string;
  project: ProjectInfo;
  diagnostics: Diagnostic[];
  score: ScoreResult | null;
  skippedChecks: string[];
  /** Human-readable explanation per skipped check. See `InspectResult.skippedCheckReasons`. */
  skippedCheckReasons?: Record<string, string>;
  elapsedMilliseconds: number;
  /**
   * Baseline-known diagnostics for this project (already excluded from
   * `diagnostics`). Populated only when baseline mode is active.
   * Useful for dashboard / trend tracking - the count of historical
   * debt that survived this scan but didn't block the build.
   */
  baselineDiagnostics?: Diagnostic[];
  /**
   * Number of diagnostics filtered out because they did not land on a
   * touched line. Populated only when `touchedLinesOnly` is enabled.
   */
  diagnosticsHiddenByTouchedLines?: number;
}

export interface JsonReportSummary {
  errorCount: number;
  warningCount: number;
  affectedFileCount: number;
  totalDiagnosticCount: number;
  score: number | null;
  scoreLabel: string | null;
  /**
   * Total number of baseline-matched diagnostics across all scanned
   * projects (sum of `projects[].baselineDiagnostics.length`).
   * Surfaced so PR comments / dashboards can say
   * "12 issues (3 new, 9 baseline)" without re-walking every project.
   */
  baselineDiagnosticCount: number;
}

export interface JsonReportError {
  message: string;
  name: string;
  chain: string[];
}

export interface JsonReport {
  schemaVersion: 1;
  version: string;
  ok: boolean;
  directory: string;
  mode: JsonReportMode;
  diff: JsonReportDiffInfo | null;
  projects: JsonReportProjectEntry[];
  /**
   * Flattened across `projects[].diagnostics` for convenience. Equivalent to
   * `projects.flatMap((project) => project.diagnostics)`.
   */
  diagnostics: Diagnostic[];
  summary: JsonReportSummary;
  elapsedMilliseconds: number;
  error: JsonReportError | null;
}
