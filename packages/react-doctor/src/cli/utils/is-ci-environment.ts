// Narrow on canonical CI signals only. Used to suppress the share
// URL (noise in CI logs) and to mark the run as CI-originated for
// the score path. Does not imply `--offline`.
const CI_ENVIRONMENT_VARIABLES = ["GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI"];

export const isCiEnvironment = (): boolean =>
  CI_ENVIRONMENT_VARIABLES.some((envVariable) => Boolean(process.env[envVariable])) ||
  process.env.CI === "true";
