import { spawnSync } from "node:child_process";
import path from "node:path";
import type { Diagnostic } from "@react-doctor/types";

export interface TouchedLineRange {
  startLine: number;
  endLine: number;
}

export type TouchedLinesByFile = ReadonlyMap<string, ReadonlyArray<TouchedLineRange>>;

const runGitDiff = (
  directory: string,
  baseRef: string | null,
  filePaths: ReadonlyArray<string>,
): string | null => {
  const args = ["diff", "--unified=0", "--no-color", "--no-ext-diff"];
  if (baseRef) args.push(baseRef);
  args.push("--");
  for (const filePath of filePaths) args.push(filePath);
  const result = spawnSync("git", args, {
    cwd: directory,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.toString();
};

const FILE_HEADER_PATTERN = /^\+\+\+ b\/(.+)$/;
const FILE_HEADER_RESET_PATTERN = /^--- (?:a\/|\/dev\/null)/;
const HUNK_HEADER_PATTERN = /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/;

/**
 * Parse a unified-diff body (with `--unified=0`) into a per-file map of
 * touched line ranges. Only added / modified lines on the post-image
 * side are recorded - deletions don't have a corresponding location in
 * the new file, so any diagnostic that ended up on a deletion is by
 * definition gone.
 */
export const parseUnifiedDiffTouchedLines = (diffOutput: string): TouchedLinesByFile => {
  const byFile = new Map<string, TouchedLineRange[]>();
  if (!diffOutput) return byFile;

  let currentFile: string | null = null;
  let currentRanges: TouchedLineRange[] | null = null;

  for (const line of diffOutput.split("\n")) {
    const fileMatch = line.match(FILE_HEADER_PATTERN);
    if (fileMatch) {
      currentFile = fileMatch[1];
      currentRanges = byFile.get(currentFile) ?? [];
      if (!byFile.has(currentFile)) byFile.set(currentFile, currentRanges);
      continue;
    }
    // Only treat `--- ` as a file header (and reset state) when it
    // looks like a real diff prefix (`--- a/<path>` or `--- /dev/null`).
    // A bare `line.startsWith("--- ")` matches REMOVED content lines
    // whose source starts with `"-- "` (e.g. SQL comments), which
    // would silently drop every subsequent hunk for that file.
    if (FILE_HEADER_RESET_PATTERN.test(line)) {
      currentFile = null;
      currentRanges = null;
      continue;
    }
    if (!currentFile || !currentRanges) continue;
    const hunkMatch = line.match(HUNK_HEADER_PATTERN);
    if (!hunkMatch) continue;
    const startLine = Number.parseInt(hunkMatch[1], 10);
    const count = hunkMatch[2] === undefined ? 1 : Number.parseInt(hunkMatch[2], 10);
    if (count === 0) continue;
    currentRanges.push({ startLine, endLine: startLine + count - 1 });
  }
  return byFile;
};

interface GetTouchedLinesOptions {
  directory: string;
  baseRef: string | null;
  filePaths: ReadonlyArray<string>;
}

export const getTouchedLines = (options: GetTouchedLinesOptions): TouchedLinesByFile => {
  const { directory, baseRef, filePaths } = options;
  if (filePaths.length === 0) return new Map();
  const diff = runGitDiff(directory, baseRef, filePaths);
  if (diff === null) return new Map();
  return parseUnifiedDiffTouchedLines(diff);
};

const matchesTouchedLine = (
  diagnostic: Diagnostic,
  ranges: ReadonlyArray<TouchedLineRange> | undefined,
): boolean => {
  if (!ranges || ranges.length === 0) return false;
  if (diagnostic.line <= 0) return true;
  for (const range of ranges) {
    if (diagnostic.line >= range.startLine && diagnostic.line <= range.endLine) return true;
  }
  return false;
};

/**
 * Filter diagnostics so only those on lines covered by `touchedLines`
 * remain. The filter is keyed by file path normalized to forward
 * slashes (matching the `git diff` output). When a diagnostic's file
 * isn't represented in `touchedLines`, the diagnostic is DROPPED - the
 * file wasn't touched on the active diff and the user opted into
 * touched-line gating.
 */
export const filterDiagnosticsByTouchedLines = (
  diagnostics: Diagnostic[],
  touchedLines: TouchedLinesByFile,
  projectRoot: string,
): Diagnostic[] => {
  if (touchedLines.size === 0) return [];
  return diagnostics.filter((diagnostic) => {
    const relativeFilePath = path.isAbsolute(diagnostic.filePath)
      ? path.relative(projectRoot, diagnostic.filePath)
      : diagnostic.filePath;
    const normalized = relativeFilePath.split(path.sep).join("/");
    return matchesTouchedLine(diagnostic, touchedLines.get(normalized));
  });
};
