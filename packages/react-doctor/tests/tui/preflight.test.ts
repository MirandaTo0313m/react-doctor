import { describe, expect, it } from "vite-plus/test";
import {
  detectNonInteractiveEnvironment,
  isNonInteractiveEnvironment,
  NON_INTERACTIVE_ENVIRONMENT_VARIABLES,
} from "../../src/utils/is-non-interactive-environment.js";
import { checkTuiPreflight } from "../../src/tui/index.js";

describe("isNonInteractiveEnvironment", () => {
  it("returns false for a clean environment", () => {
    expect(isNonInteractiveEnvironment({})).toBe(false);
  });

  it("returns true and names the triggering env var when CI is set", () => {
    const result = detectNonInteractiveEnvironment({ CI: "1" });
    expect(result.isNonInteractive).toBe(true);
    expect(result.triggeringEnvVar).toBe("CI");
  });

  it("detects every documented agent and CI env var", () => {
    for (const envVariable of NON_INTERACTIVE_ENVIRONMENT_VARIABLES) {
      const detection = detectNonInteractiveEnvironment({ [envVariable]: "1" });
      expect(detection.isNonInteractive, `failed for ${envVariable}`).toBe(true);
      expect(detection.triggeringEnvVar).toBe(envVariable);
    }
  });

  it("treats an empty env-var string as not set", () => {
    expect(isNonInteractiveEnvironment({ CI: "" })).toBe(false);
  });
});

describe("checkTuiPreflight", () => {
  it("passes when stdin / stdout are TTYs and the env is clean", () => {
    const result = checkTuiPreflight({}, true, true);
    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("refuses to run when stdout is not a TTY", () => {
    const result = checkTuiPreflight({}, false, true);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("interactive TTY");
    expect(result.hint).toContain("react-doctor tui");
  });

  it("refuses to run when stdin is not a TTY", () => {
    const result = checkTuiPreflight({}, true, false);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("interactive TTY");
  });

  it("refuses to run inside a Cursor agent session", () => {
    const result = checkTuiPreflight({ CURSOR_AGENT: "1" }, true, true);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("agent / CI environment");
    expect(result.reason).toContain("CURSOR_AGENT");
  });

  it("refuses to run on GitHub Actions", () => {
    const result = checkTuiPreflight({ GITHUB_ACTIONS: "true" }, true, true);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("GITHUB_ACTIONS");
  });

  it("includes a clear hint pointing at the non-interactive CLI", () => {
    const result = checkTuiPreflight({ CLAUDECODE: "1" }, true, true);
    expect(result.hint).toContain("react-doctor");
  });
});
