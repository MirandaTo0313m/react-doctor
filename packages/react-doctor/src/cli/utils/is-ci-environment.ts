// Stay narrow: only the canonical CI signals where we're confident the
// run is automated. The detection drives two things:
//   1. The score request is tagged with `?ci=1` so the server can
//      separate CI traffic from interactive local runs.
//   2. The share URL is suppressed in the printed summary (it's just
//      noise in CI logs).
// CI no longer auto-implies `--offline` — users who want zero network
// in CI keep passing `--offline` (or set `offline: true` in config).
// Other tools that set non-interactive env vars (Jenkins agents, Azure
// DevOps tasks running interactively, agentic coding sessions) are
// deliberately excluded so they don't get the CI marker either.
const CI_ENVIRONMENT_VARIABLES = ["GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI"];

export const isCiEnvironment = (): boolean =>
  CI_ENVIRONMENT_VARIABLES.some((envVariable) => Boolean(process.env[envVariable])) ||
  process.env.CI === "true";
