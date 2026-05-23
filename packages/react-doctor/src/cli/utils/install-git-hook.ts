import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GIT_HOOK_EXECUTABLE_MODE } from "./constants.js";

interface GitHookTarget {
  readonly hookPath: string;
  readonly runnerRoot: string;
}

interface InstallGitHookOptions {
  readonly hookPath: string;
  readonly projectRoot: string;
}

interface InstallGitHookResult {
  readonly hookPath: string;
  readonly runnerPath: string;
  readonly status: "created" | "updated";
}

const HOOK_FILE_NAME = "pre-commit";
const HOOK_RELATIVE_PATH = "hooks/pre-commit";
const HOOK_RUNNER_RELATIVE_PATH = ".react-doctor/hooks/pre-commit";
const MANAGED_BLOCK_START = "# react-doctor hook launcher start";
const MANAGED_BLOCK_END = "# react-doctor hook launcher end";
const MANAGED_BLOCK_PATTERN = new RegExp(
  `${MANAGED_BLOCK_START}[\\s\\S]*?${MANAGED_BLOCK_END}\\n?`,
);
const SHEBANG = "#!/bin/sh";
const SHEBANG_PREFIX = "#!";
const LOCAL_REACT_DOCTOR_BIN = "./node_modules/.bin/react-doctor";

const runGit = (projectRoot: string, args: ReadonlyArray<string>): string | null => {
  try {
    return execFileSync("git", [...args], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const resolveGitPath = (baseDirectory: string, value: string): string =>
  path.isAbsolute(value) ? value : path.resolve(baseDirectory, value);

export const detectGitHookTarget = (projectRoot: string): GitHookTarget | null => {
  if (runGit(projectRoot, ["rev-parse", "--is-inside-work-tree"]) !== "true") return null;

  const topLevel = runGit(projectRoot, ["rev-parse", "--show-toplevel"]) ?? projectRoot;
  const configuredHooksPath = runGit(projectRoot, ["config", "--path", "--get", "core.hooksPath"]);

  if (configuredHooksPath !== null && configuredHooksPath.length > 0) {
    return {
      hookPath: path.join(resolveGitPath(topLevel, configuredHooksPath), HOOK_FILE_NAME),
      runnerRoot: topLevel,
    };
  }

  const hookPath = runGit(projectRoot, ["rev-parse", "--git-path", HOOK_RELATIVE_PATH]);
  if (hookPath === null || hookPath.length === 0) return null;

  return {
    hookPath: resolveGitPath(projectRoot, hookPath),
    runnerRoot: topLevel,
  };
};

const buildReactDoctorHookRunner = (): string =>
  [
    SHEBANG,
    "react_doctor_scan_staged_files() {",
    `  if [ -x "${LOCAL_REACT_DOCTOR_BIN}" ]; then`,
    `    "${LOCAL_REACT_DOCTOR_BIN}" --staged --fail-on none`,
    "    return",
    "  fi",
    "",
    "  if command -v react-doctor >/dev/null 2>&1; then",
    "    react-doctor --staged --fail-on none",
    "    return",
    "  fi",
    "",
    "  if command -v pnpm >/dev/null 2>&1; then",
    "    pnpm dlx react-doctor@latest --staged --fail-on none",
    "    return",
    "  fi",
    "",
    "  if command -v npx >/dev/null 2>&1; then",
    "    npx --yes react-doctor@latest --staged --fail-on none",
    "    return",
    "  fi",
    "",
    "  printf '%s\\n' \"react-doctor: command not found; skipping staged scan.\"",
    "}",
    "",
    "printf '%s\\n' \"react-doctor: scanning staged files (non-blocking).\"",
    "if ! react_doctor_scan_staged_files; then",
    "  printf '%s\\n' \"react-doctor: staged scan failed; commit will continue.\"",
    "fi",
    "exit 0",
    "",
  ].join("\n");

const buildReactDoctorHookBlock = (): string =>
  [
    MANAGED_BLOCK_START,
    `if [ -f "${HOOK_RUNNER_RELATIVE_PATH}" ]; then`,
    `  if ! sh "${HOOK_RUNNER_RELATIVE_PATH}"; then`,
    "    printf '%s\\n' \"react-doctor: hook runner failed; commit will continue.\"",
    "  fi",
    "fi",
    MANAGED_BLOCK_END,
  ].join("\n");

const ensureTrailingNewline = (content: string): string =>
  content.endsWith("\n") ? content : `${content}\n`;

const mergeHookContent = (existingContent: string): string => {
  const hookBlock = `${buildReactDoctorHookBlock()}\n`;

  if (MANAGED_BLOCK_PATTERN.test(existingContent)) {
    return ensureTrailingNewline(existingContent.replace(MANAGED_BLOCK_PATTERN, hookBlock));
  }

  if (existingContent.length === 0) return `${SHEBANG}\n\n${hookBlock}`;

  const normalizedExistingContent = ensureTrailingNewline(existingContent);

  if (normalizedExistingContent.startsWith(SHEBANG_PREFIX)) {
    const [shebangLine, ...remainingLines] = normalizedExistingContent.split("\n");
    return [shebangLine, "", hookBlock.trimEnd(), ...remainingLines].join("\n");
  }

  return `${SHEBANG}\n\n${hookBlock}${normalizedExistingContent}`;
};

export const installReactDoctorGitHook = (options: InstallGitHookOptions): InstallGitHookResult => {
  const runnerPath = path.join(options.projectRoot, HOOK_RUNNER_RELATIVE_PATH);
  const didHookExist = existsSync(options.hookPath);
  const existingContent = didHookExist ? readFileSync(options.hookPath, "utf8") : "";
  const nextContent = mergeHookContent(existingContent);

  mkdirSync(path.dirname(runnerPath), { recursive: true });
  writeFileSync(runnerPath, buildReactDoctorHookRunner());
  chmodSync(runnerPath, GIT_HOOK_EXECUTABLE_MODE);

  mkdirSync(path.dirname(options.hookPath), { recursive: true });
  writeFileSync(options.hookPath, nextContent);
  chmodSync(options.hookPath, GIT_HOOK_EXECUTABLE_MODE);

  return {
    hookPath: options.hookPath,
    runnerPath,
    status: didHookExist ? "updated" : "created",
  };
};
