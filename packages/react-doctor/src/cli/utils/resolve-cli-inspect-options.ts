import type { InspectOptions, ReactDoctorConfig } from "@react-doctor/types";
import type { InspectFlags } from "./inspect-flags.js";
import { isCiEnvironment } from "./is-ci-environment.js";

export const resolveCliInspectOptions = (
  flags: InspectFlags,
  userConfig: ReactDoctorConfig | null,
): InspectOptions => ({
  lint: flags.lint ?? userConfig?.lint ?? true,
  deadCode: flags.deadCode ?? userConfig?.deadCode ?? true,
  verbose: flags.verbose ?? userConfig?.verbose ?? false,
  scoreOnly: Boolean(flags.score),
  // CI no longer auto-implies `--offline`. The score API still runs —
  // tagged with `?ci=1` via `options.isCi` so the server can
  // distinguish CI traffic — and only the share URL is suppressed in
  // CI output. Users who want zero network in CI keep passing
  // `--offline` (or set `offline: true` in config).
  offline: Boolean(flags.offline) || (userConfig?.offline ?? false),
  isCi: isCiEnvironment(),
  silent: Boolean(flags.json),
  respectInlineDisables: flags.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
  outputSurface: flags.prComment ? "prComment" : "cli",
});
