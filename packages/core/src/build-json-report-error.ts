import type { JsonReport, JsonReportMode } from "@react-doctor/types";
import { formatReactDoctorError, type ReactDoctorError } from "./errors.js";
import { getErrorChainMessages } from "./format-error-chain.js";

/**
 * Structural `_tag` check — see `react-doctor/src/inspect.ts` for
 * the rationale. Discriminates on the tag the runtime publishes
 * structurally instead of `instanceof`, which is unreliable
 * across module boundaries in some test environments.
 */
const isReactDoctorErrorLike = (cause: unknown): cause is ReactDoctorError =>
  typeof cause === "object" &&
  cause !== null &&
  (cause as { _tag?: unknown })._tag === "ReactDoctorError" &&
  typeof (cause as { reason?: { _tag?: unknown } }).reason === "object" &&
  (cause as { reason?: { _tag?: unknown } }).reason !== null;

interface BuildJsonReportErrorInput {
  version: string;
  directory: string;
  error: unknown;
  elapsedMilliseconds: number;
  mode?: JsonReportMode;
}

const safeStringify = (value: unknown): string => {
  try {
    return String(value);
  } catch {
    return "Unrepresentable error";
  }
};

const safeGetErrorChain = (error: unknown): string[] => {
  try {
    return getErrorChainMessages(error);
  } catch {
    return [safeStringify(error)];
  }
};

export const buildJsonReportError = (input: BuildJsonReportErrorInput): JsonReport => {
  // Tagged runtime errors render through the centralized formatter
  // so the JSON `error.message` matches what the CLI prints. The
  // chain walk only kicks in for legacy `Error`s with `cause`
  // links — that's where third-party plugin / fs throws still live.
  const chain = isReactDoctorErrorLike(input.error)
    ? [formatReactDoctorError(input.error)]
    : safeGetErrorChain(input.error);
  const errorPayload = isReactDoctorErrorLike(input.error)
    ? {
        message: formatReactDoctorError(input.error),
        name: input.error._tag,
        chain,
      }
    : input.error instanceof Error
      ? {
          message: input.error.message || input.error.name || "Error",
          name: input.error.name || "Error",
          chain,
        }
      : { message: safeStringify(input.error), name: "Error", chain };

  return {
    schemaVersion: 1,
    version: input.version,
    ok: false,
    directory: input.directory,
    mode: input.mode ?? "full",
    diff: null,
    projects: [],
    diagnostics: [],
    summary: {
      errorCount: 0,
      warningCount: 0,
      affectedFileCount: 0,
      totalDiagnosticCount: 0,
      score: null,
      scoreLabel: null,
    },
    elapsedMilliseconds: input.elapsedMilliseconds,
    error: errorPayload,
  };
};
