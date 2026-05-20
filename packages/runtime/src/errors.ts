import { Schema } from "effect";

/**
 * Tagged-error vocabulary for the runtime layer.
 *
 * Every leaf error names exactly one concrete failure mode. The
 * single facade `ReactDoctorError` carries them as a tagged
 * `reason` union — callers match on the facade tag, then fan out
 * over reasons with `Effect.catchReason` / `Effect.catchReasons` /
 * `Effect.unwrapReason`. Equivalent to the pattern in
 * react-doctor-evals' `errors.ts`, but keyed to react-doctor's
 * actual failure surface (oxlint subprocess, config decode,
 * project discovery) rather than the eval harness's surface.
 *
 * Why a single facade instead of letting leaves bubble up directly:
 * call sites stay exhaustive over one tag, error messages stay
 * derivable from `reason`, and adding a new leaf — `BiomeBinaryNotFound`,
 * `EslintHostCrashed`, … — only widens the union. No `instanceof`
 * checks, no `Error` subclassing, no string sniffing.
 */

export class OxlintBinaryNotFound extends Schema.TaggedErrorClass<OxlintBinaryNotFound>()(
  "OxlintBinaryNotFound",
  {
    nodeVersion: Schema.String,
    requirement: Schema.String,
  },
) {}

export class OxlintSpawnFailed extends Schema.TaggedErrorClass<OxlintSpawnFailed>()(
  "OxlintSpawnFailed",
  {
    cause: Schema.Defect,
  },
) {}

export class OxlintTimedOut extends Schema.TaggedErrorClass<OxlintTimedOut>()("OxlintTimedOut", {
  timeoutMilliseconds: Schema.Number,
}) {}

export class OxlintOutputTooLarge extends Schema.TaggedErrorClass<OxlintOutputTooLarge>()(
  "OxlintOutputTooLarge",
  {
    maxBytes: Schema.Number,
  },
) {}

export class OxlintOutputUnparseable extends Schema.TaggedErrorClass<OxlintOutputUnparseable>()(
  "OxlintOutputUnparseable",
  {
    preview: Schema.String,
  },
) {}

export class OxlintBatchFileDropped extends Schema.TaggedErrorClass<OxlintBatchFileDropped>()(
  "OxlintBatchFileDropped",
  {
    files: Schema.Array(Schema.String),
    timeoutMilliseconds: Schema.Number,
  },
) {}

export class ConfigParseFailed extends Schema.TaggedErrorClass<ConfigParseFailed>()(
  "ConfigParseFailed",
  {
    configPath: Schema.String,
    cause: Schema.Defect,
  },
) {}

export class ProjectNotFound extends Schema.TaggedErrorClass<ProjectNotFound>()("ProjectNotFound", {
  directory: Schema.String,
}) {}

export class NoReactDependency extends Schema.TaggedErrorClass<NoReactDependency>()(
  "NoReactDependency",
  {
    directory: Schema.String,
  },
) {}

export class AmbiguousProject extends Schema.TaggedErrorClass<AmbiguousProject>()(
  "AmbiguousProject",
  {
    directory: Schema.String,
    candidates: Schema.Array(Schema.String),
  },
) {}

export const ReactDoctorErrorReason = Schema.Union([
  OxlintBinaryNotFound,
  OxlintSpawnFailed,
  OxlintTimedOut,
  OxlintOutputTooLarge,
  OxlintOutputUnparseable,
  OxlintBatchFileDropped,
  ConfigParseFailed,
  ProjectNotFound,
  NoReactDependency,
  AmbiguousProject,
]);
export type ReactDoctorErrorReason = typeof ReactDoctorErrorReason.Type;

export class ReactDoctorError extends Schema.TaggedErrorClass<ReactDoctorError>()(
  "ReactDoctorError",
  {
    reason: ReactDoctorErrorReason,
  },
) {}

/**
 * Renders a facade error as a one-line human-readable string. Single
 * place to keep wording consistent — the CLI, the JSON reporter, and
 * the GitHub Action all derive their messages from here. Adding a
 * new leaf reason becomes one extra `case`; TypeScript enforces
 * exhaustiveness via the `_tag` discriminant.
 */
export const formatReactDoctorError = (error: ReactDoctorError): string => {
  const reason = error.reason;
  switch (reason._tag) {
    case "OxlintBinaryNotFound":
      return `oxlint native binding not found for Node ${reason.nodeVersion}; expected one matching ${reason.requirement}`;
    case "OxlintSpawnFailed":
      return `Failed to run oxlint: ${String(reason.cause)}`;
    case "OxlintTimedOut":
      return `oxlint did not return within ${reason.timeoutMilliseconds / 1000}s — please report`;
    case "OxlintOutputTooLarge":
      return `oxlint output exceeded ${reason.maxBytes} bytes — scan a smaller subset with --diff or --staged`;
    case "OxlintOutputUnparseable":
      return `Failed to parse oxlint output: ${reason.preview}`;
    case "OxlintBatchFileDropped":
      return `${reason.files.length} file(s) exceeded the ${reason.timeoutMilliseconds / 1000}s per-batch oxlint budget and were skipped`;
    case "ConfigParseFailed":
      return `Failed to parse react-doctor config at ${reason.configPath}: ${String(reason.cause)}`;
    case "ProjectNotFound":
      return `No React project found at ${reason.directory}`;
    case "NoReactDependency":
      return `No React dependency in ${reason.directory}/package.json`;
    case "AmbiguousProject":
      return `Multiple React projects found under ${reason.directory} (${reason.candidates.length} candidates): ${reason.candidates.join(", ")}`;
  }
};
