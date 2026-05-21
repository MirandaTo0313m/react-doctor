// Stay narrow: only the canonical CI signals where we're confident
// the run is automated. The detection is used to suppress the share
// URL in the printed summary (it's just noise in CI logs) and to
// mark the run as CI-originated for the score path.
// CI no longer auto-implies `--offline` — users who want zero network
// in CI keep passing `--offline` (or set `offline: true` in config).
// Other tools that set non-interactive env vars (Jenkins agents,
// Azure DevOps tasks running interactively, agentic coding sessions)
// are deliberately excluded.
const CI_ENVIRONMENT_VARIABLES = ["GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI"];

export const isCiEnvironment = (): boolean =>
  CI_ENVIRONMENT_VARIABLES.some((envVariable) => Boolean(process.env[envVariable])) ||
  process.env.CI === "true";
