import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { isSpinnerInteractive } from "../src/cli/utils/is-spinner-interactive.js";

interface ProcessStdoutTtyHandle {
  restore: () => void;
}

const stubStdout = (
  overrides: Partial<{ isTTY: boolean; columns: number }>,
): ProcessStdoutTtyHandle => {
  const previousIsTty = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  const previousColumns = Object.getOwnPropertyDescriptor(process.stdout, "columns");

  if ("isTTY" in overrides) {
    Object.defineProperty(process.stdout, "isTTY", {
      value: overrides.isTTY,
      configurable: true,
    });
  }
  if ("columns" in overrides) {
    Object.defineProperty(process.stdout, "columns", {
      value: overrides.columns,
      configurable: true,
    });
  }

  return {
    restore: () => {
      if (previousIsTty) {
        Object.defineProperty(process.stdout, "isTTY", previousIsTty);
      } else {
        delete (process.stdout as unknown as { isTTY?: boolean }).isTTY;
      }
      if (previousColumns) {
        Object.defineProperty(process.stdout, "columns", previousColumns);
      } else {
        delete (process.stdout as unknown as { columns?: number }).columns;
      }
    },
  };
};

const NON_INTERACTIVE_ENV_VARS = [
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
  "NO_SPINNER",
  "TERM",
] as const;

describe("isSpinnerInteractive", () => {
  let savedEnv: Record<string, string | undefined>;
  let stdoutHandle: ProcessStdoutTtyHandle;

  beforeEach(() => {
    savedEnv = {};
    for (const envVarName of NON_INTERACTIVE_ENV_VARS) {
      savedEnv[envVarName] = process.env[envVarName];
      delete process.env[envVarName];
    }
    stdoutHandle = stubStdout({ isTTY: true, columns: 80 });
  });

  afterEach(() => {
    for (const envVarName of NON_INTERACTIVE_ENV_VARS) {
      const previousValue = savedEnv[envVarName];
      if (previousValue === undefined) {
        delete process.env[envVarName];
      } else {
        process.env[envVarName] = previousValue;
      }
    }
    stdoutHandle.restore();
  });

  it("returns true on a fully interactive stdout TTY with sensible columns", () => {
    expect(isSpinnerInteractive()).toBe(true);
  });

  it("returns false when stdout is not a TTY", () => {
    stdoutHandle.restore();
    stdoutHandle = stubStdout({ isTTY: false, columns: 80 });
    expect(isSpinnerInteractive()).toBe(false);
  });

  // Regression guard for #293: under `script(1)` and Git pre-push hooks
  // stdout inherits a TTY but `columns` is reported as 0/undefined.
  // Without this check, ora's render loop computes
  // `Math.ceil(width / 0) === Infinity` lines to clear and emits
  // unbounded cursor-up + erase-line escapes (99% CPU, never returns).
  it("returns false when stdout.columns is 0 (e.g. under `script(1)` / Git hooks)", () => {
    stdoutHandle.restore();
    stdoutHandle = stubStdout({ isTTY: true, columns: 0 });
    expect(isSpinnerInteractive()).toBe(false);
  });

  it("returns false when stdout.columns is undefined", () => {
    stdoutHandle.restore();
    stdoutHandle = stubStdout({ isTTY: true, columns: undefined as unknown as number });
    expect(isSpinnerInteractive()).toBe(false);
  });

  it("returns false when TERM is `dumb`", () => {
    process.env.TERM = "dumb";
    expect(isSpinnerInteractive()).toBe(false);
  });

  it("returns false when NO_SPINNER is set (explicit opt-out)", () => {
    process.env.NO_SPINNER = "1";
    expect(isSpinnerInteractive()).toBe(false);
  });

  it("returns false when CI env var is set, even on a TTY", () => {
    process.env.CI = "true";
    expect(isSpinnerInteractive()).toBe(false);
  });

  it("returns false when CURSOR_AGENT env var is set", () => {
    process.env.CURSOR_AGENT = "1";
    expect(isSpinnerInteractive()).toBe(false);
  });
});
