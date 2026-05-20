import { Schema } from "effect";

/**
 * Tagged-error vocabulary for the React Doctor diagnostic engine.
 *
 * Lives in `@react-doctor/core` (the lowest layer that produces
 * these errors — `runOxlint` raises them directly) so the runtime
 * can re-export them without a circular dependency. Callers match
 * on the facade `_tag` ("ReactDoctorError") and then fan out over
 * `reason._tag` with `Effect.catchReason` /
 * `Effect.catchReasons` / `Effect.unwrapReason` — or, in plain
 * Promise-shaped callers, via `instanceof ReactDoctorError`
 * followed by a `switch (error.reason._tag)`. No `instanceof Error`
 * walks, no magic-string sniffing on `error.message`.
 */

export class OxlintBinaryNotFound extends Schema.TaggedErrorClass<OxlintBinaryNotFound>()(
  "OxlintBinaryNotFound",
  {
    nodeVersion: Schema.String,
    requirement: Schema.String,
  },
) {}

/**
 * Raised when oxlint itself fails at runtime with a stderr that
 * includes "native binding" — distinct from
 * `OxlintBinaryNotFound`, which is the *pre-check* the CLI runs
 * via `resolveOxlintNode` before spawning. Both drive the same
 * "upgrade Node" hint, but distinguishing them keeps the renderer
 * dispatch off of `error.message.includes(...)`.
 */
export class OxlintNativeBindingFailed extends Schema.TaggedErrorClass<OxlintNativeBindingFailed>()(
  "OxlintNativeBindingFailed",
  {
    nodeVersion: Schema.String,
    stderr: Schema.String,
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

export class OxlintOutOfMemory extends Schema.TaggedErrorClass<OxlintOutOfMemory>()(
  "OxlintOutOfMemory",
  {
    signal: Schema.String,
  },
) {}

export class OxlintKilled extends Schema.TaggedErrorClass<OxlintKilled>()("OxlintKilled", {
  signal: Schema.String,
  stderr: Schema.String,
}) {}

export class OxlintOutputUnparseable extends Schema.TaggedErrorClass<OxlintOutputUnparseable>()(
  "OxlintOutputUnparseable",
  {
    preview: Schema.String,
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
  OxlintNativeBindingFailed,
  OxlintSpawnFailed,
  OxlintTimedOut,
  OxlintOutputTooLarge,
  OxlintOutOfMemory,
  OxlintKilled,
  OxlintOutputUnparseable,
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
 * Renders a facade error as a one-line human-readable string.
 * Single place to keep wording consistent — the CLI, the JSON
 * reporter, and the GitHub Action all derive their messages from
 * here. Adding a new leaf reason becomes one extra `case`;
 * TypeScript enforces exhaustiveness via the `_tag` discriminant.
 */
export const formatReactDoctorError = (error: ReactDoctorError): string => {
  const reason = error.reason;
  switch (reason._tag) {
    case "OxlintBinaryNotFound":
      return `oxlint native binding not found for Node ${reason.nodeVersion}; expected one matching ${reason.requirement}`;
    case "OxlintNativeBindingFailed": {
      const detail = reason.stderr ? `: ${reason.stderr}` : "";
      return `oxlint native binding failed at runtime under Node ${reason.nodeVersion}${detail}`;
    }
    case "OxlintSpawnFailed":
      return `Failed to run oxlint: ${String(reason.cause)}`;
    case "OxlintTimedOut":
      return `oxlint did not return within ${reason.timeoutMilliseconds / 1000}s — please report`;
    case "OxlintOutputTooLarge":
      return `oxlint output exceeded ${reason.maxBytes} bytes — scan a smaller subset with --diff or --staged`;
    case "OxlintOutOfMemory":
      return `oxlint was killed by ${reason.signal} (out of memory — try scanning fewer files with --diff)`;
    case "OxlintKilled": {
      const detail = reason.stderr ? `: ${reason.stderr}` : "";
      return `oxlint was killed by ${reason.signal}${detail}`;
    }
    case "OxlintOutputUnparseable":
      return `Failed to parse oxlint output: ${reason.preview}`;
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

/**
 * Reason tags that indicate a per-batch failure that recovers via
 * binary-split: timeout, output-size cap, or OOM. The runner
 * narrows the failing batch in halves until it isolates the
 * offending file (or hits batch length 1, at which point the file
 * is dropped and reported via `onPartialFailure`). Centralizing the
 * predicate here means new "splittable" reasons are one entry away
 * — there is no longer a `error.message.includes(...)` chain in
 * the runner to keep in sync.
 */
export const SPLITTABLE_OXLINT_REASONS: ReadonlySet<ReactDoctorErrorReason["_tag"]> = new Set([
  "OxlintTimedOut",
  "OxlintOutputTooLarge",
  "OxlintOutOfMemory",
]);

export const isSplittableReactDoctorError = (error: unknown): error is ReactDoctorError =>
  error instanceof ReactDoctorError && SPLITTABLE_OXLINT_REASONS.has(error.reason._tag);
