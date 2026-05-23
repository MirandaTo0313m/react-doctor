import {
  constants as fsConstants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { installReactDoctorGitHook } from "../src/cli/utils/install-git-hook.js";

interface GitHookFixture {
  readonly projectRoot: string;
  readonly hookPath: string;
  readonly runnerPath: string;
  readonly cleanup: () => void;
}

const setupFixture = (): GitHookFixture => {
  const root = mkdtempSync(path.join(tmpdir(), "react-doctor-git-hook-"));
  return {
    projectRoot: root,
    hookPath: path.join(root, ".git/hooks/pre-commit"),
    runnerPath: path.join(root, ".react-doctor/hooks/pre-commit"),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
};

const readHook = (hookPath: string): string => readFileSync(hookPath, "utf8");

describe("installReactDoctorGitHook", () => {
  let fixture: GitHookFixture;

  beforeEach(() => {
    fixture = setupFixture();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("creates a dependency-free non-blocking pre-commit hook", () => {
    const result = installReactDoctorGitHook({
      hookPath: fixture.hookPath,
      projectRoot: fixture.projectRoot,
    });
    const hookContent = readHook(fixture.hookPath);
    const runnerContent = readHook(fixture.runnerPath);

    expect(result.status).toBe("created");
    expect(result.runnerPath).toBe(fixture.runnerPath);
    expect(hookContent).toContain("#!/bin/sh");
    expect(hookContent).toContain(".react-doctor/hooks/pre-commit");
    expect(runnerContent).toContain("react-doctor --staged --fail-on none");
    expect(runnerContent).toContain("pnpm dlx react-doctor@latest --staged --fail-on none");
    expect(runnerContent).toContain("npx --yes react-doctor@latest --staged --fail-on none");
    expect(runnerContent).toContain("if ! react_doctor_scan_staged_files; then");
    expect(runnerContent).toContain("exit 0");
    expect(hookContent).not.toContain("husky");
    expect(existsSync(fixture.hookPath)).toBe(true);
    expect(existsSync(fixture.runnerPath)).toBe(true);
    expect(Boolean(statSync(fixture.hookPath).mode & fsConstants.S_IXUSR)).toBe(true);
    expect(Boolean(statSync(fixture.runnerPath).mode & fsConstants.S_IXUSR)).toBe(true);
  });

  it("preserves existing hook content", () => {
    mkdirSync(path.dirname(fixture.hookPath), { recursive: true });
    writeFileSync(fixture.hookPath, "#!/bin/sh\nnpm test\n");

    const result = installReactDoctorGitHook({
      hookPath: fixture.hookPath,
      projectRoot: fixture.projectRoot,
    });
    const hookContent = readHook(fixture.hookPath);

    expect(result.status).toBe("updated");
    expect(hookContent.startsWith("#!/bin/sh\n\n# react-doctor hook launcher start")).toBe(true);
    expect(hookContent).toContain("npm test\n");
  });

  it("updates the managed block instead of duplicating it", () => {
    installReactDoctorGitHook({ hookPath: fixture.hookPath, projectRoot: fixture.projectRoot });
    installReactDoctorGitHook({ hookPath: fixture.hookPath, projectRoot: fixture.projectRoot });

    const hookContent = readHook(fixture.hookPath);
    const managedBlockMatches = hookContent.match(/# react-doctor hook launcher start/g) ?? [];

    expect(managedBlockMatches).toHaveLength(1);
  });
});
