import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { BaselineConfig, Diagnostic, ReactDoctorConfig } from "@react-doctor/types";

export const DEFAULT_BASELINE_FILENAME = "react-doctor-baseline.json";
export const BASELINE_FORMAT_VERSION = 1;

export interface BaselineFile {
  schemaVersion: typeof BASELINE_FORMAT_VERSION;
  generatedAt: string;
  /**
   * Map from baseline fingerprint to a redacted diagnostic summary
   * (rule + filepath only). Stored as an object for friendlier diffs
   * vs. a flat array of strings; loading code only reads the keys.
   */
  diagnostics: Record<string, BaselineEntry>;
}

export interface BaselineEntry {
  plugin: string;
  rule: string;
  filePath: string;
  /**
   * Recorded line number at baseline time. Not part of the fingerprint
   * (so re-formatting a file doesn't invalidate everything), but
   * preserved for human auditing when the baseline file is opened.
   */
  line: number;
}

export interface ResolvedBaselineSettings {
  enabled: boolean;
  filePath: string;
  showBaselineMatches: boolean;
}

const DIGEST_LENGTH_HEX = 16;

/**
 * Build a stable fingerprint for a diagnostic so the baseline survives
 * line-number drift from unrelated edits but still catches genuine new
 * violations. Includes:
 *
 *   - plugin + rule (the diagnostic identity)
 *   - filePath relative to the project root
 *   - message (so two firings on the same file/rule with different
 *     messages - e.g. two unrelated imports - are tracked separately)
 *
 * Excludes line/column on purpose. With both included, ANY edit above
 * the diagnostic would shift the line and the baseline would no longer
 * suppress it - defeating the point. The trade-off: if the user
 * legitimately introduces a second hit of the same rule with the same
 * message in the same file, the baseline will still suppress it. We
 * accept that - the rule's score / CLI path still surfaces it, only
 * the ciFailure / prComment "new violations" view treats it as known.
 */
export const fingerprintDiagnostic = (diagnostic: Diagnostic, projectRoot: string): string => {
  const relativeFilePath = path.isAbsolute(diagnostic.filePath)
    ? path.relative(projectRoot, diagnostic.filePath)
    : diagnostic.filePath;
  const normalized = relativeFilePath.split(path.sep).join("/");
  const hash = createHash("sha256");
  hash.update(diagnostic.plugin);
  hash.update("\u0000");
  hash.update(diagnostic.rule);
  hash.update("\u0000");
  hash.update(normalized);
  hash.update("\u0000");
  hash.update(diagnostic.message);
  return hash.digest("hex").slice(0, DIGEST_LENGTH_HEX);
};

const baselineEntrySchema = z.object({
  plugin: z.string(),
  rule: z.string(),
  filePath: z.string(),
  line: z.number(),
});

const baselineFileSchema = z.object({
  schemaVersion: z.literal(BASELINE_FORMAT_VERSION),
  generatedAt: z.string(),
  diagnostics: z.record(z.string(), baselineEntrySchema),
});

export const resolveBaselineSettings = (
  userConfig: ReactDoctorConfig | null,
  cliFlag: boolean | string | undefined,
  projectRoot: string,
): ResolvedBaselineSettings => {
  const baselineConfig = userConfig?.baseline;
  let enabled = false;
  let resolvedPath: string | undefined;
  let showBaselineMatches = false;

  // Read fields the config object owns regardless of where the
  // enabled/path decision is made - the CLI flag is just an
  // enabled/path override; display preferences like
  // `showBaselineMatches` have no CLI equivalent and should still
  // come from config when both are present.
  if (typeof baselineConfig === "object" && baselineConfig !== null) {
    const configuredPath = (baselineConfig as BaselineConfig).path;
    if (typeof configuredPath === "string" && configuredPath.length > 0) {
      resolvedPath = configuredPath;
    }
    showBaselineMatches = Boolean((baselineConfig as BaselineConfig).showBaselineMatches);
  }

  // CLI flag wins for enabled / path. It arrives as `true` for the
  // bare `--baseline` form or a string for `--baseline=<path>`
  // (Commander's optional-arg shape).
  if (cliFlag !== undefined) {
    enabled = Boolean(cliFlag);
    if (typeof cliFlag === "string" && cliFlag.length > 0) resolvedPath = cliFlag;
  } else if (baselineConfig === true) {
    enabled = true;
  } else if (typeof baselineConfig === "object" && baselineConfig !== null) {
    enabled = true;
  }

  // Empty-string paths fall through to the default below - the standard
  // `??` fallback would otherwise leave `path.resolve` with `""`, which
  // resolves to the project root *directory* rather than a file.

  const filePath =
    resolvedPath && path.isAbsolute(resolvedPath)
      ? resolvedPath
      : path.resolve(projectRoot, resolvedPath ?? DEFAULT_BASELINE_FILENAME);

  return { enabled, filePath, showBaselineMatches };
};

export const readBaselineFile = (filePath: string): BaselineFile | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const result = baselineFileSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const buildBaselineFile = (diagnostics: Diagnostic[], projectRoot: string): BaselineFile => {
  const diagnosticsByFingerprint: Record<string, BaselineEntry> = {};
  for (const diagnostic of diagnostics) {
    const fingerprint = fingerprintDiagnostic(diagnostic, projectRoot);
    const relativeFilePath = path.isAbsolute(diagnostic.filePath)
      ? path.relative(projectRoot, diagnostic.filePath)
      : diagnostic.filePath;
    diagnosticsByFingerprint[fingerprint] = {
      plugin: diagnostic.plugin,
      rule: diagnostic.rule,
      filePath: relativeFilePath.split(path.sep).join("/"),
      line: diagnostic.line,
    };
  }
  return {
    schemaVersion: BASELINE_FORMAT_VERSION,
    generatedAt: new Date().toISOString(),
    diagnostics: diagnosticsByFingerprint,
  };
};

export const writeBaselineFile = (filePath: string, baseline: BaselineFile): void => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(baseline, null, 2)}\n`);
};

export interface BaselinePartitionResult {
  /** Diagnostics not present in the baseline - these block CI / PR comments. */
  newDiagnostics: Diagnostic[];
  /** Diagnostics whose fingerprint matched a baseline entry. */
  baselineDiagnostics: Diagnostic[];
}

export const partitionDiagnosticsByBaseline = (
  diagnostics: Diagnostic[],
  baseline: BaselineFile,
  projectRoot: string,
): BaselinePartitionResult => {
  const newDiagnostics: Diagnostic[] = [];
  const baselineDiagnostics: Diagnostic[] = [];
  const knownFingerprints = new Set(Object.keys(baseline.diagnostics));
  for (const diagnostic of diagnostics) {
    const fingerprint = fingerprintDiagnostic(diagnostic, projectRoot);
    if (knownFingerprints.has(fingerprint)) {
      baselineDiagnostics.push(diagnostic);
    } else {
      newDiagnostics.push(diagnostic);
    }
  }
  return { newDiagnostics, baselineDiagnostics };
};
