// HACK: Commander leaves boolean flags as `undefined` when not passed (rather
// than defaulting to `false`), so every "is the flag a real boolean?" field
// is optional here. The resolvers use that to distinguish "user passed
// nothing" from "user passed a value" without consulting `program`.
export interface InspectFlags {
  lint?: boolean;
  verbose?: boolean;
  score?: boolean;
  json?: boolean;
  jsonCompact?: boolean;
  yes?: boolean;
  full?: boolean;
  offline?: boolean;
  annotations?: boolean;
  staged?: boolean;
  prComment?: boolean;
  respectInlineDisables?: boolean;
  project?: string;
  diff?: boolean | string;
  explain?: string;
  why?: string;
  failOn?: string;
  /**
   * `--baseline` enables baseline mode (default path
   * `react-doctor-baseline.json`). `--baseline=<path>` overrides the
   * file location. The flag arrives from Commander as `true | string`.
   */
  baseline?: boolean | string;
  /** Record / refresh the baseline instead of filtering against it. */
  updateBaseline?: boolean;
  /** Apply touched-line filtering on top of diff mode. */
  touchedLines?: boolean;
  /** Maximum number of workspace projects to scan in parallel. */
  concurrency?: string;
}
