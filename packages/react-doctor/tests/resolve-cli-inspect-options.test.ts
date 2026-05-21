import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { resolveCliInspectOptions } from "../src/cli/utils/resolve-cli-inspect-options.js";

const CI_ENVIRONMENT_VARIABLES = ["CI", "GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI"] as const;

describe("resolveCliInspectOptions: CI behavior (issue #302)", () => {
  let savedEnvironment: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnvironment = {};
    for (const envVariable of CI_ENVIRONMENT_VARIABLES) {
      savedEnvironment[envVariable] = process.env[envVariable];
      delete process.env[envVariable];
    }
  });

  afterEach(() => {
    for (const envVariable of CI_ENVIRONMENT_VARIABLES) {
      const previousValue = savedEnvironment[envVariable];
      if (previousValue === undefined) {
        delete process.env[envVariable];
      } else {
        process.env[envVariable] = previousValue;
      }
    }
  });

  it("does NOT auto-flip offline in CI — the score API still runs so `outputs.score` works", () => {
    process.env.GITHUB_ACTIONS = "true";

    const resolved = resolveCliInspectOptions({}, null);

    expect(resolved.offline).toBe(false);
    expect(resolved.isCi).toBe(true);
  });

  it("respects an explicit user `--offline` flag in CI (zero-network opt-out is preserved)", () => {
    process.env.GITHUB_ACTIONS = "true";

    const resolved = resolveCliInspectOptions({ offline: true }, null);

    expect(resolved.offline).toBe(true);
    expect(resolved.isCi).toBe(true);
  });

  it("respects `offline: true` from user config in CI", () => {
    process.env.GITHUB_ACTIONS = "true";

    const resolved = resolveCliInspectOptions({}, { offline: true });

    expect(resolved.offline).toBe(true);
    expect(resolved.isCi).toBe(true);
  });

  it("leaves isCi false outside CI environments", () => {
    const resolved = resolveCliInspectOptions({}, null);

    expect(resolved.offline).toBe(false);
    expect(resolved.isCi).toBe(false);
  });

  it("flags GITLAB_CI and CIRCLECI as CI runs", () => {
    process.env.GITLAB_CI = "true";
    expect(resolveCliInspectOptions({}, null).isCi).toBe(true);
    delete process.env.GITLAB_CI;

    process.env.CIRCLECI = "true";
    expect(resolveCliInspectOptions({}, null).isCi).toBe(true);
  });
});
