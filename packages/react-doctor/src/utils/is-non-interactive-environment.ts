// HACK: env vars that mean "user is not at an interactive shell." We use this
// to skip prompts and to refuse to start the Ink-based TUI. Do NOT use this
// list to auto-flip --offline — dev shells often have JENKINS_URL / TF_BUILD
// set as ambient config without actually running in CI.
export const NON_INTERACTIVE_ENVIRONMENT_VARIABLES = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "BUILDKITE",
  "JENKINS_URL",
  "TF_BUILD",
  "CODEBUILD_BUILD_ID",
  "TEAMCITY_VERSION",
  "BITBUCKET_BUILD_NUMBER",
  "CIRCLECI",
  "TRAVIS",
  "DRONE",
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CURSOR_AGENT",
  "CODEX_CI",
  "OPENCODE",
  "AMP_HOME",
] as const;

export interface NonInteractiveDetection {
  isNonInteractive: boolean;
  triggeringEnvVar?: string;
}

export const detectNonInteractiveEnvironment = (
  envSource: NodeJS.ProcessEnv = process.env,
): NonInteractiveDetection => {
  for (const envVariable of NON_INTERACTIVE_ENVIRONMENT_VARIABLES) {
    if (envSource[envVariable]) {
      return { isNonInteractive: true, triggeringEnvVar: envVariable };
    }
  }
  return { isNonInteractive: false };
};

export const isNonInteractiveEnvironment = (envSource: NodeJS.ProcessEnv = process.env): boolean =>
  detectNonInteractiveEnvironment(envSource).isNonInteractive;
