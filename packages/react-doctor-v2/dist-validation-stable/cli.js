import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import fs, { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import fs$1 from "node:fs/promises";
import os, { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Command } from "commander";
import pc from "picocolors";
import basePrompts from "prompts";
import { fileURLToPath } from "node:url";
import { parseSync } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";
//#region src/constants.ts
const CANONICAL_GITHUB_URL = "https://github.com/millionco/react-doctor";
const REACT_DOCTOR_CONFIG_FILENAME = "react-doctor.config.json";
const PACKAGE_JSON_FILENAME$1 = "package.json";
const PACKAGE_JSON_CONFIG_KEY = "reactDoctor";
const REACT_REVIEW_URL = "https://react.review";
const SHARE_BASE_URL = "https://www.react.doctor/share";
const ERROR_RULE_PENALTY = 1.5;
const WARNING_RULE_PENALTY = 0.75;
const SCORE_API_URL = "https://www.react.doctor/api/score";
const FETCH_TIMEOUT_MS = 1e4;
const MILLISECONDS_PER_SECOND = 1e3;
const DEFAULT_BRANCH_CANDIDATES = ["main", "master"];
const GIT_SHOW_MAX_BUFFER_BYTES = 50 * 1024 * 1024;
const SOURCE_FILE_PATTERN = /\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/;
//#endregion
//#region src/cli/highlighter.ts
const highlighter = {
  error: pc.red,
  warn: pc.yellow,
  info: pc.cyan,
  success: pc.green,
  dim: pc.dim,
  gray: pc.gray,
  bold: pc.bold,
};
//#endregion
//#region src/cli/handle-error.ts
const stringifyError = (error) => {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
};
const getErrorMessageChain = (error) => {
  const messages = [];
  let currentError = error;
  while (currentError instanceof Error) {
    messages.push(stringifyError(currentError));
    currentError = currentError.cause;
  }
  if (messages.length === 0) messages.push(stringifyError(error));
  return messages;
};
const handleCliError = (error) => {
  const errorChain = getErrorMessageChain(error).join("\nCaused by: ");
  console.error("");
  console.error(highlighter.error("Something went wrong. Please check the error below."));
  console.error(
    highlighter.error(`If the problem persists, open an issue at ${CANONICAL_GITHUB_URL}/issues.`),
  );
  console.error("");
  console.error(highlighter.error(errorChain));
  console.error("");
  process.exitCode = 1;
};
//#endregion
//#region src/cli/render-score-header.ts
const BRANDING_LINE = `React Doctor ${highlighter.dim("(www.react.doctor)")}`;
const colorizeByScore = (text, score) => {
  if (score >= 75) return highlighter.success(text);
  if (score >= 50) return highlighter.warn(text);
  return highlighter.error(text);
};
const buildScoreBar = (score) => {
  const filledCount = Math.round((score / 100) * 50);
  const emptyCount = 50 - filledCount;
  return colorizeByScore("█".repeat(filledCount), score) + highlighter.dim("░".repeat(emptyCount));
};
const getDoctorFace = (score) => {
  if (score >= 75) return ["◠ ◠", " ▽ "];
  if (score >= 50) return ["• •", " ─ "];
  return ["x x", " ▽ "];
};
const buildFaceRenderedLines = (score) => {
  const [eyes, mouth] = getDoctorFace(score);
  return ["┌─────┐", `│ ${eyes} │`, `│ ${mouth} │`, "└─────┘"].map((text) =>
    colorizeByScore(text, score),
  );
};
const printScoreHeader = (score, label) => {
  const renderedFaceLines = buildFaceRenderedLines(score);
  const scoreNumber = colorizeByScore(`${score}`, score);
  const scoreLabel = colorizeByScore(label, score);
  const rightColumnLines = [
    `${scoreNumber} ${highlighter.dim(`/ 100`)} ${scoreLabel}`,
    buildScoreBar(score),
    BRANDING_LINE,
    "",
  ];
  for (let lineIndex = 0; lineIndex < renderedFaceLines.length; lineIndex += 1) {
    const rightColumnContent = rightColumnLines[lineIndex] ?? "";
    const separator = rightColumnContent.length > 0 ? "  " : "";
    console.log(`  ${renderedFaceLines[lineIndex]}${separator}${rightColumnContent}`);
  }
  console.log("");
};
const printReactReviewCta = () => {
  console.log(
    `  ${highlighter.bold("→ Catch these issues on every PR:")} ${highlighter.info(REACT_REVIEW_URL)}`,
  );
  console.log(
    `  ${highlighter.dim("React Review is a GitHub App built on React Doctor — it runs on each pull request,")}`,
  );
  console.log(
    `  ${highlighter.dim("posts new issues as inline review comments, and tracks your team's score over time.")}`,
  );
  console.log("");
};
//#endregion
//#region src/cli/prompts.ts
const esmRequire$2 = createRequire(import.meta.url);
const PROMPTS_MULTISELECT_MODULE_PATH = "prompts/lib/elements/multiselect";
let didPatchToggleAll = false;
let didPatchSubmit = false;
const onCancel = () => {
  console.log("");
  console.log("Cancelled.");
  console.log("");
  process.exit(0);
};
const shouldSelectAll = (choiceStates) =>
  choiceStates
    .filter((choiceState) => !choiceState.disabled)
    .some((choiceState) => choiceState.selected !== true);
const shouldAutoSelectCurrent = (choiceStates, cursor) => {
  if (choiceStates.some((choiceState) => choiceState.selected)) return false;
  const currentChoice = choiceStates[cursor];
  return Boolean(currentChoice) && !currentChoice.disabled;
};
const patchMultiselectToggleAll = () => {
  if (didPatchToggleAll) return;
  didPatchToggleAll = true;
  const multiselectConstructor = esmRequire$2(PROMPTS_MULTISELECT_MODULE_PATH);
  multiselectConstructor.prototype.toggleAll = function () {
    if (this.maxChoices !== void 0 || Boolean(this.value[this.cursor]?.disabled)) {
      this.bell();
      return;
    }
    const shouldSelectAllEnabled = shouldSelectAll(this.value);
    for (const choiceState of this.value) {
      if (choiceState.disabled) continue;
      choiceState.selected = shouldSelectAllEnabled;
    }
    this.render();
  };
};
const patchMultiselectSubmit = () => {
  if (didPatchSubmit) return;
  didPatchSubmit = true;
  const multiselectConstructor = esmRequire$2(PROMPTS_MULTISELECT_MODULE_PATH);
  const originalSubmit = multiselectConstructor.prototype.submit;
  multiselectConstructor.prototype.submit = function () {
    if (shouldAutoSelectCurrent(this.value, this.cursor)) this.value[this.cursor].selected = true;
    originalSubmit.call(this);
  };
};
const prompts = (questions) => {
  patchMultiselectToggleAll();
  patchMultiselectSubmit();
  return basePrompts(questions, { onCancel });
};
//#endregion
//#region src/cli/select-projects.ts
const selectProjects = async (
  discoveredProjects,
  rootDirectory,
  projectFlag,
  skipPrompts,
  silent = false,
) => {
  if (discoveredProjects.length === 0) return [rootDirectory];
  if (discoveredProjects.length === 1) {
    if (!silent)
      console.log(
        `${highlighter.success("✔")} Select projects to scan ${highlighter.dim("›")} ${discoveredProjects[0].name}`,
      );
    return [discoveredProjects[0].directory];
  }
  if (projectFlag) return resolveProjectFlag(projectFlag, discoveredProjects);
  if (skipPrompts) {
    if (!silent)
      console.log(
        `${highlighter.success("✔")} Select projects to scan ${highlighter.dim("›")} ${discoveredProjects.map((project) => project.name).join(", ")}`,
      );
    return discoveredProjects.map((project) => project.directory);
  }
  return promptProjectSelection(discoveredProjects, rootDirectory);
};
const resolveProjectFlag = (projectFlag, discoveredProjects) => {
  const requestedNames = projectFlag.split(",").map((segment) => segment.trim());
  const resolvedDirectories = [];
  for (const requestedName of requestedNames) {
    const matched = discoveredProjects.find(
      (project) =>
        project.name === requestedName || path.basename(project.directory) === requestedName,
    );
    if (!matched) {
      const availableNames = discoveredProjects.map((project) => project.name).join(", ");
      throw new Error(`Project "${requestedName}" not found. Available: ${availableNames}`);
    }
    resolvedDirectories.push(matched.directory);
  }
  return resolvedDirectories;
};
const promptProjectSelection = async (discoveredProjects, rootDirectory) => {
  const { selectedDirectories } = await prompts({
    type: "multiselect",
    name: "selectedDirectories",
    message: "Select projects to scan",
    choices: discoveredProjects.map((project) => ({
      title: project.name,
      description: path.relative(rootDirectory, project.directory),
      value: project.directory,
    })),
    min: 1,
  });
  return selectedDirectories;
};
//#endregion
//#region src/cli/get-staged-files.ts
const getStagedFilePaths = (directory) => {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "-z", "--name-only", "--diff-filter=ACMR", "--relative"],
    {
      cwd: directory,
      stdio: "pipe",
      maxBuffer: GIT_SHOW_MAX_BUFFER_BYTES,
    },
  );
  if (result.error || result.status !== 0) return [];
  const output = result.stdout.toString();
  if (!output) return [];
  return output.split("\0").filter((filePath) => filePath.length > 0);
};
const readStagedContent = (directory, relativePath) => {
  const result = spawnSync("git", ["show", `:${relativePath}`], {
    cwd: directory,
    stdio: "pipe",
    maxBuffer: GIT_SHOW_MAX_BUFFER_BYTES,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.toString();
};
const getStagedSourceFiles = (directory) =>
  getStagedFilePaths(directory).filter((filePath) => SOURCE_FILE_PATTERN.test(filePath));
const PROJECT_CONFIG_FILENAMES = [
  "tsconfig.json",
  "tsconfig.base.json",
  "package.json",
  "react-doctor.config.json",
  "knip.json",
  "knip.jsonc",
  ".knip.json",
  ".knip.jsonc",
  "oxlint.json",
  ".oxlintrc.json",
];
const materializeStagedFiles = (directory, stagedFiles, tempDirectory) => {
  const materializedFiles = [];
  for (const relativePath of stagedFiles) {
    const content = readStagedContent(directory, relativePath);
    if (content === null) continue;
    const targetPath = path.join(tempDirectory, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
    materializedFiles.push(relativePath);
  }
  for (const configFilename of PROJECT_CONFIG_FILENAMES) {
    const sourcePath = path.join(directory, configFilename);
    const targetPath = path.join(tempDirectory, configFilename);
    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) fs.cpSync(sourcePath, targetPath);
  }
  return {
    tempDirectory,
    stagedFiles: materializedFiles,
    cleanup: () => {
      try {
        fs.rmSync(tempDirectory, {
          recursive: true,
          force: true,
        });
      } catch {}
    },
  };
};
//#endregion
//#region src/cli/get-diff-files.ts
const runGit = (cwd, args) => {
  const result = spawnSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.toString().trim();
};
const getCurrentBranch = (directory) => {
  const branch = runGit(directory, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!branch) return null;
  return branch === "HEAD" ? null : branch;
};
const detectDefaultBranch = (directory) => {
  const reference = runGit(directory, ["symbolic-ref", "refs/remotes/origin/HEAD"]);
  if (reference) return reference.replace("refs/remotes/origin/", "");
  const output = runGit(directory, [
    "for-each-ref",
    "--format=%(refname:short)",
    ...DEFAULT_BRANCH_CANDIDATES.map((candidate) => `refs/heads/${candidate}`),
  ]);
  if (output) {
    const firstLine = output.split("\n")[0]?.trim();
    if (firstLine) return firstLine;
  }
  return null;
};
const branchExists = (directory, branch) => {
  const result = spawnSync("git", ["rev-parse", "--verify", branch], {
    cwd: directory,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return !result.error && result.status === 0;
};
const runGitNullSeparated = (cwd, args) => {
  const result = spawnSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout
    .toString()
    .split("\0")
    .filter((filePath) => filePath.length > 0);
};
const getChangedFilesSinceBranch = (directory, baseBranch) => {
  const mergeBase = runGit(directory, ["merge-base", baseBranch, "HEAD"]);
  if (mergeBase === null) return null;
  return runGitNullSeparated(directory, [
    "diff",
    "-z",
    "--name-only",
    "--diff-filter=ACMR",
    "--relative",
    mergeBase,
  ]);
};
const getUncommittedChangedFiles = (directory) => {
  return (
    runGitNullSeparated(directory, [
      "diff",
      "-z",
      "--name-only",
      "--diff-filter=ACMR",
      "--relative",
      "HEAD",
    ]) ?? []
  );
};
const getDiffInfo = (directory, explicitBaseBranch) => {
  if (explicitBaseBranch !== void 0 && explicitBaseBranch.trim().length === 0)
    throw new Error("Diff base branch cannot be empty.");
  const currentBranch = getCurrentBranch(directory);
  if (!currentBranch) return null;
  const baseBranch = explicitBaseBranch ?? detectDefaultBranch(directory);
  if (!baseBranch) return null;
  if (explicitBaseBranch && !branchExists(directory, explicitBaseBranch))
    throw new Error(
      `Diff base branch "${explicitBaseBranch}" does not exist (run \`git fetch\` to update remote refs).`,
    );
  if (currentBranch === baseBranch) {
    const uncommittedFiles = getUncommittedChangedFiles(directory);
    if (uncommittedFiles.length === 0) return null;
    return {
      currentBranch,
      baseBranch,
      changedFiles: uncommittedFiles,
      isCurrentChanges: true,
    };
  }
  const changedFiles = getChangedFilesSinceBranch(directory, baseBranch);
  if (changedFiles === null) return null;
  return {
    currentBranch,
    baseBranch,
    changedFiles,
  };
};
const filterSourceFiles = (filePaths) =>
  filePaths.filter((filePath) => SOURCE_FILE_PATTERN.test(filePath));
//#endregion
//#region src/core/errors.ts
var ReactDoctorError = class extends Error {
  name = "ReactDoctorError";
  code;
  constructor(message, options = {}) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = options.code ?? "react-doctor/error";
  }
};
var ReactDoctorConfigError = class extends ReactDoctorError {
  name = "ReactDoctorConfigError";
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: options.code ?? "react-doctor/config-error",
    });
  }
};
var ReactDoctorInvalidConfigError = class extends ReactDoctorConfigError {
  name = "ReactDoctorInvalidConfigError";
  constructor(message, options) {
    super(message, {
      ...options,
      code: "react-doctor/invalid-config",
    });
  }
};
var ReactDoctorCheckError = class extends ReactDoctorError {
  name = "ReactDoctorCheckError";
  checkId;
  constructor(checkId, message, options = {}) {
    super(message, {
      ...options,
      code: options.code ?? "react-doctor/check-error",
    });
    this.checkId = checkId;
  }
};
var ReactDoctorCheckFailedError = class extends ReactDoctorCheckError {
  name = "ReactDoctorCheckFailedError";
  constructor(checkId, message, options) {
    super(checkId, message, {
      ...options,
      code: "react-doctor/check-failed",
    });
  }
};
var ReactDoctorRunnerUnavailableError = class extends ReactDoctorCheckError {
  name = "ReactDoctorRunnerUnavailableError";
  constructor(checkId, message, options) {
    super(checkId, message, {
      ...options,
      code: "react-doctor/runner-unavailable",
    });
  }
};
const toReactDoctorErrorInfo = (error) => {
  if (error instanceof ReactDoctorError)
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause === void 0 ? void 0 : toReactDoctorErrorInfo(error.cause),
    };
  if (error instanceof Error)
    return {
      name: error.name || "Error",
      message: error.message || error.name || "Unknown error",
      code: "react-doctor/unknown-error",
      cause: error.cause === void 0 ? void 0 : toReactDoctorErrorInfo(error.cause),
    };
  return {
    name: "Error",
    message: String(error),
    code: "react-doctor/unknown-error",
  };
};
//#endregion
//#region src/core/config.ts
const configCache = /* @__PURE__ */ new Map();
const isRecord$1 = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const pathExists = async (filePath) => {
  try {
    await fs$1.access(filePath);
    return true;
  } catch {
    return false;
  }
};
const isDirectory = async (filePath) => {
  try {
    return (await fs$1.stat(filePath)).isDirectory();
  } catch {
    return false;
  }
};
const parseJsonFile = async (filePath) => {
  try {
    return JSON.parse(await fs$1.readFile(filePath, "utf8"));
  } catch (error) {
    throw new ReactDoctorInvalidConfigError(`Failed to parse ${filePath}.`, { cause: error });
  }
};
const assertStringArray = (value, fieldName, context) => {
  if (value === void 0) return void 0;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new ReactDoctorInvalidConfigError(
      `${context.sourcePath}: "${fieldName}" must be an array of strings.`,
    );
  return value;
};
const assertBoolean = (value, fieldName, context) => {
  if (value === void 0) return void 0;
  if (typeof value !== "boolean")
    throw new ReactDoctorInvalidConfigError(
      `${context.sourcePath}: "${fieldName}" must be a boolean.`,
    );
  return value;
};
const assertString = (value, fieldName, context) => {
  if (value === void 0) return void 0;
  if (typeof value !== "string")
    throw new ReactDoctorInvalidConfigError(
      `${context.sourcePath}: "${fieldName}" must be a string.`,
    );
  return value;
};
const assertFailOnLevel = (value, context) => {
  if (value === void 0) return void 0;
  if (value === "error" || value === "warning" || value === "none") return value;
  throw new ReactDoctorInvalidConfigError(
    `${context.sourcePath}: "failOn" must be "error", "warning", or "none".`,
  );
};
const assertDiff = (value, context) => {
  if (value === void 0) return void 0;
  if (typeof value === "boolean" || typeof value === "string") return value;
  throw new ReactDoctorInvalidConfigError(
    `${context.sourcePath}: "diff" must be a boolean or branch name string.`,
  );
};
const assertIgnoreConfig = (value, context) => {
  if (value === void 0) return void 0;
  if (!isRecord$1(value))
    throw new ReactDoctorInvalidConfigError(`${context.sourcePath}: "ignore" must be an object.`);
  const overrides = [];
  if (value.overrides !== void 0) {
    if (
      !Array.isArray(value.overrides) ||
      value.overrides.some((override) => !isRecord$1(override))
    )
      throw new ReactDoctorInvalidConfigError(
        `${context.sourcePath}: "ignore.overrides" must be an array of objects.`,
      );
    for (const override of value.overrides) {
      if (!isRecord$1(override)) continue;
      overrides.push({
        files: assertStringArray(override.files, "ignore.overrides[].files", context) ?? [],
        rules: assertStringArray(override.rules, "ignore.overrides[].rules", context),
      });
    }
  }
  return {
    rules: assertStringArray(value.rules, "ignore.rules", context),
    files: assertStringArray(value.files, "ignore.files", context),
    overrides,
  };
};
const validateConfig = (value, sourcePath) => {
  if (!isRecord$1(value))
    throw new ReactDoctorInvalidConfigError(`${sourcePath}: config must be a JSON object.`);
  const context = { sourcePath };
  return {
    ignore: assertIgnoreConfig(value.ignore, context),
    lint: assertBoolean(value.lint, "lint", context),
    deadCode: assertBoolean(value.deadCode, "deadCode", context),
    verbose: assertBoolean(value.verbose, "verbose", context),
    diff: assertDiff(value.diff, context),
    offline: assertBoolean(value.offline, "offline", context),
    failOn: assertFailOnLevel(value.failOn, context),
    customRulesOnly: assertBoolean(value.customRulesOnly, "customRulesOnly", context),
    rootDir: assertString(value.rootDir, "rootDir", context),
    textComponents: assertStringArray(value.textComponents, "textComponents", context),
    rawTextWrapperComponents: assertStringArray(
      value.rawTextWrapperComponents,
      "rawTextWrapperComponents",
      context,
    ),
    respectInlineDisables: assertBoolean(
      value.respectInlineDisables,
      "respectInlineDisables",
      context,
    ),
    adoptExistingLintConfig: assertBoolean(
      value.adoptExistingLintConfig,
      "adoptExistingLintConfig",
      context,
    ),
    includeEcosystemRules: assertBoolean(
      value.includeEcosystemRules,
      "includeEcosystemRules",
      context,
    ),
    ignoredTags: assertStringArray(value.ignoredTags, "ignoredTags", context),
  };
};
const loadConfigFromDirectory = async (directory) => {
  const configPath = path.join(directory, REACT_DOCTOR_CONFIG_FILENAME);
  if (await pathExists(configPath))
    return {
      config: validateConfig(await parseJsonFile(configPath), configPath),
      sourceDirectory: directory,
      sourcePath: configPath,
    };
  const packageJsonPath = path.join(directory, PACKAGE_JSON_FILENAME$1);
  if (!(await pathExists(packageJsonPath))) return null;
  const packageJson = await parseJsonFile(packageJsonPath);
  if (!isRecord$1(packageJson) || !isRecord$1(packageJson["reactDoctor"])) return null;
  return {
    config: validateConfig(packageJson[PACKAGE_JSON_CONFIG_KEY], packageJsonPath),
    sourceDirectory: directory,
    sourcePath: `${packageJsonPath}#${PACKAGE_JSON_CONFIG_KEY}`,
  };
};
const isProjectBoundary = async (directory) =>
  (await pathExists(path.join(directory, ".git"))) ||
  (await pathExists(path.join(directory, "pnpm-workspace.yaml"))) ||
  (await pathExists(path.join(directory, "turbo.json"))) ||
  (await pathExists(path.join(directory, "nx.json")));
const loadReactDoctorConfig = async (startDirectory) => {
  const rootDirectory = path.resolve(startDirectory);
  const cachedConfig = configCache.get(rootDirectory);
  if (cachedConfig !== void 0) return cachedConfig;
  let currentDirectory = rootDirectory;
  while (true) {
    const loadedConfig = await loadConfigFromDirectory(currentDirectory);
    if (loadedConfig) {
      configCache.set(rootDirectory, loadedConfig);
      return loadedConfig;
    }
    const parentDirectory = path.dirname(currentDirectory);
    if (currentDirectory === parentDirectory || (await isProjectBoundary(currentDirectory))) {
      configCache.set(rootDirectory, null);
      return null;
    }
    currentDirectory = parentDirectory;
  }
};
const resolveConfigRootDirectory = async (loadedConfig, fallbackDirectory) => {
  if (!loadedConfig) return fallbackDirectory;
  const rootDir = loadedConfig.config.rootDir?.trim();
  if (!rootDir) return fallbackDirectory;
  const resolvedDirectory = path.isAbsolute(rootDir)
    ? rootDir
    : path.resolve(loadedConfig.sourceDirectory, rootDir);
  if (!(await isDirectory(resolvedDirectory)))
    throw new ReactDoctorInvalidConfigError(
      `${loadedConfig.sourcePath}: "rootDir" resolved to ${resolvedDirectory}, which is not a directory.`,
    );
  return resolvedDirectory;
};
//#endregion
//#region src/core/score.ts
const getScoreLabel = (score) => {
  if (score >= 75) return "Great";
  if (score >= 50) return "Needs work";
  return "Critical";
};
const rulePenalty = (severity, count) => {
  return (
    (severity === "error" ? ERROR_RULE_PENALTY : WARNING_RULE_PENALTY) *
    Math.min(1 + Math.log2(count), 4)
  );
};
const calculateScore = (diagnostics, options = {}) => {
  const perfectScore = options.perfectScore ?? 100;
  if (diagnostics.length === 0) return perfectScore;
  const ruleCounts = /* @__PURE__ */ new Map();
  const ruleSeverities = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    ruleCounts.set(ruleKey, (ruleCounts.get(ruleKey) ?? 0) + 1);
    if (diagnostic.severity === "error" || !ruleSeverities.has(ruleKey))
      ruleSeverities.set(ruleKey, diagnostic.severity);
  }
  let totalPenalty = 0;
  for (const [ruleKey, count] of ruleCounts) {
    const severity = ruleSeverities.get(ruleKey) ?? "warning";
    totalPenalty += rulePenalty(severity, count);
  }
  return Math.max(0, Math.min(perfectScore, Math.round(perfectScore - totalPenalty)));
};
//#endregion
//#region src/core/reports.ts
const toScoreDiagnostic = (issue) => {
  return {
    plugin: issue.source?.pluginName ?? "react-doctor",
    rule: issue.source?.ruleId ?? issue.id,
    severity: issue.severity === "error" ? "error" : "warning",
  };
};
const calculateReactDoctorScore = (issues) => {
  const value = calculateScore(issues.map(toScoreDiagnostic));
  return {
    value,
    label: getScoreLabel(value),
  };
};
const summarizeReactDoctorResult = (result) => {
  const affectedFiles = new Set(
    result.issues.flatMap((issue) => (issue.location?.filePath ? [issue.location.filePath] : [])),
  );
  return {
    errorCount: result.issues.filter((issue) => issue.severity === "error").length,
    warningCount: result.issues.filter((issue) => issue.severity === "warning").length,
    affectedFileCount: affectedFiles.size,
    totalIssueCount: result.issues.length,
    score: result.score?.value ?? null,
    scoreLabel: result.score?.label ?? null,
  };
};
const buildReactDoctorJsonReport = (result) => ({
  schemaVersion: 1,
  ok: result.status === "completed" && !result.issues.some((issue) => issue.severity === "error"),
  project: result.project,
  issues: result.issues,
  checks: result.checks,
  summary: summarizeReactDoctorResult(result),
  startedAt: result.startedAt,
  completedAt: result.completedAt,
  durationMilliseconds: result.durationMilliseconds,
});
//#endregion
//#region src/core/rules/codebase/analyzer/constants.ts
const SOURCE_FILE_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts"];
const ASSET_FILE_EXTENSIONS = new Set([
  ".avif",
  ".css",
  ".gif",
  ".jpeg",
  ".jpg",
  ".less",
  ".module.css",
  ".module.scss",
  ".png",
  ".sass",
  ".scss",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
]);
const TYPESCRIPT_DECLARATION_EXTENSIONS = [".d.ts", ".d.mts", ".d.cts"];
const IGNORED_DIRECTORY_NAMES = new Set([
  ".cache",
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);
const PACKAGE_JSON_FILENAME = "package.json";
const REACT_CLIENT_DIRECTIVE = "use client";
const REACT_SERVER_DIRECTIVE = "use server";
const DEFINITELY_TYPED_SCOPE = "@types";
const DEFAULT_CONDITION_NAMES = ["types", "import", "module", "browser", "node", "default"];
const RESOLVE_EXTENSIONS = [".tsx", ".ts", ".mts", ".cts", ".jsx", ".js", ".mjs", ".cjs", ".json"];
const COMMON_ENTRY_STEMS = new Set(["App", "index", "main"]);
const FRAMEWORK_ROUTE_ENTRY_STEMS = new Set([
  "_app",
  "_document",
  "apple-icon",
  "default",
  "error",
  "global-error",
  "icon",
  "layout",
  "loading",
  "manifest",
  "not-found",
  "opengraph-image",
  "page",
  "robots",
  "route",
  "sitemap",
  "template",
  "twitter-image",
]);
const TEST_ENTRY_MARKERS = [".test.", ".spec.", ".testcase.", ".stories.", ".story."];
const SUPPORT_ENTRY_PATTERNS = [
  "**/*.eval.{js,jsx,ts,tsx}",
  "evalite.config.{js,mjs,cjs,ts,mts,cts}",
];
const WHOLE_OBJECT_MEMBER_METHODS = new Set(["entries", "getOwnPropertyNames", "keys", "values"]);
const CHILD_PROCESS_ENTRY_METHODS = new Set(["execFile", "fork", "spawn"]);
const CHILD_PROCESS_MODULE_SPECIFIERS = new Set(["child_process", "node:child_process"]);
const NODE_MODULE_SPECIFIERS = new Set(["module", "node:module"]);
const PATH_MODULE_SPECIFIERS = new Set(["node:path", "path"]);
const PATH_ENTRY_HELPER_METHODS = new Set(["join", "resolve"]);
const WORKER_THREADS_MODULE_SPECIFIERS = new Set(["node:worker_threads", "worker_threads"]);
const PUBLIC_VISIBILITY_TAGS = new Set(["public", "alpha", "beta"]);
const EXPECTED_UNUSED_VISIBILITY_TAG = "expected-unused";
const DEAD_CODE_CHECK_ID = "react-doctor/codebase/dead-code";
const REACT_ARCHITECTURE_CHECK_ID = "react-doctor/codebase/react-architecture";
const DEPENDENCIES_CHECK_ID = "react-doctor/codebase/dependencies";
const SOURCE_ENTRY_FIELDS = ["source", "main", "module", "browser", "types", "typings"];
const MANIFEST_CONFIG_DEPENDENCY_FIELDS = [
  "babel",
  "commitlint",
  "eslintConfig",
  "jest",
  "lint-staged",
  "prettier",
  "release",
  "semantic-release",
  "simple-git-hooks",
  "vitest",
];
const SCRIPT_COMMAND_SEPARATORS = new Set(["&&", "||", ";", "|"]);
const SCRIPT_IGNORED_COMMANDS = new Set([
  "bun",
  "cd",
  "echo",
  "exit",
  "export",
  "mkdir",
  "node",
  "npm",
  "pnpm",
  "rm",
  "yarn",
]);
const SCRIPT_WRAPPER_COMMANDS = new Set(["cross-env", "dotenv", "env-cmd"]);
const SCRIPT_RUNNER_COMMANDS = new Set(["bunx", "npx"]);
const SCRIPT_PACKAGE_MANAGER_RUNNER_SUBCOMMANDS = {
  bun: new Set(["x"]),
  npm: new Set(["exec", "x"]),
  pnpm: new Set(["dlx", "exec"]),
  yarn: new Set(["dlx", "exec"]),
};
const SCRIPT_BINARY_PACKAGE_NAME_ALIASES = {
  eslint: ["eslint"],
  jest: ["jest"],
  "lint-staged": ["lint-staged"],
  next: ["next"],
  playwright: ["@playwright/test", "playwright"],
  prettier: ["prettier"],
  "run-p": ["npm-run-all"],
  "run-s": ["npm-run-all"],
  storybook: ["storybook", "@storybook/react", "@storybook/nextjs"],
  tsc: ["typescript"],
  tsup: ["tsup"],
  tsx: ["tsx"],
  turbo: ["turbo"],
  vite: ["vite"],
  vitest: ["vitest"],
};
const IGNORED_DEFINITELY_TYPED_PACKAGE_NAMES = new Set(["node", "bun", "jest"]);
const DEFAULT_INCLUDE_PATHS = ["."];
//#endregion
//#region src/core/rules/codebase/analyzer/manifest.ts
const EMPTY_OBJECT = {};
const toStringMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return /* @__PURE__ */ new Map();
  return new Map(Object.entries(value).filter((entry) => typeof entry[1] === "string"));
};
const readPackageJson = async (directory) => {
  const packageJsonPath = path.join(directory, PACKAGE_JSON_FILENAME);
  try {
    return JSON.parse(await fs$1.readFile(packageJsonPath, "utf8"));
  } catch {
    return null;
  }
};
const createDependencyBuckets = (manifest) => ({
  dependencies: toStringMap(manifest.dependencies ?? EMPTY_OBJECT),
  devDependencies: toStringMap(manifest.devDependencies ?? EMPTY_OBJECT),
  peerDependencies: toStringMap(manifest.peerDependencies ?? EMPTY_OBJECT),
  optionalDependencies: toStringMap(manifest.optionalDependencies ?? EMPTY_OBJECT),
});
const collectDependencyNames = (dependencyBuckets) =>
  new Set(Object.values(dependencyBuckets).flatMap((bucket) => [...bucket.keys()]));
const stripShellTokenQuotes = (token) => token.replace(/^["']|["']$/g, "");
const isEnvironmentAssignment = (token) => /^[A-Za-z_][A-Za-z0-9_]*=.*/.test(token);
const toCommandName = (token) => {
  return (stripShellTokenQuotes(token).split("/").at(-1) ?? "").replace(/\.(cmd|ps1|sh)$/, "");
};
const isCommandToken = (token) =>
  Boolean(token) && !isEnvironmentAssignment(token) && !token.startsWith("-");
const findNextCommandTokenIndex = (tokens, startIndex) => {
  for (let index = startIndex; index < tokens.length; index++) {
    const token = stripShellTokenQuotes(tokens[index] ?? "");
    if (SCRIPT_COMMAND_SEPARATORS.has(token)) return -1;
    if (token === "--") continue;
    if (isCommandToken(token)) return index;
  }
  return -1;
};
const findRunnerCommandIndex = (commandName, tokens, startIndex) => {
  if (SCRIPT_RUNNER_COMMANDS.has(commandName)) return findNextCommandTokenIndex(tokens, startIndex);
  const runnerSubcommands = SCRIPT_PACKAGE_MANAGER_RUNNER_SUBCOMMANDS[commandName];
  if (!runnerSubcommands) return -1;
  const subcommandIndex = findNextCommandTokenIndex(tokens, startIndex);
  if (subcommandIndex < 0) return -1;
  const subcommand = toCommandName(stripShellTokenQuotes(tokens[subcommandIndex] ?? ""));
  if (!runnerSubcommands.has(subcommand)) return -1;
  return findNextCommandTokenIndex(tokens, subcommandIndex + 1);
};
const resolveCommandPackageNames = (commandName, dependencyNames) => {
  const aliases = SCRIPT_BINARY_PACKAGE_NAME_ALIASES[commandName] ?? [commandName];
  const declaredAliases = aliases.filter((packageName) => dependencyNames.has(packageName));
  return declaredAliases.length > 0 ? declaredAliases : aliases.slice(0, 1);
};
const collectScriptCommands = (script) => {
  const commands = [];
  const tokens = script.match(/[^\s]+/g) ?? [];
  let isExpectingCommand = true;
  let environmentAssignmentQuote = null;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] ?? "";
    if (environmentAssignmentQuote) {
      if (token.endsWith(environmentAssignmentQuote)) environmentAssignmentQuote = null;
      continue;
    }
    const strippedToken = stripShellTokenQuotes(token);
    if (SCRIPT_COMMAND_SEPARATORS.has(strippedToken)) {
      isExpectingCommand = true;
      continue;
    }
    if (isEnvironmentAssignment(strippedToken)) {
      const assignmentValue = token.slice(token.indexOf("=") + 1);
      const openingQuote = assignmentValue[0];
      if ((openingQuote === '"' || openingQuote === "'") && !assignmentValue.endsWith(openingQuote))
        environmentAssignmentQuote = openingQuote;
      continue;
    }
    if (!isExpectingCommand || strippedToken.startsWith("-")) continue;
    const commandName = toCommandName(strippedToken);
    const runnerCommandIndex = findRunnerCommandIndex(commandName, tokens, index + 1);
    if (runnerCommandIndex >= 0) {
      commands.push(toCommandName(stripShellTokenQuotes(tokens[runnerCommandIndex] ?? "")));
      index = runnerCommandIndex;
      isExpectingCommand = false;
      continue;
    }
    if (!commandName || SCRIPT_IGNORED_COMMANDS.has(commandName)) {
      isExpectingCommand = false;
      continue;
    }
    commands.push(commandName);
    isExpectingCommand = SCRIPT_WRAPPER_COMMANDS.has(commandName);
  }
  return commands;
};
const collectScriptDependencyNames = (manifest, dependencyNames) => {
  const scriptDependencyNames = /* @__PURE__ */ new Set();
  for (const script of Object.values(manifest.scripts ?? EMPTY_OBJECT)) {
    for (const packageName of collectNodeOptionsDependencyNames(script))
      scriptDependencyNames.add(packageName);
    for (const commandName of collectScriptCommands(script))
      for (const packageName of resolveCommandPackageNames(commandName, dependencyNames))
        scriptDependencyNames.add(packageName);
  }
  return scriptDependencyNames;
};
const SCRIPT_FILE_RUNNER_COMMANDS = new Set([
  ...SCRIPT_IGNORED_COMMANDS,
  ...SCRIPT_RUNNER_COMMANDS,
  ...Object.keys(SCRIPT_BINARY_PACKAGE_NAME_ALIASES),
]);
const isSourceFilePath$1 = (token) =>
  SOURCE_FILE_EXTENSIONS.some((extension) => token.endsWith(extension));
const collectScriptFileEntries = (script) => {
  const entries = [];
  const tokens = (script.match(/[^\s]+/g) ?? []).map(stripShellTokenQuotes);
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] ?? "";
    if (SCRIPT_COMMAND_SEPARATORS.has(token)) continue;
    if (token.startsWith("-")) continue;
    if (isSourceFilePath$1(token) && !token.startsWith("-")) {
      entries.push(token);
      continue;
    }
    const commandName = toCommandName(token);
    if (!SCRIPT_FILE_RUNNER_COMMANDS.has(commandName)) continue;
    for (let argumentIndex = index + 1; argumentIndex < tokens.length; argumentIndex++) {
      const argument = tokens[argumentIndex] ?? "";
      if (SCRIPT_COMMAND_SEPARATORS.has(argument)) break;
      if (argument.startsWith("-")) continue;
      if (argument === "run" || argument === "exec") continue;
      if (isSourceFilePath$1(argument)) {
        entries.push(argument);
        break;
      }
      break;
    }
  }
  return entries;
};
const collectScriptFileEntryPaths = (manifest) => {
  const entries = [];
  for (const script of Object.values(manifest.scripts ?? EMPTY_OBJECT))
    entries.push(...collectScriptFileEntries(script));
  return entries;
};
const collectManifestDependencyNamesFromValue = (value, dependencyNames, references) => {
  if (typeof value === "string") {
    const packageName = toManifestPackageName(value);
    if (packageName) references.add(packageName);
    for (const dependencyName of dependencyNames)
      if (value === dependencyName || value.startsWith(`${dependencyName}/`))
        references.add(dependencyName);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value)
      collectManifestDependencyNamesFromValue(item, dependencyNames, references);
    return;
  }
  for (const item of Object.values(value))
    collectManifestDependencyNamesFromValue(item, dependencyNames, references);
};
const isLikelyPackageName = (value) =>
  value.startsWith("@") || value.includes("-") || value.includes("/");
const toManifestPackageName = (value) => {
  if (value.startsWith(".") || value.startsWith("/") || value.includes(" ")) return null;
  if (!isLikelyPackageName(value)) return null;
  const parts = value.split("/");
  const firstPart = parts[0];
  if (!firstPart) return null;
  if (firstPart.startsWith("@")) {
    const secondPart = parts[1];
    return secondPart ? `${firstPart}/${secondPart}` : null;
  }
  return firstPart;
};
const toNodeOptionsPackageName = (value) => {
  if (value.startsWith(".") || value.startsWith("/") || value.includes(" ")) return null;
  const parts = value.split("/");
  const firstPart = parts[0];
  if (!firstPart) return null;
  if (firstPart.startsWith("@")) {
    const secondPart = parts[1];
    return secondPart ? `${firstPart}/${secondPart}` : null;
  }
  return firstPart;
};
const collectNodeOptionsDependencyNames = (script) => {
  const references = /* @__PURE__ */ new Set();
  for (const match of script.matchAll(/\bNODE_OPTIONS=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    const nodeOptions = match[1] ?? match[2] ?? match[3] ?? "";
    for (const optionMatch of nodeOptions.matchAll(/(?:--require|-r|--import)(?:=|\s+)([^\s]+)/g)) {
      const packageName = toNodeOptionsPackageName(stripShellTokenQuotes(optionMatch[1] ?? ""));
      if (packageName) references.add(packageName);
    }
  }
  return references;
};
const collectManifestDependencyNames = (manifest, dependencyNames) => {
  const references = /* @__PURE__ */ new Set();
  for (const field of MANIFEST_CONFIG_DEPENDENCY_FIELDS)
    collectManifestDependencyNamesFromValue(manifest[field], dependencyNames, references);
  collectManifestDependencyNamesFromValue(manifest.imports, dependencyNames, references);
  return references;
};
const collectExportEntryValues = (value, entries) => {
  if (typeof value === "string") {
    entries.add(value);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectExportEntryValues(item, entries);
    return;
  }
  for (const item of Object.values(value)) collectExportEntryValues(item, entries);
};
const collectBinEntries = (manifest, entries) => {
  if (typeof manifest.bin === "string") {
    entries.add(manifest.bin);
    return;
  }
  if (!manifest.bin || typeof manifest.bin !== "object") return;
  for (const value of Object.values(manifest.bin))
    if (typeof value === "string") entries.add(value);
};
const collectManifestEntrySpecifiers = (manifest) => {
  const entries = /* @__PURE__ */ new Set();
  for (const field of SOURCE_ENTRY_FIELDS) {
    const value = manifest[field];
    if (typeof value === "string") entries.add(value);
  }
  collectBinEntries(manifest, entries);
  collectExportEntryValues(manifest.exports, entries);
  collectExportEntryValues(manifest.imports, entries);
  return [...entries].filter((entry) => entry.startsWith(".") || entry.startsWith("/")).sort();
};
const collectManifestSupportSpecifiers = (manifest) => {
  if (!Array.isArray(manifest.sideEffects)) return [];
  return manifest.sideEffects
    .filter((entry) => typeof entry === "string")
    .filter((entry) => entry.startsWith(".") || entry.startsWith("/"))
    .sort();
};
const isOptionalPeerDependency = (workspace, packageName) =>
  Boolean(workspace.manifest.peerDependenciesMeta?.[packageName]?.optional);
//#endregion
//#region src/core/project.ts
const FRAMEWORK_PACKAGES = {
  "@remix-run/react": "remix",
  "@tanstack/react-start": "tanstack-start",
  expo: "expo",
  gatsby: "gatsby",
  next: "nextjs",
  "react-native": "react-native",
  "react-scripts": "cra",
  vite: "vite",
};
const REACT_COMPILER_PACKAGES = new Set([
  "babel-plugin-react-compiler",
  "eslint-plugin-react-compiler",
  "react-compiler-runtime",
]);
const REACT_COMPILER_PACKAGE_REFERENCE_PATTERN =
  /babel-plugin-react-compiler|react-compiler-runtime|eslint-plugin-react-compiler|["']react-compiler["']/;
const REACT_COMPILER_ENABLED_FLAG_PATTERN = /["']?reactCompiler["']?\s*:\s*(?:true\b|\{)/;
const NEXT_CONFIG_FILENAMES = [
  "next.config.cjs",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
];
const BABEL_CONFIG_FILENAMES = [
  ".babelrc",
  ".babelrc.json",
  "babel.config.cjs",
  "babel.config.js",
  "babel.config.json",
  "babel.config.mjs",
];
const VITE_CONFIG_FILENAMES = [
  "vite.config.cjs",
  "vite.config.cts",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.mts",
  "vite.config.ts",
  "vitest.config.js",
  "vitest.config.ts",
];
const EXPO_CONFIG_FILENAMES = ["app.config.js", "app.config.ts", "app.json"];
const TANSTACK_AI_PACKAGES = new Set(["@tanstack/ai", "@tanstack/ai-code-mode"]);
const TANSTACK_QUERY_PACKAGES = new Set([
  "@tanstack/query-core",
  "@tanstack/react-query",
  "react-query",
]);
const SOURCE_FILE_EXTENSION_SET = new Set(SOURCE_FILE_EXTENSIONS);
const createEmptyCatalogInfo = () => ({
  defaultVersions: /* @__PURE__ */ new Map(),
  groupedVersions: /* @__PURE__ */ new Map(),
});
const isSourceFileName = (fileName) => SOURCE_FILE_EXTENSION_SET.has(path.extname(fileName));
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const addCatalogVersions = (target, value) => {
  if (!isRecord(value)) return;
  for (const [packageName, version] of Object.entries(value))
    if (typeof version === "string") target.set(packageName, version);
};
const addGroupedCatalogVersions = (catalogs, value) => {
  if (!isRecord(value)) return;
  for (const [catalogName, entries] of Object.entries(value)) {
    const versions = catalogs.groupedVersions.get(catalogName) ?? /* @__PURE__ */ new Map();
    addCatalogVersions(versions, entries);
    catalogs.groupedVersions.set(catalogName, versions);
  }
};
const mergeManifestCatalogs = (catalogs, manifest) => {
  if (!manifest) return;
  addCatalogVersions(catalogs.defaultVersions, manifest.catalog);
  addGroupedCatalogVersions(catalogs, manifest.catalogs);
  const workspaces = manifest.workspaces;
  if (isRecord(workspaces)) {
    addCatalogVersions(catalogs.defaultVersions, workspaces.catalog);
    addGroupedCatalogVersions(catalogs, workspaces.catalogs);
  }
};
const PNPM_WORKSPACE_FILENAME = "pnpm-workspace.yaml";
const stripYamlComment$1 = (line) => {
  let quote = null;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if ((character === '"' || character === "'") && line[index - 1] !== "\\")
      quote = quote === character ? null : (quote ?? character);
    if (character === "#" && !quote) return line.slice(0, index);
  }
  return line;
};
const stripYamlValue = (value) =>
  stripYamlComment$1(value)
    .trim()
    .replace(/^["']|["']$/g, "");
const parsePnpmWorkspaceFile = (content) => {
  const result = {
    patterns: [],
    defaultCatalog: /* @__PURE__ */ new Map(),
    namedCatalogs: /* @__PURE__ */ new Map(),
  };
  let section = "none";
  let currentCatalogName = "";
  for (const rawLine of content.split("\n")) {
    const line = stripYamlComment$1(rawLine);
    if (line.trim().length === 0) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    if (indent === 0) {
      if (trimmed === "packages:") {
        section = "packages";
        continue;
      }
      if (trimmed === "catalog:") {
        section = "catalog";
        continue;
      }
      if (trimmed === "catalogs:") {
        section = "catalogs";
        continue;
      }
      if (trimmed.startsWith("-") && section === "packages") {
        const pattern = stripYamlValue(trimmed.slice(1));
        if (pattern) result.patterns.push(pattern);
        continue;
      }
      section = "none";
      continue;
    }
    if (section === "packages") {
      if (trimmed.startsWith("-")) {
        const pattern = stripYamlValue(trimmed.slice(1));
        if (pattern) result.patterns.push(pattern);
      }
      continue;
    }
    if (section === "catalog") {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const key = stripYamlValue(trimmed.slice(0, colonIndex));
        const value = stripYamlValue(trimmed.slice(colonIndex + 1));
        if (key && value) result.defaultCatalog.set(key, value);
      }
      continue;
    }
    if (section === "catalogs") {
      if (trimmed.endsWith(":") && !trimmed.includes(" ")) {
        currentCatalogName = stripYamlValue(trimmed.slice(0, -1));
        result.namedCatalogs.set(currentCatalogName, /* @__PURE__ */ new Map());
        section = "named-catalog";
      }
      continue;
    }
    if (section === "named-catalog") {
      if (indent <= 2 && trimmed.endsWith(":") && !trimmed.includes(" ")) {
        currentCatalogName = stripYamlValue(trimmed.slice(0, -1));
        result.namedCatalogs.set(currentCatalogName, /* @__PURE__ */ new Map());
        continue;
      }
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0 && currentCatalogName) {
        const key = stripYamlValue(trimmed.slice(0, colonIndex));
        const value = stripYamlValue(trimmed.slice(colonIndex + 1));
        if (key && value) {
          const catalog = result.namedCatalogs.get(currentCatalogName);
          if (catalog) catalog.set(key, value);
        }
      }
    }
  }
  return result;
};
const readPnpmWorkspaceFile = async (directory) => {
  try {
    return parsePnpmWorkspaceFile(
      await fs$1.readFile(path.join(directory, PNPM_WORKSPACE_FILENAME), "utf8"),
    );
  } catch {
    return null;
  }
};
const mergePnpmWorkspaceCatalogs = (catalogs, file) => {
  for (const [name, version] of file.defaultCatalog) catalogs.defaultVersions.set(name, version);
  for (const [catalogName, entries] of file.namedCatalogs) {
    const target = catalogs.groupedVersions.get(catalogName) ?? /* @__PURE__ */ new Map();
    for (const [name, version] of entries) target.set(name, version);
    catalogs.groupedVersions.set(catalogName, target);
  }
};
const collectAncestorCatalogs = async (rootDirectory) => {
  const catalogs = createEmptyCatalogInfo();
  let currentDirectory = rootDirectory;
  while (true) {
    mergeManifestCatalogs(catalogs, await readPackageJson(currentDirectory));
    const pnpmFile = await readPnpmWorkspaceFile(currentDirectory);
    if (pnpmFile) mergePnpmWorkspaceCatalogs(catalogs, pnpmFile);
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) return catalogs;
    currentDirectory = parentDirectory;
  }
};
const readNearestPackageInfo = async (rootDirectory) => {
  const catalogs = await collectAncestorCatalogs(rootDirectory);
  let currentDirectory = rootDirectory;
  while (true) {
    const manifest = await readPackageJson(currentDirectory);
    if (manifest)
      return {
        manifest,
        packageJsonPath: path.join(currentDirectory, PACKAGE_JSON_FILENAME),
        catalogs,
      };
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory)
      return {
        manifest: null,
        packageJsonPath: null,
        catalogs,
      };
    currentDirectory = parentDirectory;
  }
};
const collectDependencies = (manifest) =>
  new Map(
    [
      ...Object.entries(manifest?.peerDependencies ?? {}),
      ...Object.entries(manifest?.dependencies ?? {}),
      ...Object.entries(manifest?.devDependencies ?? {}),
      ...Object.entries(manifest?.optionalDependencies ?? {}),
    ].filter((entry) => typeof entry[1] === "string"),
  );
const hasAnyDependency = (dependencies, packageNames) => {
  for (const packageName of packageNames) if (dependencies.has(packageName)) return true;
  return false;
};
const hasReactCompilerDependency = (manifest) =>
  hasAnyDependency(collectDependencies(manifest), REACT_COMPILER_PACKAGES);
const detectFramework = (dependencies) => {
  for (const [packageName, framework] of Object.entries(FRAMEWORK_PACKAGES))
    if (dependencies.has(packageName)) return framework;
  return dependencies.has("react") ? "react" : "unknown";
};
const toResolvedDependencyVersion = (packageName, version, catalogs) => {
  if (!version) return null;
  if (version.startsWith("catalog:")) {
    const catalogName = version.slice(8);
    if (!catalogName) return catalogs.defaultVersions.get(packageName) ?? null;
    return catalogs.groupedVersions.get(catalogName)?.get(packageName) ?? null;
  }
  if (version.startsWith("workspace:")) return null;
  return version;
};
const parseReactMajorVersion = (version) => {
  if (!version) return null;
  const match = version.match(/\d+/);
  if (!match) return null;
  return Number.parseInt(match[0], 10);
};
const getDependencyInfo = (packageInfo) => {
  const { catalogs, manifest } = packageInfo;
  const dependencies = collectDependencies(manifest);
  return {
    reactVersion: toResolvedDependencyVersion("react", dependencies.get("react"), catalogs),
    reactPeerDependencyRange:
      typeof manifest?.peerDependencies?.react === "string"
        ? manifest.peerDependencies.react
        : null,
    tailwindVersion: toResolvedDependencyVersion(
      "tailwindcss",
      dependencies.get("tailwindcss"),
      catalogs,
    ),
    framework: detectFramework(dependencies),
    hasReactCompiler: hasReactCompilerDependency(manifest),
    hasTanStackAI: hasAnyDependency(dependencies, TANSTACK_AI_PACKAGES),
    hasTanStackQuery: hasAnyDependency(dependencies, TANSTACK_QUERY_PACKAGES),
  };
};
const readTextFile = async (filePath) => {
  try {
    return await fs$1.readFile(filePath, "utf8");
  } catch {
    return null;
  }
};
const hasReactCompilerConfigText = (content) =>
  REACT_COMPILER_ENABLED_FLAG_PATTERN.test(content) ||
  REACT_COMPILER_PACKAGE_REFERENCE_PATTERN.test(content);
const hasReactCompilerInConfigFiles = async (directory, filenames) => {
  for (const filename of filenames) {
    const content = await readTextFile(path.join(directory, filename));
    if (content && hasReactCompilerConfigText(content)) return true;
  }
  return false;
};
const hasReactCompilerInLocalConfig = async (directory) =>
  (await hasReactCompilerInConfigFiles(directory, NEXT_CONFIG_FILENAMES)) ||
  (await hasReactCompilerInConfigFiles(directory, BABEL_CONFIG_FILENAMES)) ||
  (await hasReactCompilerInConfigFiles(directory, VITE_CONFIG_FILENAMES)) ||
  (await hasReactCompilerInConfigFiles(directory, EXPO_CONFIG_FILENAMES));
const hasWorkspaceBoundary = (manifest) => Boolean(manifest?.workspaces);
const hasDirectoryEntry = async (directory, entryName) => {
  try {
    await fs$1.access(path.join(directory, entryName));
    return true;
  } catch {
    return false;
  }
};
const hasReactCompilerInAncestorPackage = async (rootDirectory) => {
  let currentDirectory = path.dirname(rootDirectory);
  while (currentDirectory !== path.dirname(currentDirectory)) {
    const manifest = await readPackageJson(currentDirectory);
    if (hasReactCompilerDependency(manifest)) return true;
    if (hasWorkspaceBoundary(manifest) || (await hasDirectoryEntry(currentDirectory, ".git")))
      return false;
    currentDirectory = path.dirname(currentDirectory);
  }
  return false;
};
const detectReactCompiler = async (rootDirectory, manifest) => {
  if (hasReactCompilerDependency(manifest)) return true;
  if (await hasReactCompilerInLocalConfig(rootDirectory)) return true;
  return hasReactCompilerInAncestorPackage(rootDirectory);
};
const collectSourceFileInfo = async (rootDirectory) => {
  const sourceFileInfo = {
    count: 0,
    hasTypeScript: false,
  };
  const directories = [rootDirectory];
  while (directories.length > 0) {
    const directory = directories.pop();
    if (!directory) continue;
    let entries;
    try {
      entries = await fs$1.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && !IGNORED_DIRECTORY_NAMES.has(entry.name))
          directories.push(path.join(directory, entry.name));
        continue;
      }
      if (entry.isFile() && isSourceFileName(entry.name)) {
        sourceFileInfo.count++;
        sourceFileInfo.hasTypeScript ||= /\.(cts|mts|ts|tsx)$/.test(entry.name);
      }
    }
  }
  return sourceFileInfo;
};
const toOxlintProjectInfo = (project) => {
  return {
    framework:
      project.framework === "nextjs" ||
      project.framework === "expo" ||
      project.framework === "react-native" ||
      project.framework === "tanstack-start"
        ? project.framework
        : "react",
    hasReactCompiler: project.hasReactCompiler,
    hasTanStackAI: project.hasTanStackAI,
    hasTanStackQuery: project.hasTanStackQuery,
    hasTypeScript: project.hasTypeScript,
    reactMajorVersion: project.reactMajorVersion,
    reactPeerDependencyRange: project.reactPeerDependencyRange,
    tailwindVersion: project.tailwindVersion,
  };
};
const hasFile$1 = async (filePath) => {
  try {
    return (await fs$1.stat(filePath)).isFile();
  } catch {
    return false;
  }
};
const toNpmWorkspacePatterns = (manifest) => {
  const workspaces = manifest?.workspaces;
  if (!workspaces) return [];
  if (Array.isArray(workspaces)) return workspaces.filter((value) => typeof value === "string");
  if (isRecord(workspaces) && Array.isArray(workspaces.packages))
    return workspaces.packages.filter((value) => typeof value === "string");
  return [];
};
const isMonorepoRoot = async (directory) => {
  if (toNpmWorkspacePatterns(await readPackageJson(directory)).length > 0) return true;
  return hasFile$1(path.join(directory, PNPM_WORKSPACE_FILENAME));
};
const findAncestorMonorepoRoot = async (startDirectory) => {
  let currentDirectory = path.dirname(startDirectory);
  while (currentDirectory !== path.dirname(currentDirectory)) {
    if (await isMonorepoRoot(currentDirectory)) return currentDirectory;
    currentDirectory = path.dirname(currentDirectory);
  }
  return null;
};
const expandWorkspacePattern = async (rootDirectory, pattern) => {
  const normalized = pattern.replace(/\*\*/g, "*");
  const wildcardIndex = normalized.indexOf("*");
  if (wildcardIndex < 0) {
    const directory = path.resolve(rootDirectory, normalized);
    return (await hasFile$1(path.join(directory, "package.json"))) ? [directory] : [];
  }
  const prefix = normalized.slice(0, wildcardIndex).replace(/\/$/, "");
  const suffix = normalized.slice(wildcardIndex + 1).replace(/^\//, "");
  const baseDirectory = path.resolve(rootDirectory, prefix || ".");
  let entries;
  try {
    entries = await fs$1.readdir(baseDirectory, { withFileTypes: true });
  } catch {
    return [];
  }
  const directories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || IGNORED_DIRECTORY_NAMES.has(entry.name)) continue;
    const candidate = path.join(baseDirectory, entry.name, suffix);
    if (await hasFile$1(path.join(candidate, "package.json"))) directories.push(candidate);
  }
  return directories;
};
const findTailwindcssInWorkspaces = async (monorepoRoot, catalogs) => {
  const npmPatterns = toNpmWorkspacePatterns(await readPackageJson(monorepoRoot));
  const pnpmPatterns = (await readPnpmWorkspaceFile(monorepoRoot))?.patterns ?? [];
  const patterns = [...new Set([...npmPatterns, ...pnpmPatterns])].filter(
    (entry) => !entry.startsWith("!"),
  );
  for (const pattern of patterns) {
    const directories = await expandWorkspacePattern(monorepoRoot, pattern);
    for (const directory of directories) {
      const resolved = toResolvedDependencyVersion(
        "tailwindcss",
        collectDependencies(await readPackageJson(directory)).get("tailwindcss"),
        catalogs,
      );
      if (resolved) return resolved;
    }
  }
  return null;
};
const discoverReactProject = async (rootDirectory) => {
  const resolvedRootDirectory = path.resolve(rootDirectory);
  const packageInfo = await readNearestPackageInfo(resolvedRootDirectory);
  const dependencyInfo = getDependencyInfo(packageInfo);
  let tailwindVersion = dependencyInfo.tailwindVersion;
  if (!tailwindVersion && (await isMonorepoRoot(resolvedRootDirectory)))
    tailwindVersion = await findTailwindcssInWorkspaces(
      resolvedRootDirectory,
      packageInfo.catalogs,
    );
  if (!tailwindVersion) {
    const ancestorMonorepoRoot = await findAncestorMonorepoRoot(resolvedRootDirectory);
    if (ancestorMonorepoRoot)
      tailwindVersion = await findTailwindcssInWorkspaces(
        ancestorMonorepoRoot,
        packageInfo.catalogs,
      );
  }
  const sourceFileInfo = await collectSourceFileInfo(resolvedRootDirectory);
  const hasReactCompiler =
    dependencyInfo.hasReactCompiler ||
    (await detectReactCompiler(resolvedRootDirectory, packageInfo.manifest));
  return {
    rootDirectory: resolvedRootDirectory,
    projectName: packageInfo.manifest?.name ?? path.basename(resolvedRootDirectory),
    packageJsonPath: packageInfo.packageJsonPath,
    reactVersion: dependencyInfo.reactVersion,
    reactMajorVersion: parseReactMajorVersion(dependencyInfo.reactVersion),
    reactPeerDependencyRange: dependencyInfo.reactPeerDependencyRange,
    tailwindVersion,
    framework: dependencyInfo.framework,
    hasTypeScript: sourceFileInfo.hasTypeScript,
    hasReactCompiler,
    hasTanStackAI: dependencyInfo.hasTanStackAI,
    hasTanStackQuery: dependencyInfo.hasTanStackQuery,
    sourceFileCount: sourceFileInfo.count,
  };
};
//#endregion
//#region src/core/is-test-file-path.ts
const TEST_FILE_PATH_PATTERN =
  /(?:^|\/)(?:__tests__|__test__|tests|test|__mocks__|cypress|e2e|playwright)\/|\.(?:test|spec|stories|story|fixture|fixtures)\.(?:[cm]?[jt]sx?)$/;
const isTestFilePath = (relativePath) => {
  if (relativePath.length === 0) return false;
  const forwardSlashed = relativePath.replaceAll("\\", "/");
  return TEST_FILE_PATH_PATTERN.test(forwardSlashed);
};
//#endregion
//#region src/core/rules/registry.ts
const defineRule = (rule) => rule;
const toRuleMap = (rules) => {
  const ruleMap = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    if (ruleMap.get(rule.metadata.id))
      throw new ReactDoctorInvalidConfigError(
        `Duplicate React Doctor rule id: ${rule.metadata.id}`,
      );
    ruleMap.set(rule.metadata.id, rule);
  }
  return ruleMap;
};
const assertKnownRule = (ruleMap, ruleId) => {
  if (!ruleMap.has(ruleId))
    throw new ReactDoctorInvalidConfigError(`Unknown React Doctor rule id: ${ruleId}`);
};
const toRuleSelection = (options) => ({
  enabledRuleIds: options.enabledRuleIds,
  disabledRuleIds: options.disabledRuleIds,
});
const mergeSelections = (baseSelection, overrideSelection = {}) => ({
  enabledRuleIds: [
    ...(baseSelection.enabledRuleIds ?? []),
    ...(overrideSelection.enabledRuleIds ?? []),
  ],
  disabledRuleIds: [
    ...(baseSelection.disabledRuleIds ?? []),
    ...(overrideSelection.disabledRuleIds ?? []),
  ],
});
const runRule = async (rule, context) => {
  const startedMilliseconds = globalThis.performance.now();
  try {
    context.signal?.throwIfAborted();
    const result = await rule.run({
      rootDirectory: context.rootDirectory,
      includePaths: context.includePaths,
      excludePatterns: context.excludePatterns,
      signal: context.signal,
      getCodebaseAnalysis: context.getCodebaseAnalysis,
    });
    return {
      id: rule.metadata.id,
      name: rule.metadata.name,
      status: "completed",
      issues: result.issues,
      durationMilliseconds: globalThis.performance.now() - startedMilliseconds,
    };
  } catch (error) {
    return {
      id: rule.metadata.id,
      name: rule.metadata.name,
      status: "failed",
      issues: [],
      durationMilliseconds: globalThis.performance.now() - startedMilliseconds,
      error: toReactDoctorErrorInfo(error),
    };
  }
};
const createRuleRegistry$1 = (options = {}) => {
  const rules = options.rules ?? [];
  const ruleMap = toRuleMap(rules);
  const defaultSelection = toRuleSelection(options);
  const validateSelection = (selection = {}) => {
    for (const ruleId of selection.enabledRuleIds ?? []) assertKnownRule(ruleMap, ruleId);
    for (const ruleId of selection.disabledRuleIds ?? []) assertKnownRule(ruleMap, ruleId);
  };
  const isRuleEnabled = (ruleId, selection = {}) => {
    assertKnownRule(ruleMap, ruleId);
    const mergedSelection = mergeSelections(defaultSelection, selection);
    validateSelection(mergedSelection);
    if (mergedSelection.disabledRuleIds?.includes(ruleId)) return false;
    if (mergedSelection.enabledRuleIds?.includes(ruleId)) return true;
    const rule = ruleMap.get(ruleId);
    return Boolean(rule?.metadata.defaultEnabled);
  };
  const registry = {
    listRules: () => [...rules],
    listMetadata: () => rules.map((rule) => rule.metadata),
    getRule: (ruleId) => ruleMap.get(ruleId) ?? null,
    isRuleEnabled,
    selectRules: (selection = {}) => {
      validateSelection(selection);
      return rules.filter((rule) => isRuleEnabled(rule.metadata.id, selection));
    },
    runRules: async (context) => {
      const selectedRules = registry.selectRules(context.selection);
      return Promise.all(selectedRules.map((rule) => runRule(rule, context)));
    },
    enableRule: (ruleId) => {
      assertKnownRule(ruleMap, ruleId);
      return createRuleRegistry$1({
        rules,
        enabledRuleIds: [...(defaultSelection.enabledRuleIds ?? []), ruleId],
        disabledRuleIds: (defaultSelection.disabledRuleIds ?? []).filter(
          (disabledRuleId) => disabledRuleId !== ruleId,
        ),
      });
    },
    disableRule: (ruleId) => {
      assertKnownRule(ruleMap, ruleId);
      return createRuleRegistry$1({
        rules,
        enabledRuleIds: (defaultSelection.enabledRuleIds ?? []).filter(
          (enabledRuleId) => enabledRuleId !== ruleId,
        ),
        disabledRuleIds: [...(defaultSelection.disabledRuleIds ?? []), ruleId],
      });
    },
  };
  validateSelection(defaultSelection);
  return registry;
};
//#endregion
//#region src/core/rules/lint/react/utils/boolean-prop-prefix-pattern.ts
const BOOLEAN_PROP_PREFIX_PATTERN = /^(?:is|has|should|can|show|hide|enable|disable|with)[A-Z]/;
//#endregion
//#region src/core/rules/lint/react/utils/hook-objects-with-methods.ts
const HOOK_OBJECTS_WITH_METHODS = new Map([
  ["useRouter", new Set(["push", "replace", "back", "forward", "refresh", "prefetch"])],
  [
    "useNavigation",
    new Set(["navigate", "push", "goBack", "popToTop", "reset", "replace", "dispatch"]),
  ],
  ["useSearchParams", new Set(["get", "getAll", "has", "set"])],
]);
//#endregion
//#region src/core/rules/lint/react/utils/legacy-context-names.ts
const LEGACY_CONTEXT_NAMES = new Set(["childContextTypes", "contextTypes", "getChildContext"]);
//#endregion
//#region src/core/rules/lint/react/utils/legacy-lifecycle-replacements.ts
const LEGACY_LIFECYCLE_REPLACEMENTS = new Map([
  [
    "componentWillMount",
    "Move side effects to `componentDidMount`; move initial state to `constructor`",
  ],
  [
    "componentWillReceiveProps",
    "Move side effects to `componentDidUpdate` (compare prevProps); move pure state derivation to the static `getDerivedStateFromProps`",
  ],
  [
    "componentWillUpdate",
    "Move DOM reads to `getSnapshotBeforeUpdate` (passes the value to `componentDidUpdate`); move other work to `componentDidUpdate`",
  ],
]);
//#endregion
//#region src/core/rules/lint/react/utils/react-19-deprecated-messages.ts
const REACT_19_DEPRECATED_MESSAGES = new Map([
  [
    "forwardRef",
    "forwardRef is no longer needed on React 19+ - refs are regular props on function components; remove forwardRef and pass ref directly",
  ],
  [
    "useContext",
    "useContext is superseded by `use()` on React 19+ - `use()` reads context conditionally inside hooks, branches, and loops; switch to `import { use } from 'react'`",
  ],
]);
//#endregion
//#region src/core/rules/lint/react/utils/react-dom-deprecated-messages.ts
const REACT_DOM_DEPRECATED_MESSAGES = new Map([
  [
    "render",
    "ReactDOM.render is the legacy root API - switch to `import { createRoot } from 'react-dom/client'` and call `createRoot(container).render(...)` (REMOVED in React 19)",
  ],
  [
    "hydrate",
    "ReactDOM.hydrate is the legacy SSR API - switch to `import { hydrateRoot } from 'react-dom/client'` and call `hydrateRoot(container, <App />)` (REMOVED in React 19)",
  ],
  [
    "unmountComponentAtNode",
    "ReactDOM.unmountComponentAtNode no longer works on roots created with `createRoot` - keep a reference to the root and call `root.unmount()` instead (REMOVED in React 19)",
  ],
  [
    "findDOMNode",
    "ReactDOM.findDOMNode crawls the rendered tree and breaks composition - accept a ref directly and read `ref.current` (REMOVED in React 19)",
  ],
]);
//#endregion
//#region src/core/rules/lint/react/utils/react-dom-test-utils-replacements.ts
const REACT_DOM_TEST_UTILS_REPLACEMENTS = new Map([
  ["act", "`import { act } from 'react'` instead"],
  ["Simulate", "`fireEvent` from `@testing-library/react` instead"],
  ["renderIntoDocument", "`render` from `@testing-library/react` instead"],
  ["findRenderedDOMComponentWithTag", "`getByRole` / `getByTestId` from `@testing-library/react`"],
  ["findRenderedDOMComponentWithClass", "`getByRole` or `container.querySelector` from RTL"],
  ["scryRenderedDOMComponentsWithTag", "`getAllByRole` from `@testing-library/react`"],
]);
//#endregion
//#region src/core/rules/lint/react/utils/render-prop-pattern.ts
const RENDER_PROP_PATTERN = /^render[A-Z]/;
//#endregion
//#region src/core/rules/lint/utils/has-type-property.ts
const hasTypeProperty = (value) => Boolean(value && typeof value === "object" && "type" in value);
//#endregion
//#region src/core/rules/lint/utils/is-node-of-type.ts
const isNodeOfType = (node, type) => Boolean(hasTypeProperty(node) && node.type === type);
//#endregion
//#region src/core/rules/lint/utils/is-ast-node.ts
const isAstNode = (value) => {
  if (!hasTypeProperty(value)) return false;
  return typeof value.type === "string";
};
//#endregion
//#region src/core/rules/lint/utils/walk-ast.ts
const walkAst = (node, visitor) => {
  if (!node || typeof node !== "object") return;
  if (visitor(node) === false) return;
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child)
        if (isAstNode(item)) {
          item.parent = node;
          walkAst(item, visitor);
        }
    } else if (isAstNode(child)) {
      child.parent = node;
      walkAst(child, visitor);
    }
  }
};
//#endregion
//#region src/core/rules/lint/utils/walk-inside-statement-blocks.ts
const walkInsideStatementBlocks = (node, visitor) => {
  if (!node || typeof node !== "object") return;
  if (
    isNodeOfType(node, "FunctionDeclaration") ||
    isNodeOfType(node, "FunctionExpression") ||
    isNodeOfType(node, "ArrowFunctionExpression")
  )
    return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) if (isAstNode(item)) walkInsideStatementBlocks(item, visitor);
    } else if (isAstNode(child)) walkInsideStatementBlocks(child, visitor);
  }
};
//#endregion
//#region src/core/rules/lint/constants.ts
const LAYOUT_PROPERTIES = new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderWidth",
  "fontSize",
  "lineHeight",
  "gap",
]);
const MOTION_ANIMATE_PROPS = new Set([
  "animate",
  "initial",
  "exit",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
]);
const HEAVY_LIBRARIES = new Set([
  "@monaco-editor/react",
  "monaco-editor",
  "recharts",
  "@react-pdf/renderer",
  "react-quill",
  "@codemirror/view",
  "@codemirror/state",
  "chart.js",
  "react-chartjs-2",
  "@toast-ui/editor",
  "draft-js",
]);
const FETCH_CALLEE_NAMES = new Set(["fetch", "ky", "got", "wretch", "ofetch"]);
const FETCH_MEMBER_OBJECTS = new Set(["axios", "ky", "got", "ofetch", "wretch", "request"]);
const INDEX_PARAMETER_NAMES = new Set(["index", "idx", "i"]);
const BARREL_INDEX_SUFFIXES = ["/index", "/index.js", "/index.ts", "/index.tsx", "/index.mjs"];
const PASSIVE_EVENT_NAMES = new Set(["scroll", "wheel", "touchstart", "touchmove", "touchend"]);
const LOOP_TYPES = [
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
];
const AUTH_FUNCTION_NAMES = new Set([
  "auth",
  "getSession",
  "getServerSession",
  "getUser",
  "requireAuth",
  "checkAuth",
  "verifyAuth",
  "authenticate",
  "currentUser",
  "getAuth",
  "validateSession",
  "checkAdminAccess",
  "requireAdmin",
  "ensureAuth",
  "ensureAuthenticated",
  "requireSession",
  "assertAuth",
  "protectRoute",
  "guardAuth",
]);
const SECRET_PATTERNS = [
  /^sk_live_/,
  /^sk_test_/,
  /^AKIA[0-9A-Z]{16}$/,
  /^ghp_[a-zA-Z0-9]{36}$/,
  /^gho_[a-zA-Z0-9]{36}$/,
  /^github_pat_/,
  /^glpat-/,
  /^xox[bporas]-/,
  /^sk-[a-zA-Z0-9]{32,}$/,
];
const SECRET_VARIABLE_PATTERN = /(?:api_?key|secret|token|password|credential|auth)/i;
const SECRET_FALSE_POSITIVE_SUFFIXES = new Set([
  "modal",
  "label",
  "text",
  "title",
  "name",
  "id",
  "key",
  "url",
  "path",
  "route",
  "page",
  "param",
  "field",
  "column",
  "header",
  "placeholder",
  "description",
  "type",
  "icon",
  "class",
  "style",
  "variant",
  "event",
  "action",
  "status",
  "state",
  "mode",
  "flag",
  "option",
  "config",
  "message",
  "error",
  "display",
  "view",
  "component",
  "element",
  "container",
  "wrapper",
  "button",
  "link",
  "input",
  "select",
  "dialog",
  "menu",
  "form",
  "step",
  "index",
  "count",
  "length",
  "role",
  "scope",
  "context",
  "provider",
  "ref",
  "handler",
  "query",
  "schema",
  "constant",
]);
const LOADING_STATE_PATTERN = /^(?:isLoading|isPending)$/;
const TANSTACK_ROUTE_FILE_PATTERN = /\/routes\//;
const TANSTACK_ROOT_ROUTE_FILE_PATTERN = /__root\.(tsx?|jsx?)$/;
const TANSTACK_ROUTE_PROPERTY_ORDER = [
  "params",
  "validateSearch",
  "loaderDeps",
  "search.middlewares",
  "ssr",
  "context",
  "beforeLoad",
  "loader",
  "onEnter",
  "onStay",
  "onLeave",
  "head",
  "scripts",
  "headers",
  "remountDeps",
];
const TANSTACK_ROUTE_CREATION_FUNCTIONS = new Set([
  "createFileRoute",
  "createRoute",
  "createRootRoute",
  "createRootRouteWithContext",
]);
const TANSTACK_SERVER_FN_NAMES = new Set(["createServerFn"]);
const TANSTACK_MIDDLEWARE_METHOD_ORDER = [
  "middleware",
  "inputValidator",
  "client",
  "server",
  "handler",
];
const TANSTACK_REDIRECT_FUNCTIONS = new Set(["redirect", "notFound"]);
const TANSTACK_SERVER_FN_FILE_PATTERN = /\.functions(\.[jt]sx?)?$/;
const TANSTACK_QUERY_HOOKS = new Set([
  "useQuery",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useSuspenseInfiniteQuery",
]);
const TANSTACK_MUTATION_HOOKS = new Set(["useMutation"]);
const QUERY_CACHE_UPDATE_METHODS = new Set([
  "invalidateQueries",
  "setQueryData",
  "setQueriesData",
  "resetQueries",
  "refetchQueries",
  "removeQueries",
  "cancelQueries",
  "clear",
]);
const STABLE_HOOK_WRAPPERS = new Set(["useState", "useMemo", "useRef"]);
const SCRIPT_LOADING_ATTRIBUTES = new Set(["defer", "async"]);
const GENERIC_EVENT_SUFFIXES = new Set(["Click", "Change", "Input", "Blur", "Focus"]);
const TRIVIAL_INITIALIZER_NAMES = new Set([
  "Boolean",
  "String",
  "Number",
  "Array",
  "Object",
  "parseInt",
  "parseFloat",
]);
const TRIVIAL_DERIVATION_CALLEE_NAMES = new Set([
  "Boolean",
  "String",
  "Number",
  "Array",
  "Object",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "BigInt",
  "Symbol",
]);
const BUILTIN_GLOBAL_NAMESPACE_NAMES = new Set([
  "Math",
  "Date",
  "JSON",
  "Object",
  "Array",
  "Number",
  "String",
  "Boolean",
  "RegExp",
  "Symbol",
  "BigInt",
  "Reflect",
]);
const SETTER_PATTERN = /^set[A-Z]/;
const RENDER_FUNCTION_PATTERN = /^render[A-Z]/;
const UPPERCASE_PATTERN$1 = /^[A-Z]/;
const PAGE_FILE_PATTERN = /\/page\.(tsx?|jsx?)$/;
const REACT_HANDLER_PROP_PATTERN = /^on[A-Z]/;
const PAGE_OR_LAYOUT_FILE_PATTERN = /\/(page|layout)\.(tsx?|jsx?)$/;
const INTERNAL_PAGE_PATH_PATTERN =
  /\/(?:(?:\((?:dashboard|admin|settings|account|internal|manage|console|portal|auth|onboarding|app|ee|protected)\))|(?:dashboard|admin|settings|account|internal|manage|console|portal))\//i;
const TEST_FILE_PATTERN = /\.(?:test|spec|stories)\.[tj]sx?$/;
const TEST_OR_INFRA_FILE_PATTERN =
  /(?:\.(?:test|spec|stories|e2e|integration)\.[tj]sx?$|\/(?:__tests__|tests?|__mocks__|__fixtures__|fixtures|e2e|playwright)\/)/;
const OG_ROUTE_PATTERN = /\/og\b/i;
const OG_IMAGE_FILE_PATTERN$1 =
  /\/(?:opengraph-image|twitter-image|icon|apple-icon)\.[jt]sx?$|\.opengraph\.[jt]sx?$/;
const NON_SEO_PAGE_PATTERN =
  /\/(?:install|callback|login|logout|signup|sign-up|sign-in|auth|verify|oauth)\//i;
const PAGES_DIRECTORY_PATTERN = /\/pages\//;
const NEXTJS_NAVIGATION_FUNCTIONS = new Set([
  "redirect",
  "permanentRedirect",
  "notFound",
  "forbidden",
  "unauthorized",
]);
const GOOGLE_FONTS_PATTERN = /fonts\.googleapis\.com/;
const POLYFILL_SCRIPT_PATTERN = /polyfill\.io|polyfill\.min\.js|cdn\.polyfill/;
const EXECUTABLE_SCRIPT_TYPES = new Set(["text/javascript", "application/javascript", "module"]);
const APP_DIRECTORY_PATTERN = /\/app\//;
const ROUTE_HANDLER_FILE_PATTERN = /\/route\.(tsx?|jsx?)$/;
const MUTATION_METHOD_NAMES = new Set([
  "create",
  "insert",
  "insertInto",
  "update",
  "upsert",
  "delete",
  "remove",
  "destroy",
  "set",
  "append",
]);
const MUTATING_ARRAY_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
]);
const MUTATING_HTTP_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);
const MUTATING_ROUTE_SEGMENTS = new Set([
  "logout",
  "log-out",
  "signout",
  "sign-out",
  "unsubscribe",
  "delete",
  "remove",
  "revoke",
  "cancel",
  "deactivate",
]);
const EFFECT_HOOK_NAMES = new Set(["useEffect", "useLayoutEffect"]);
const HOOKS_WITH_DEPS = new Set(["useEffect", "useLayoutEffect", "useMemo", "useCallback"]);
const TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES = new Set([
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",
]);
const TIMER_CALLEE_NAMES_REQUIRING_CLEANUP = new Set(["setInterval", "setTimeout"]);
const TIMER_CLEANUP_CALLEE_NAMES = new Set(["clearInterval", "clearTimeout"]);
const MUTABLE_GLOBAL_ROOTS = new Set([
  "location",
  "window",
  "document",
  "navigator",
  "history",
  "screen",
  "performance",
]);
const SUBSCRIPTION_METHOD_NAMES = new Set([
  "subscribe",
  "addEventListener",
  "addListener",
  "on",
  "watch",
  "listen",
  "sub",
]);
const UNSUBSCRIPTION_METHOD_NAMES = new Set([
  "unsubscribe",
  "removeEventListener",
  "removeListener",
  "remove",
  "off",
  "unwatch",
  "unlisten",
  "unsub",
]);
const CLEANUP_LIKE_RELEASE_CALLEE_NAMES = new Set([
  ...UNSUBSCRIPTION_METHOD_NAMES,
  "cleanup",
  "dispose",
  "destroy",
  "teardown",
]);
const EXTERNAL_SYNC_MEMBER_METHOD_NAMES = new Set([
  ...SUBSCRIPTION_METHOD_NAMES,
  "connect",
  "disconnect",
  "open",
  "close",
  "fetch",
  "post",
  "put",
  "patch",
]);
const EXTERNAL_SYNC_HTTP_CLIENT_RECEIVERS = new Set([
  ...FETCH_MEMBER_OBJECTS,
  "api",
  "client",
  "http",
  "fetcher",
]);
const EXTERNAL_SYNC_AMBIGUOUS_HTTP_METHOD_NAMES = new Set(["get", "head", "options", "delete"]);
const EXTERNAL_SYNC_DIRECT_CALLEE_NAMES = new Set([
  ...FETCH_CALLEE_NAMES,
  ...TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES,
]);
const EXTERNAL_SYNC_OBSERVER_CONSTRUCTORS = new Set([
  "IntersectionObserver",
  "MutationObserver",
  "ResizeObserver",
  "PerformanceObserver",
]);
const EVENT_TRIGGERED_SIDE_EFFECT_CALLEES = new Set([
  ...FETCH_CALLEE_NAMES,
  "post",
  "put",
  "patch",
  "navigate",
  "navigateTo",
  "showNotification",
  "toast",
  "alert",
  "confirm",
  "logVisit",
  "captureEvent",
]);
const EVENT_TRIGGERED_SIDE_EFFECT_MEMBER_METHODS = new Set([
  "post",
  "put",
  "patch",
  "delete",
  "navigate",
  "capture",
  "track",
  "logEvent",
]);
const EVENT_TRIGGERED_NAVIGATION_METHOD_NAMES = new Set(["push", "replace"]);
const NAVIGATION_RECEIVER_NAMES = new Set([
  "router",
  "navigation",
  "navigator",
  "history",
  "location",
]);
const CHAINABLE_ITERATION_METHODS = new Set(["map", "filter", "forEach", "flatMap"]);
const STORAGE_OBJECTS = new Set(["localStorage", "sessionStorage"]);
const BLUR_VALUE_PATTERN = /blur\((\d+(?:\.\d+)?)px\)/;
const ANIMATION_CALLBACK_NAMES = new Set(["requestAnimationFrame", "setInterval"]);
const REACT_NATIVE_TEXT_COMPONENTS = new Set([
  "Text",
  "TextInput",
  "Typography",
  "Paragraph",
  "Span",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);
const REACT_NATIVE_TEXT_COMPONENT_KEYWORDS = new Set([
  "Text",
  "Title",
  "Label",
  "Heading",
  "Caption",
  "Subtitle",
  "Typography",
  "Paragraph",
  "Description",
  "Body",
]);
const DEPRECATED_RN_MODULE_REPLACEMENTS = new Map([
  ["AsyncStorage", "@react-native-async-storage/async-storage"],
  ["Picker", "@react-native-picker/picker"],
  ["PickerIOS", "@react-native-picker/picker"],
  ["DatePickerIOS", "@react-native-community/datetimepicker"],
  ["DatePickerAndroid", "@react-native-community/datetimepicker"],
  ["ProgressBarAndroid", "a community alternative"],
  ["ProgressViewIOS", "a community alternative"],
  ["SafeAreaView", "react-native-safe-area-context"],
  ["Slider", "@react-native-community/slider"],
  ["ViewPagerAndroid", "react-native-pager-view"],
  ["WebView", "react-native-webview"],
  ["NetInfo", "@react-native-community/netinfo"],
  ["CameraRoll", "@react-native-camera-roll/camera-roll"],
  ["Clipboard", "@react-native-clipboard/clipboard"],
  ["ImageEditor", "@react-native-community/image-editor"],
  ["MaskedViewIOS", "@react-native-masked-view/masked-view"],
]);
const LEGACY_EXPO_PACKAGE_REPLACEMENTS = new Map([
  ["expo-av", "expo-audio for audio and expo-video for video"],
  [
    "expo-permissions",
    "the permissions API in each module (e.g. Camera.requestPermissionsAsync())",
  ],
  [
    "@expo/vector-icons",
    "expo-symbols or expo-image (see https://docs.expo.dev/versions/latest/sdk/symbols/)",
  ],
]);
const REACT_NATIVE_LIST_COMPONENTS = new Set([
  "FlatList",
  "SectionList",
  "VirtualizedList",
  "FlashList",
]);
const LEGACY_SHADOW_STYLE_PROPERTIES = new Set([
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "elevation",
]);
const BOUNCE_ANIMATION_NAMES = new Set(["bounce", "elastic", "wobble", "jiggle", "spring"]);
const LONG_TRANSITION_DURATION_THRESHOLD_MS = 1e3;
const HEADING_TAG_NAMES = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const HEAVY_HEADING_TAILWIND_WEIGHTS = new Set(["font-bold", "font-extrabold", "font-black"]);
const TAILWIND_DEFAULT_PALETTE_NAMES = ["indigo", "gray", "slate"];
const TAILWIND_DEFAULT_PALETTE_STOPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];
const TAILWIND_PALETTE_UTILITY_PREFIXES = [
  "text",
  "bg",
  "border",
  "ring",
  "fill",
  "stroke",
  "from",
  "to",
  "via",
  "decoration",
  "divide",
  "outline",
  "placeholder",
  "caret",
  "accent",
  "shadow",
];
const VAGUE_BUTTON_LABELS = new Set([
  "continue",
  "submit",
  "ok",
  "okay",
  "click here",
  "here",
  "yes",
  "no",
  "go",
  "done",
]);
const ELLIPSIS_EXCLUDED_TAG_NAMES = new Set(["code", "pre", "kbd", "samp", "var", "tt"]);
const PADDING_HORIZONTAL_AXIS_PATTERN = /(?:^|\s)(-?)px-(\d+(?:\.\d+)?|\[[^\]]+\])(?=$|[\s:])/g;
const PADDING_VERTICAL_AXIS_PATTERN = /(?:^|\s)(-?)py-(\d+(?:\.\d+)?|\[[^\]]+\])(?=$|[\s:])/g;
const SIZE_WIDTH_AXIS_PATTERN = /(?:^|\s)(-?)w-(\d+(?:\.\d+)?|\[[^\]]+\])(?=$|[\s:])/g;
const SIZE_HEIGHT_AXIS_PATTERN = /(?:^|\s)(-?)h-(\d+(?:\.\d+)?|\[[^\]]+\])(?=$|[\s:])/g;
const FLEX_OR_GRID_DISPLAY_TOKENS = new Set(["flex", "inline-flex", "grid", "inline-grid"]);
const SPACE_AXIS_PATTERN = /(?:^|\s)(?:-)?space-(x|y)-(\d+(?:\.\d+)?|\[[^\]]+\])(?=$|[\s:])/;
const TRAILING_THREE_PERIOD_ELLIPSIS_PATTERN = /[A-Za-z]\.\.\./;
//#endregion
//#region src/core/rules/lint/utils/is-setter-identifier.ts
const isSetterIdentifier = (name) => SETTER_PATTERN.test(name);
//#endregion
//#region src/core/rules/lint/utils/is-setter-call.ts
const isSetterCall = (node) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "Identifier") &&
  isSetterIdentifier(node.callee.name);
//#endregion
//#region src/core/rules/lint/utils/is-uppercase-name.ts
const isUppercaseName = (name) => UPPERCASE_PATTERN$1.test(name);
//#endregion
//#region src/core/rules/lint/utils/is-member-property.ts
const isMemberProperty = (node, propertyName) =>
  isNodeOfType(node, "MemberExpression") &&
  isNodeOfType(node.property, "Identifier") &&
  node.property.name === propertyName;
//#endregion
//#region src/core/rules/lint/utils/get-root-identifier-name.ts
const getRootIdentifierName$1 = (node, options) => {
  if (!node) return null;
  if (isNodeOfType(node, "Identifier")) return node.name;
  const followCallChains = options?.followCallChains === true;
  let cursor = node;
  while (cursor) {
    if (isNodeOfType(cursor, "MemberExpression")) {
      cursor = cursor.object;
      continue;
    }
    if (followCallChains && isNodeOfType(cursor, "CallExpression")) {
      const callee = cursor.callee;
      if (!isNodeOfType(callee, "MemberExpression")) return null;
      cursor = callee.object;
      continue;
    }
    break;
  }
  return isNodeOfType(cursor, "Identifier") ? cursor.name : null;
};
//#endregion
//#region src/core/rules/lint/utils/are-expressions-structurally-equal.ts
const areExpressionsStructurallyEqual = (a, b) => {
  if (!a || !b) return a === b;
  if (a.type !== b.type) return false;
  if (isNodeOfType(a, "Identifier")) return a.name === b.name;
  if (isNodeOfType(a, "Literal")) return a.value === b.value;
  if (isNodeOfType(a, "MemberExpression")) {
    if (a.computed !== b.computed) return false;
    return (
      areExpressionsStructurallyEqual(a.object, b.object) &&
      areExpressionsStructurallyEqual(a.property, b.property)
    );
  }
  if (isNodeOfType(a, "CallExpression")) {
    if (!areExpressionsStructurallyEqual(a.callee, b.callee)) return false;
    const argumentsA = a.arguments ?? [];
    const argumentsB = b.arguments ?? [];
    if (argumentsA.length !== argumentsB.length) return false;
    return argumentsA.every((argument, index) =>
      areExpressionsStructurallyEqual(argument, argumentsB[index]),
    );
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/utils/get-effect-callback.ts
const getEffectCallback = (node) => {
  if (!node.arguments?.length) return null;
  const callback = node.arguments[0];
  if (
    isNodeOfType(callback, "ArrowFunctionExpression") ||
    isNodeOfType(callback, "FunctionExpression")
  )
    return callback;
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/get-callback-statements.ts
const getCallbackStatements = (callback) => {
  if (isNodeOfType(callback.body, "BlockStatement")) return callback.body.body ?? [];
  return callback.body ? [callback.body] : [];
};
//#endregion
//#region src/core/rules/lint/utils/count-set-state-calls.ts
const countSetStateCalls = (node) => {
  let setStateCallCount = 0;
  walkAst(node, (child) => {
    if (isSetterCall(child)) setStateCallCount++;
  });
  return setStateCallCount;
};
//#endregion
//#region src/core/rules/lint/utils/is-simple-expression.ts
const isSimpleExpression = (node) => {
  if (!node) return false;
  switch (node.type) {
    case "Identifier":
    case "Literal":
    case "TemplateLiteral":
      return true;
    case "BinaryExpression":
      return isSimpleExpression(node.left) && isSimpleExpression(node.right);
    case "UnaryExpression":
      return isSimpleExpression(node.argument);
    case "MemberExpression":
      return !node.computed && isSimpleExpression(node.object);
    case "ConditionalExpression":
      return (
        isSimpleExpression(node.test) &&
        isSimpleExpression(node.consequent) &&
        isSimpleExpression(node.alternate)
      );
    default:
      return false;
  }
};
//#endregion
//#region src/core/rules/lint/utils/is-component-declaration.ts
const isComponentDeclaration = (node) =>
  isNodeOfType(node, "FunctionDeclaration") &&
  Boolean(node.id?.name) &&
  isUppercaseName(node.id.name);
//#endregion
//#region src/core/rules/lint/utils/is-component-assignment.ts
const isComponentAssignment = (node) =>
  isNodeOfType(node, "VariableDeclarator") &&
  isNodeOfType(node.id, "Identifier") &&
  isUppercaseName(node.id.name) &&
  Boolean(node.init) &&
  (isNodeOfType(node.init, "ArrowFunctionExpression") ||
    isNodeOfType(node.init, "FunctionExpression"));
//#endregion
//#region src/core/rules/lint/utils/get-callee-name.ts
const getCalleeName = (node) => {
  if (isNodeOfType(node.callee, "Identifier")) return node.callee.name;
  if (
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.property, "Identifier")
  )
    return node.callee.property.name;
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/is-hook-call.ts
const isHookCall = (node, hookName) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const calleeName = getCalleeName(node);
  if (!calleeName) return false;
  return typeof hookName === "string" ? calleeName === hookName : hookName.has(calleeName);
};
//#endregion
//#region src/core/rules/lint/utils/has-directive.ts
const hasDirective = (programNode, directive) =>
  Boolean(
    programNode.body?.some(
      (statement) =>
        isNodeOfType(statement, "ExpressionStatement") &&
        isNodeOfType(statement.expression, "Literal") &&
        statement.expression.value === directive,
    ),
  );
//#endregion
//#region src/core/rules/lint/utils/has-use-server-directive.ts
const hasUseServerDirective = (node) => {
  if (!isNodeOfType(node.body, "BlockStatement")) return false;
  return Boolean(
    node.body.body?.some(
      (statement) =>
        isNodeOfType(statement, "ExpressionStatement") && statement.directive === "use server",
    ),
  );
};
//#endregion
//#region src/core/rules/lint/utils/contains-fetch-call.ts
const containsFetchCall = (node) => {
  let didFindFetchCall = false;
  walkAst(node, (child) => {
    if (didFindFetchCall || !isNodeOfType(child, "CallExpression")) return;
    if (isNodeOfType(child.callee, "Identifier") && FETCH_CALLEE_NAMES.has(child.callee.name))
      didFindFetchCall = true;
    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      FETCH_MEMBER_OBJECTS.has(child.callee.object.name)
    )
      didFindFetchCall = true;
  });
  return didFindFetchCall;
};
//#endregion
//#region src/core/rules/lint/utils/find-jsx-attribute.ts
const findJsxAttribute = (attributes, attributeName) =>
  attributes?.find(
    (attribute) =>
      isNodeOfType(attribute, "JSXAttribute") &&
      isNodeOfType(attribute.name, "JSXIdentifier") &&
      attribute.name.name === attributeName,
  );
//#endregion
//#region src/core/rules/lint/utils/has-jsx-attribute.ts
const hasJsxAttribute = (attributes, attributeName) =>
  Boolean(findJsxAttribute(attributes, attributeName));
//#endregion
//#region src/core/rules/lint/utils/create-loop-aware-visitors.ts
const createLoopAwareVisitors = (innerVisitors) => {
  let loopDepth = 0;
  const incrementLoopDepth = () => {
    loopDepth++;
  };
  const decrementLoopDepth = () => {
    loopDepth--;
  };
  const visitors = {};
  for (const loopType of LOOP_TYPES) {
    visitors[loopType] = incrementLoopDepth;
    visitors[`${loopType}:exit`] = decrementLoopDepth;
  }
  for (const [nodeType, handler] of Object.entries(innerVisitors))
    visitors[nodeType] = (node) => {
      if (loopDepth > 0) handler(node);
    };
  return visitors;
};
//#endregion
//#region src/core/rules/lint/utils/is-cookies-or-headers-call.ts
const isCookiesOrHeadersCall = (node, methodName) => {
  if (!isNodeOfType(node, "CallExpression") || !isNodeOfType(node.callee, "MemberExpression"))
    return false;
  const { object, property } = node.callee;
  if (!isNodeOfType(property, "Identifier") || !MUTATION_METHOD_NAMES.has(property.name))
    return false;
  if (!isNodeOfType(object, "CallExpression") || !isNodeOfType(object.callee, "Identifier"))
    return false;
  return object.callee.name === methodName;
};
//#endregion
//#region src/core/rules/lint/utils/is-mutating-db-call.ts
const isMutatingDbCall = (node) => {
  if (!isNodeOfType(node, "CallExpression") || !isNodeOfType(node.callee, "MemberExpression"))
    return false;
  const { property } = node.callee;
  return isNodeOfType(property, "Identifier") && MUTATION_METHOD_NAMES.has(property.name);
};
//#endregion
//#region src/core/rules/lint/utils/is-mutating-method-property.ts
const isMutatingMethodProperty = (property) =>
  isNodeOfType(property, "Property") &&
  isNodeOfType(property.key, "Identifier") &&
  property.key.name === "method" &&
  isNodeOfType(property.value, "Literal") &&
  typeof property.value.value === "string" &&
  MUTATING_HTTP_METHODS.has(property.value.value.toUpperCase());
//#endregion
//#region src/core/rules/lint/utils/is-mutating-fetch-call.ts
const isMutatingFetchCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "fetch") return false;
  const optionsArgument = node.arguments?.[1];
  if (!isNodeOfType(optionsArgument, "ObjectExpression")) return false;
  return Boolean(optionsArgument.properties?.some(isMutatingMethodProperty));
};
//#endregion
//#region src/core/rules/lint/utils/find-side-effect.ts
const HEADER_BINDING_NAMES = new Set(["headers", "responseHeaders", "resHeaders"]);
const HEADER_MUTATION_METHOD_NAMES = new Set(["append", "delete", "set"]);
const isIdentifierNamed = (node, names) => isNodeOfType(node, "Identifier") && names.has(node.name);
const isOutboundHeadersMutationCall = (node) => {
  if (!isNodeOfType(node, "CallExpression") || !isNodeOfType(node.callee, "MemberExpression"))
    return false;
  const { object, property } = node.callee;
  if (!isIdentifierNamed(property, HEADER_MUTATION_METHOD_NAMES)) return false;
  if (isIdentifierNamed(object, HEADER_BINDING_NAMES)) return true;
  return (
    isNodeOfType(object, "MemberExpression") &&
    isIdentifierNamed(object.property, HEADER_BINDING_NAMES)
  );
};
const findSideEffect = (node) => {
  let sideEffectDescription = null;
  walkAst(node, (child) => {
    if (sideEffectDescription) return;
    if (isOutboundHeadersMutationCall(child)) return;
    if (isCookiesOrHeadersCall(child, "cookies"))
      sideEffectDescription = `cookies().${child.callee.property.name}()`;
    else if (isCookiesOrHeadersCall(child, "headers"))
      sideEffectDescription = `headers().${child.callee.property.name}()`;
    else if (isMutatingFetchCall(child))
      sideEffectDescription = `fetch() with method ${child.arguments[1].properties.find(isMutatingMethodProperty).value.value}`;
    else if (isMutatingDbCall(child)) {
      const methodName = child.callee.property.name;
      const objectName = isNodeOfType(child.callee.object, "Identifier")
        ? child.callee.object.name
        : null;
      sideEffectDescription = objectName ? `${objectName}.${methodName}()` : `.${methodName}()`;
    }
  });
  return sideEffectDescription;
};
//#endregion
//#region src/core/rules/lint/utils/collect-pattern-names.ts
const collectPatternNames = (pattern, into) => {
  if (!pattern) return;
  if (isNodeOfType(pattern, "Identifier")) {
    into.add(pattern.name);
    return;
  }
  if (isNodeOfType(pattern, "AssignmentPattern")) {
    collectPatternNames(pattern.left, into);
    return;
  }
  if (isNodeOfType(pattern, "RestElement")) {
    collectPatternNames(pattern.argument, into);
    return;
  }
  if (isNodeOfType(pattern, "ArrayPattern")) {
    for (const element of pattern.elements ?? []) collectPatternNames(element, into);
    return;
  }
  if (isNodeOfType(pattern, "ObjectPattern"))
    for (const property of pattern.properties ?? []) {
      if (isNodeOfType(property, "RestElement")) {
        collectPatternNames(property.argument, into);
        continue;
      }
      if (isNodeOfType(property, "Property")) collectPatternNames(property.value, into);
    }
};
//#endregion
//#region src/core/rules/lint/utils/extract-destructured-prop-names.ts
const extractDestructuredPropNames = (params) => {
  const propNames = /* @__PURE__ */ new Set();
  for (const param of params) collectPatternNames(param, propNames);
  return propNames;
};
//#endregion
//#region src/core/rules/lint/utils/is-function-like-variable-declarator.ts
const isFunctionLikeVariableDeclarator = (node) => {
  if (!isNodeOfType(node, "VariableDeclarator")) return false;
  return (
    isNodeOfType(node.init, "ArrowFunctionExpression") ||
    isNodeOfType(node.init, "FunctionExpression")
  );
};
//#endregion
//#region src/core/rules/lint/utils/create-component-prop-stack-tracker.ts
const createComponentPropStackTracker = (callbacks) => {
  const propParamStack = [];
  const isPropName = (name) => {
    for (let frameIndex = propParamStack.length - 1; frameIndex >= 0; frameIndex--) {
      const frame = propParamStack[frameIndex];
      if (frame.size === 0) return false;
      if (frame.has(name)) return true;
    }
    return false;
  };
  const getCurrentPropNames = () => {
    for (let frameIndex = propParamStack.length - 1; frameIndex >= 0; frameIndex--) {
      const frame = propParamStack[frameIndex];
      if (frame.size === 0) return /* @__PURE__ */ new Set();
      return frame;
    }
    return /* @__PURE__ */ new Set();
  };
  return {
    isPropName,
    getCurrentPropNames,
    visitors: {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) {
          propParamStack.push(/* @__PURE__ */ new Set());
          return;
        }
        propParamStack.push(extractDestructuredPropNames(node.params ?? []));
        callbacks?.onComponentEnter?.(node.body);
      },
      "FunctionDeclaration:exit"() {
        propParamStack.pop();
      },
      VariableDeclarator(node) {
        if (isComponentAssignment(node)) {
          propParamStack.push(extractDestructuredPropNames(node.init?.params ?? []));
          callbacks?.onComponentEnter?.(node.init?.body);
          return;
        }
        if (isFunctionLikeVariableDeclarator(node)) propParamStack.push(/* @__PURE__ */ new Set());
      },
      "VariableDeclarator:exit"(node) {
        if (isComponentAssignment(node) || isFunctionLikeVariableDeclarator(node))
          propParamStack.pop();
      },
    },
  };
};
//#endregion
//#region src/core/rules/lint/utils/create-component-binding-stack-tracker.ts
const createComponentBindingStackTracker = (callbacks) => {
  const componentBindingStack = [];
  const isInsideComponent = () => componentBindingStack.length > 0;
  const isBoundName = (name) => {
    for (let frameIndex = componentBindingStack.length - 1; frameIndex >= 0; frameIndex--)
      if (componentBindingStack[frameIndex].has(name)) return true;
    return false;
  };
  const addBindingToCurrentFrame = (name) => {
    if (componentBindingStack.length === 0) return;
    componentBindingStack[componentBindingStack.length - 1].add(name);
  };
  return {
    isInsideComponent,
    isBoundName,
    addBindingToCurrentFrame,
    visitors: {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        componentBindingStack.push(/* @__PURE__ */ new Set());
      },
      "FunctionDeclaration:exit"(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        componentBindingStack.pop();
      },
      VariableDeclarator(node) {
        if (isComponentAssignment(node)) {
          componentBindingStack.push(/* @__PURE__ */ new Set());
          return;
        }
        callbacks?.onVariableDeclarator?.(node);
      },
      "VariableDeclarator:exit"(node) {
        if (isComponentAssignment(node)) componentBindingStack.pop();
      },
    },
  };
};
//#endregion
//#region src/core/rules/lint/utils/get-import-source-value.ts
const getImportSourceValue = (node) => {
  if (!isNodeOfType(node, "ImportDeclaration")) return null;
  const value = node.source?.value;
  return typeof value === "string" ? value : null;
};
//#endregion
//#region src/core/rules/lint/utils/get-imported-name.ts
const getImportedName = (specifier) => {
  if (!isNodeOfType(specifier, "ImportSpecifier")) return null;
  if (isNodeOfType(specifier.imported, "Identifier")) return specifier.imported.name;
  if (isNodeOfType(specifier.imported, "Literal")) return String(specifier.imported.value);
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/get-local-name.ts
const getLocalName = (specifier) => {
  if (isNodeOfType(specifier.local, "Identifier")) return specifier.local.name;
  return getImportedName(specifier);
};
//#endregion
//#region src/core/rules/lint/utils/get-property-name.ts
const getPropertyName = (property) => {
  if (!isNodeOfType(property, "Property")) return null;
  if (isNodeOfType(property.key, "Identifier")) return property.key.name;
  if (isNodeOfType(property.key, "Literal")) return String(property.key.value);
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/get-object-property.ts
const getObjectProperty = (objectExpression, propertyName) => {
  if (!isNodeOfType(objectExpression, "ObjectExpression")) return null;
  for (const property of objectExpression.properties ?? [])
    if (getPropertyName(property) === propertyName) return property;
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/get-jsx-name.ts
const getJsxName$2 = (node) => {
  if (!node) return null;
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXMemberExpression")) {
    const objectName = getJsxName$2(node.object);
    const propertyName = getJsxName$2(node.property);
    return objectName && propertyName ? `${objectName}.${propertyName}` : propertyName;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/get-member-property-name.ts
const getMemberPropertyName = (node) => {
  if (!isNodeOfType(node, "MemberExpression")) return null;
  if (isNodeOfType(node.property, "Identifier")) return node.property.name;
  if (isNodeOfType(node.property, "Literal")) return String(node.property.value);
  return null;
};
//#endregion
//#region src/core/rules/lint/utils/is-identifier-call.ts
const isIdentifierCall = (node, names) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "Identifier") &&
  names.has(node.callee.name);
//#endregion
//#region src/core/rules/lint/react/utils/build-hook-binding-map.ts
const buildHookBindingMap = (componentBody) => {
  const result = /* @__PURE__ */ new Map();
  if (!isNodeOfType(componentBody, "BlockStatement")) return result;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      const callee = declarator.init.callee;
      if (!isNodeOfType(callee, "Identifier")) continue;
      result.set(declarator.id.name, callee.name);
    }
  }
  return result;
};
//#endregion
//#region src/core/rules/lint/react/utils/build-legacy-context-message.ts
const buildLegacyContextMessage = (memberName) => {
  if (memberName === "childContextTypes" || memberName === "getChildContext")
    return `${memberName} is part of the legacy context API (REMOVED in React 19). Replace the provider with \`createContext\` + \`<MyContext.Provider value={...}>\` and consume via \`useContext()\` (or \`use()\` on React 19+) - every consumer must migrate together`;
  return "contextTypes is part of the legacy context API (REMOVED in React 19). Replace with `static contextType = MyContext` (single context) or read the modern context with `useContext()` / `use()` from a function component - coordinate with the provider's migration";
};
//#endregion
//#region src/core/rules/lint/react/utils/strip-unsafe-prefix.ts
const stripUnsafePrefix = (name) => {
  if (name.startsWith("UNSAFE_"))
    return {
      baseName: name.slice(7),
      hasUnsafePrefix: true,
    };
  return {
    baseName: name,
    hasUnsafePrefix: false,
  };
};
//#endregion
//#region src/core/rules/lint/react/utils/build-legacy-lifecycle-message.ts
const buildLegacyLifecycleMessage = (originalName) => {
  const { baseName, hasUnsafePrefix } = stripUnsafePrefix(originalName);
  const replacement = LEGACY_LIFECYCLE_REPLACEMENTS.get(baseName);
  if (!replacement) return null;
  return `${hasUnsafePrefix ? `\`${originalName}\` is removed in React 19 (the UNSAFE_ prefix only silences the React 18 warning, it doesn't fix the concurrent-mode hazard).` : `\`${originalName}\` is removed in React 19 and warns in React 18.3.1.`} ${replacement}.`;
};
//#endregion
//#region src/core/rules/lint/react/utils/build-test-utils-message.ts
const buildTestUtilsMessage = (importedName) => {
  const replacement = REACT_DOM_TEST_UTILS_REPLACEMENTS.get(importedName);
  return `react-dom/test-utils is removed in React 19. ${replacement ? `Use ${replacement}.` : "Switch to `act` from `react` or the equivalent in `@testing-library/react`."}`;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-boolean-like-props-from-body.ts
const collectBooleanLikePropsFromBody = (componentBody, propsParamName) => {
  const found = /* @__PURE__ */ new Set();
  if (!componentBody) return found;
  walkAst(componentBody, (child) => {
    if (!isNodeOfType(child, "MemberExpression")) return;
    if (child.computed) return;
    if (!isNodeOfType(child.object, "Identifier")) return;
    if (child.object.name !== propsParamName) return;
    if (!isNodeOfType(child.property, "Identifier")) return;
    if (!BOOLEAN_PROP_PREFIX_PATTERN.test(child.property.name)) return;
    found.add(child.property.name);
  });
  return found;
};
//#endregion
//#region src/core/rules/lint/react/utils/create-deprecated-react-import-rule.ts
const createDeprecatedReactImportRule = ({
  source,
  recommendation,
  examples,
  messages,
  handleExtraSource,
}) => ({
  recommendation,
  examples,
  create: (context) => {
    const namespaceBindings = /* @__PURE__ */ new Set();
    return {
      ImportDeclaration(node) {
        const sourceValue = node.source?.value;
        if (typeof sourceValue !== "string") return;
        if (handleExtraSource?.(node, context)) return;
        if (sourceValue !== source) return;
        for (const specifier of node.specifiers ?? []) {
          if (isNodeOfType(specifier, "ImportSpecifier")) {
            const importedName = specifier.imported?.name;
            if (!importedName) continue;
            const message = messages.get(importedName);
            if (message)
              context.report({
                node: specifier,
                message,
              });
            continue;
          }
          if (
            isNodeOfType(specifier, "ImportDefaultSpecifier") ||
            isNodeOfType(specifier, "ImportNamespaceSpecifier")
          ) {
            const localName = specifier.local?.name;
            if (localName) namespaceBindings.add(localName);
          }
        }
      },
      MemberExpression(node) {
        if (namespaceBindings.size === 0) return;
        if (node.computed) return;
        if (!isNodeOfType(node.object, "Identifier")) return;
        if (!namespaceBindings.has(node.object.name)) return;
        if (!isNodeOfType(node.property, "Identifier")) return;
        const message = messages.get(node.property.name);
        if (message)
          context.report({
            node,
            message,
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/utils/is-inside-class-body.ts
const isInsideClassBody = (node) => {
  let current = node.parent;
  while (current) {
    if (isNodeOfType(current, "ClassBody")) return true;
    if (
      isNodeOfType(current, "FunctionDeclaration") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "ArrowFunctionExpression")
    )
      return false;
    current = current.parent;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/report-test-utils-imports.ts
const reportTestUtilsImports = (node, context) => {
  for (const specifier of node.specifiers ?? []) {
    if (isNodeOfType(specifier, "ImportSpecifier")) {
      const importedName = specifier.imported?.name ?? "default";
      context.report({
        node: specifier,
        message: buildTestUtilsMessage(importedName),
      });
      continue;
    }
    context.report({
      node: specifier,
      message:
        "react-dom/test-utils is removed in React 19. Use `act` from `react` and `fireEvent` / `render` from `@testing-library/react` instead",
    });
  }
};
//#endregion
//#region src/core/rules/lint/react/utils/deferrable-hook-names.ts
const DEFERRABLE_HOOK_NAMES = new Set(["useSearchParams", "useParams", "usePathname"]);
//#endregion
//#region src/core/rules/lint/react/utils/sentinel-identifier-names.ts
const SENTINEL_IDENTIFIER_NAMES = new Set(["undefined", "NaN", "null"]);
//#endregion
//#region src/core/rules/lint/react/utils/state-arithmetic-operators.ts
const STATE_ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/", "%", "**"]);
//#endregion
//#region src/core/rules/lint/react/utils/collect-identifier-names.ts
const collectIdentifierNames$1 = (expression) => {
  const names = /* @__PURE__ */ new Set();
  walkAst(expression, (child) => {
    if (isNodeOfType(child, "Identifier")) names.add(child.name);
  });
  return names;
};
//#endregion
//#region src/core/rules/lint/react/utils/build-local-dependency-graph.ts
const buildLocalDependencyGraph = (componentBody) => {
  const graph = /* @__PURE__ */ new Map();
  if (!isNodeOfType(componentBody, "BlockStatement")) return graph;
  const declaredNames = /* @__PURE__ */ new Set();
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!declarator.init) continue;
      const dependencyNames = collectIdentifierNames$1(declarator.init);
      declaredNames.clear();
      collectPatternNames(declarator.id, declaredNames);
      for (const declaredName of declaredNames) {
        const existing = graph.get(declaredName);
        if (existing === void 0) graph.set(declaredName, new Set(dependencyNames));
        else for (const dependencyName of dependencyNames) existing.add(dependencyName);
      }
    }
  }
  return graph;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-enclosing-function-inside-effect.ts
const findEnclosingFunctionInsideEffect = (identifierNode, effectCallback) => {
  let cursor = identifierNode.parent ?? null;
  while (cursor && cursor !== effectCallback) {
    if (
      isNodeOfType(cursor, "ArrowFunctionExpression") ||
      isNodeOfType(cursor, "FunctionExpression") ||
      isNodeOfType(cursor, "FunctionDeclaration")
    )
      return cursor;
    cursor = cursor.parent ?? null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/get-enclosing-function-binding-name.ts
const getEnclosingFunctionBindingName = (enclosingFunction) => {
  if (
    isNodeOfType(enclosingFunction, "FunctionDeclaration") &&
    isNodeOfType(enclosingFunction.id, "Identifier")
  )
    return enclosingFunction.id.name;
  const directParent = enclosingFunction.parent;
  if (
    isNodeOfType(directParent, "VariableDeclarator") &&
    isNodeOfType(directParent.id, "Identifier")
  )
    return directParent.id.name;
  if (
    isNodeOfType(directParent, "AssignmentExpression") &&
    directParent.right === enclosingFunction &&
    isNodeOfType(directParent.left, "Identifier")
  )
    return directParent.left.name;
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-call-expression-with-sub-handler-callee.ts
const isCallExpressionWithSubHandlerCallee = (callExpression) => {
  if (!isNodeOfType(callExpression, "CallExpression")) return false;
  const callee = callExpression.callee;
  if (
    isNodeOfType(callee, "Identifier") &&
    TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES.has(callee.name)
  )
    return true;
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.property, "Identifier") &&
    SUBSCRIPTION_METHOD_NAMES.has(callee.property.name)
  )
    return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-sub-handler-for-enclosing-function.ts
const findSubHandlerForEnclosingFunction = (enclosingFunction, effectCallback) => {
  const directParent = enclosingFunction.parent;
  if (
    isNodeOfType(directParent, "CallExpression") &&
    directParent.arguments?.includes(enclosingFunction) &&
    isCallExpressionWithSubHandlerCallee(directParent)
  )
    return directParent;
  const localName = getEnclosingFunctionBindingName(enclosingFunction);
  if (localName === null) return null;
  let matchingSubHandlerCall = null;
  walkAst(effectCallback, (child) => {
    if (matchingSubHandlerCall) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    if (!isCallExpressionWithSubHandlerCallee(child)) return;
    for (const argument of child.arguments ?? [])
      if (isNodeOfType(argument, "Identifier") && argument.name === localName) {
        matchingSubHandlerCall = child;
        return false;
      }
  });
  return matchingSubHandlerCall;
};
//#endregion
//#region src/core/rules/lint/react/utils/get-sub-handler-callee-name.ts
const getSubHandlerCalleeName = (callExpression) => {
  if (!isNodeOfType(callExpression, "CallExpression")) return null;
  const callee = callExpression.callee;
  if (isNodeOfType(callee, "Identifier")) return callee.name;
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier"))
    return callee.property.name;
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/classify-callable-reads-inside-effect.ts
const classifyCallableReadsInsideEffect = (callableName, effectCallback) => {
  let hasAnyRead = false;
  let allReadsAreInSubHandlers = true;
  let firstSubHandlerName = null;
  walkAst(effectCallback, (child) => {
    if (!isNodeOfType(child, "Identifier")) return;
    if (child.name !== callableName) return;
    const parent = child.parent;
    if (isNodeOfType(parent, "ArrayExpression")) return;
    if (isNodeOfType(parent, "MemberExpression") && !parent.computed && parent.property === child)
      return;
    if (
      isNodeOfType(parent, "Property") &&
      !parent.computed &&
      !parent.shorthand &&
      parent.key === child
    )
      return;
    hasAnyRead = true;
    const enclosingFunction = findEnclosingFunctionInsideEffect(child, effectCallback);
    if (!enclosingFunction) {
      allReadsAreInSubHandlers = false;
      return;
    }
    const subHandlerCall = findSubHandlerForEnclosingFunction(enclosingFunction, effectCallback);
    if (!subHandlerCall) {
      allReadsAreInSubHandlers = false;
      return;
    }
    if (firstSubHandlerName === null) firstSubHandlerName = getSubHandlerCalleeName(subHandlerCall);
  });
  return {
    hasAnyRead,
    allReadsAreInSubHandlers,
    firstSubHandlerName,
  };
};
//#endregion
//#region src/core/rules/lint/react/utils/is-release-like-call.ts
const isReleaseLikeCall = (callNode, knownBoundReleaseNames) => {
  if (!isNodeOfType(callNode, "CallExpression")) return false;
  const callee = callNode.callee;
  if (isNodeOfType(callee, "Identifier")) {
    if (TIMER_CLEANUP_CALLEE_NAMES.has(callee.name)) return true;
    if (CLEANUP_LIKE_RELEASE_CALLEE_NAMES.has(callee.name)) return true;
    if (knownBoundReleaseNames.has(callee.name)) return true;
    return false;
  }
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier"))
    return UNSUBSCRIPTION_METHOD_NAMES.has(callee.property.name);
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/contains-release-like-call.ts
const containsReleaseLikeCall = (node, knownBoundReleaseNames) => {
  let didFindRelease = false;
  walkAst(node, (child) => {
    if (didFindRelease) return false;
    if (isReleaseLikeCall(child, knownBoundReleaseNames)) {
      didFindRelease = true;
      return false;
    }
  });
  return didFindRelease;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-subscribe-like-call-expression.ts
const isSubscribeLikeCallExpression = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return SUBSCRIPTION_METHOD_NAMES.has(node.callee.property.name);
};
//#endregion
//#region src/core/rules/lint/react/utils/is-cleanup-return.ts
const isCleanupReturn = (returnedValue, knownBoundReleaseNames) => {
  if (!returnedValue) return false;
  if (isNodeOfType(returnedValue, "Identifier"))
    return knownBoundReleaseNames.has(returnedValue.name);
  if (isSubscribeLikeCallExpression(returnedValue)) return true;
  if (
    isNodeOfType(returnedValue, "ArrowFunctionExpression") ||
    isNodeOfType(returnedValue, "FunctionExpression")
  )
    return containsReleaseLikeCall(returnedValue, knownBoundReleaseNames);
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/cleanup-releases-subscription.ts
const cleanupReleasesSubscription = (effectBodyStatements, boundUnsubscribeName) => {
  const lastStatement = effectBodyStatements[effectBodyStatements.length - 1];
  if (!isNodeOfType(lastStatement, "ReturnStatement")) return false;
  const knownBoundReleaseNames = /* @__PURE__ */ new Set();
  if (boundUnsubscribeName) knownBoundReleaseNames.add(boundUnsubscribeName);
  return isCleanupReturn(lastStatement.argument, knownBoundReleaseNames);
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-dep-identifier-names.ts
const collectDepIdentifierNames = (effectNode) => {
  const depNames = /* @__PURE__ */ new Set();
  const depsNode = effectNode.arguments?.[1];
  if (!isNodeOfType(depsNode, "ArrayExpression")) return depNames;
  for (const element of depsNode.elements ?? [])
    if (isNodeOfType(element, "Identifier")) depNames.add(element.name);
  return depNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-function-local-bindings.ts
const collectFunctionLocalBindings = (functionNode) => {
  const localBindings = /* @__PURE__ */ new Set();
  for (const param of functionNode.params ?? []) collectPatternNames(param, localBindings);
  if (isNodeOfType(functionNode.body, "BlockStatement"))
    for (const statement of functionNode.body.body ?? []) {
      if (!isNodeOfType(statement, "VariableDeclaration")) continue;
      for (const declarator of statement.declarations ?? [])
        collectPatternNames(declarator.id, localBindings);
    }
  return localBindings;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-function-typed-local-bindings.ts
const collectFunctionTypedLocalBindings = (componentBody) => {
  const functionTypedLocals = /* @__PURE__ */ new Set();
  if (!isNodeOfType(componentBody, "BlockStatement")) return functionTypedLocals;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useCallback")) continue;
      functionTypedLocals.add(declarator.id.name);
    }
  }
  return functionTypedLocals;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-handler-binding-names.ts
const collectHandlerBindingNames = (componentBody) => {
  const handlerNames = /* @__PURE__ */ new Set();
  walkAst(componentBody, (child) => {
    if (!isNodeOfType(child, "JSXAttribute")) return;
    if (!isNodeOfType(child.name, "JSXIdentifier")) return;
    if (!/^on[A-Z]/.test(child.name.name)) return;
    if (!isNodeOfType(child.value, "JSXExpressionContainer")) return;
    const expression = child.value.expression;
    if (isNodeOfType(expression, "Identifier")) handlerNames.add(expression.name);
  });
  return handlerNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-inside-event-handler.ts
const isInsideEventHandler = (node, handlerBindingNames) => {
  let cursor = node.parent ?? null;
  while (cursor) {
    if (
      isNodeOfType(cursor, "ArrowFunctionExpression") ||
      isNodeOfType(cursor, "FunctionExpression") ||
      isNodeOfType(cursor, "FunctionDeclaration")
    ) {
      let outer = cursor.parent ?? null;
      while (outer) {
        if (isNodeOfType(outer, "JSXAttribute")) {
          const attrName = isNodeOfType(outer.name, "JSXIdentifier") ? outer.name.name : null;
          if (attrName && /^on[A-Z]/.test(attrName)) return true;
          return false;
        }
        if (isNodeOfType(outer, "VariableDeclarator")) {
          const declaredName = isNodeOfType(outer.id, "Identifier") ? outer.id.name : null;
          return Boolean(declaredName && handlerBindingNames.has(declaredName));
        }
        if (isNodeOfType(outer, "Program")) return false;
        outer = outer.parent ?? null;
      }
      return false;
    }
    cursor = cursor.parent ?? null;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-handler-only-write-state-names.ts
const collectHandlerOnlyWriteStateNames = (
  componentBody,
  useStateBindings,
  handlerBindingNames,
) => {
  const handlerOnlyWriteStateNames = /* @__PURE__ */ new Set();
  for (const binding of useStateBindings) {
    let didFindAnySetterCall = false;
    let areAllSetterCallsInHandlers = true;
    walkAst(componentBody, (child) => {
      if (!areAllSetterCallsInHandlers) return false;
      if (!isNodeOfType(child, "CallExpression")) return;
      if (!isNodeOfType(child.callee, "Identifier")) return;
      if (child.callee.name !== binding.setterName) return;
      didFindAnySetterCall = true;
      if (!isInsideEventHandler(child, handlerBindingNames)) areAllSetterCallsInHandlers = false;
    });
    if (didFindAnySetterCall && areAllSetterCallsInHandlers)
      handlerOnlyWriteStateNames.add(binding.valueName);
  }
  return handlerOnlyWriteStateNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-releasable-binding-names.ts
const collectReleasableBindingNames = (effectCallback) => {
  const releasableNames = /* @__PURE__ */ new Set();
  if (!isNodeOfType(effectCallback.body, "BlockStatement")) return releasableNames;
  for (const statement of effectCallback.body.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      const init = declarator.init;
      if (!init || !isNodeOfType(init, "CallExpression")) continue;
      if (isSubscribeLikeCallExpression(init)) {
        releasableNames.add(declarator.id.name);
        continue;
      }
      if (
        isNodeOfType(init.callee, "Identifier") &&
        TIMER_CALLEE_NAMES_REQUIRING_CLEANUP.has(init.callee.name)
      )
        releasableNames.add(declarator.id.name);
    }
  }
  return releasableNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-render-reachable-names.ts
const collectRenderReachableNames = (returnExpressions) => {
  const names = /* @__PURE__ */ new Set();
  for (const expression of returnExpressions)
    walkAst(expression, (child) => {
      if (isNodeOfType(child, "Identifier")) names.add(child.name);
    });
  return names;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-return-expressions.ts
const collectReturnExpressions = (componentBody) => {
  if (!isNodeOfType(componentBody, "BlockStatement")) return [];
  const returns = [];
  for (const statement of componentBody.body ?? []) {
    if (isNodeOfType(statement, "ReturnStatement") && statement.argument) {
      returns.push(statement.argument);
      continue;
    }
    walkInsideStatementBlocks(statement, (child) => {
      if (isNodeOfType(child, "ReturnStatement") && child.argument) returns.push(child.argument);
    });
  }
  return returns;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-use-ref-binding-names.ts
const collectUseRefBindingNames = (componentBody) => {
  const useRefBindings = /* @__PURE__ */ new Set();
  if (!isNodeOfType(componentBody, "BlockStatement")) return useRefBindings;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useRef")) continue;
      useRefBindings.add(declarator.id.name);
    }
  }
  return useRefBindings;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-use-state-bindings.ts
const collectUseStateBindings = (componentBody) => {
  const bindings = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return bindings;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
      const elements = declarator.id.elements ?? [];
      if (elements.length < 2) continue;
      const valueElement = elements[0];
      const setterElement = elements[1];
      if (
        !isNodeOfType(valueElement, "Identifier") ||
        !isNodeOfType(setterElement, "Identifier") ||
        !isSetterIdentifier(setterElement.name)
      )
        continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useState")) continue;
      bindings.push({
        valueName: valueElement.name,
        setterName: setterElement.name,
        declarator,
      });
    }
  }
  return bindings;
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-value-identifier-names.ts
const collectValueIdentifierNames = (node, into) => {
  if (!node || typeof node !== "object") return;
  if (isNodeOfType(node, "CallExpression")) {
    if (isNodeOfType(node.callee, "MemberExpression")) {
      const rootName = getRootIdentifierName$1(node.callee);
      if (!rootName || !BUILTIN_GLOBAL_NAMESPACE_NAMES.has(rootName))
        collectValueIdentifierNames(node.callee.object, into);
    }
    for (const argument of node.arguments ?? []) collectValueIdentifierNames(argument, into);
    return;
  }
  if (isNodeOfType(node, "MemberExpression")) {
    const rootName = getRootIdentifierName$1(node);
    if (!rootName || !BUILTIN_GLOBAL_NAMESPACE_NAMES.has(rootName))
      collectValueIdentifierNames(node.object, into);
    if (node.computed) collectValueIdentifierNames(node.property, into);
    return;
  }
  if (isNodeOfType(node, "Identifier")) {
    into.push(node.name);
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "type") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child)
        if (item && typeof item === "object" && item.type) collectValueIdentifierNames(item, into);
    } else if (child && typeof child === "object" && child.type)
      collectValueIdentifierNames(child, into);
  }
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-written-state-names-in-effect.ts
const collectWrittenStateNamesInEffect = (effectCallback, setterToStateName) => {
  const writtenStateNames = /* @__PURE__ */ new Set();
  walkInsideStatementBlocks(effectCallback.body, (child) => {
    if (!isNodeOfType(child, "CallExpression")) return;
    if (!isNodeOfType(child.callee, "Identifier")) return;
    const stateName = setterToStateName.get(child.callee.name);
    if (stateName) writtenStateNames.add(stateName);
  });
  return writtenStateNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/derive-state-variable-name.ts
const deriveStateVariableName = (setterName) => {
  if (!setterName.startsWith("set") || setterName.length < 4) return null;
  return setterName.charAt(3).toLowerCase() + setterName.slice(4);
};
//#endregion
//#region src/core/rules/lint/react/utils/effect-has-cleanup-release.ts
const effectHasCleanupRelease = (callback) => {
  if (!isNodeOfType(callback.body, "BlockStatement"))
    return isSubscribeLikeCallExpression(callback.body);
  const knownBoundReleaseNames = collectReleasableBindingNames(callback);
  let didFindCleanupReturn = false;
  walkInsideStatementBlocks(callback.body, (child) => {
    if (didFindCleanupReturn) return;
    if (!isNodeOfType(child, "ReturnStatement")) return;
    if (isCleanupReturn(child.argument, knownBoundReleaseNames)) didFindCleanupReturn = true;
  });
  return didFindCleanupReturn;
};
//#endregion
//#region src/core/rules/lint/react/utils/expand-transitive-dependencies.ts
const expandTransitiveDependencies = (seedNames, dependencyGraph) => {
  const reachable = new Set(seedNames);
  const queue = Array.from(seedNames);
  while (queue.length > 0) {
    const currentName = queue.pop();
    if (currentName === void 0) continue;
    const dependencyNames = dependencyGraph.get(currentName);
    if (!dependencyNames) continue;
    for (const dependencyName of dependencyNames) {
      if (reachable.has(dependencyName)) continue;
      reachable.add(dependencyName);
      queue.push(dependencyName);
    }
  }
  return reachable;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-hook-call-bindings.ts
const findHookCallBindings = (componentBody) => {
  const bindings = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return bindings;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      const callee = declarator.init.callee;
      if (!isNodeOfType(callee, "Identifier")) continue;
      if (!DEFERRABLE_HOOK_NAMES.has(callee.name)) continue;
      bindings.push({
        valueName: declarator.id.name,
        hookName: callee.name,
        declarator,
      });
    }
  }
  return bindings;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-mutable-dep-issue.ts
const findMutableDepIssue = (depElement, useRefBindingNames) => {
  if (!isNodeOfType(depElement, "MemberExpression")) return null;
  if (
    isNodeOfType(depElement.property, "Identifier") &&
    depElement.property.name === "current" &&
    !depElement.computed &&
    isNodeOfType(depElement.object, "Identifier") &&
    useRefBindingNames.has(depElement.object.name)
  )
    return {
      kind: "ref-current",
      rootName: depElement.object.name,
    };
  const rootName = getRootIdentifierName$1(depElement);
  if (rootName !== null && MUTABLE_GLOBAL_ROOTS.has(rootName))
    return {
      kind: "global",
      rootName,
    };
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-subscribe-like-usages.ts
const findSubscribeLikeUsages = (callback) => {
  const usages = [];
  let cleanupArgument = null;
  if (isNodeOfType(callback.body, "BlockStatement")) {
    const callbackStatements = callback.body.body ?? [];
    const lastCallbackStatement = callbackStatements[callbackStatements.length - 1];
    if (isNodeOfType(lastCallbackStatement, "ReturnStatement") && lastCallbackStatement.argument)
      cleanupArgument = lastCallbackStatement.argument;
  }
  walkAst(callback, (child) => {
    if (child === cleanupArgument) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    if (
      isNodeOfType(child.callee, "Identifier") &&
      TIMER_CALLEE_NAMES_REQUIRING_CLEANUP.has(child.callee.name)
    ) {
      usages.push({
        kind: "timer",
        resourceName: child.callee.name,
      });
      return;
    }
    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.property, "Identifier") &&
      SUBSCRIPTION_METHOD_NAMES.has(child.callee.property.name)
    )
      usages.push({
        kind: "subscribe",
        resourceName: child.callee.property.name,
      });
  });
  return usages;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-subscription-call.ts
const findSubscriptionCall = (effectBodyStatements) => {
  for (const statement of effectBodyStatements) {
    if (isNodeOfType(statement, "VariableDeclaration"))
      for (const declarator of statement.declarations ?? []) {
        const init = declarator.init;
        if (!isNodeOfType(init, "CallExpression")) continue;
        if (!isNodeOfType(init.callee, "MemberExpression")) continue;
        if (!isNodeOfType(init.callee.property, "Identifier")) continue;
        if (!SUBSCRIPTION_METHOD_NAMES.has(init.callee.property.name)) continue;
        return {
          call: init,
          boundUnsubscribeName: isNodeOfType(declarator.id, "Identifier")
            ? declarator.id.name
            : null,
        };
      }
    if (isNodeOfType(statement, "ExpressionStatement")) {
      const expression = statement.expression;
      if (!isNodeOfType(expression, "CallExpression")) continue;
      if (!isNodeOfType(expression.callee, "MemberExpression")) continue;
      if (!isNodeOfType(expression.callee.property, "Identifier")) continue;
      if (!SUBSCRIPTION_METHOD_NAMES.has(expression.callee.property.name)) continue;
      return {
        call: expression,
        boundUnsubscribeName: null,
      };
    }
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-top-level-effect-calls.ts
const findTopLevelEffectCalls = (componentBody) => {
  const effectCalls = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return effectCalls;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "ExpressionStatement")) continue;
    const expression = statement.expression;
    if (!isNodeOfType(expression, "CallExpression")) continue;
    if (!isHookCall(expression, EFFECT_HOOK_NAMES)) continue;
    effectCalls.push(expression);
  }
  return effectCalls;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-triggered-side-effect-callee-name.ts
const findTriggeredSideEffectCalleeName = (consequentNode) => {
  let foundCalleeName = null;
  walkAst(consequentNode, (child) => {
    if (foundCalleeName) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    const callee = child.callee;
    if (
      isNodeOfType(callee, "Identifier") &&
      EVENT_TRIGGERED_SIDE_EFFECT_CALLEES.has(callee.name)
    ) {
      foundCalleeName = callee.name;
      return;
    }
    if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
      const propertyName = callee.property.name;
      const isUnambiguousMethod = EVENT_TRIGGERED_SIDE_EFFECT_MEMBER_METHODS.has(propertyName);
      const isNavigationMethod = EVENT_TRIGGERED_NAVIGATION_METHOD_NAMES.has(propertyName);
      if (!isUnambiguousMethod && !isNavigationMethod) return;
      const rootName = getRootIdentifierName$1(callee);
      if (isNavigationMethod && (rootName === null || !NAVIGATION_RECEIVER_NAMES.has(rootName)))
        return;
      foundCalleeName = rootName ? `${rootName}.${propertyName}` : propertyName;
    }
  });
  return foundCalleeName;
};
//#endregion
//#region src/core/rules/lint/react/utils/find-use-effects-in-component.ts
const findUseEffectsInComponent = (componentBody) => {
  const effectCalls = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return effectCalls;
  for (const statement of componentBody.body ?? [])
    walkAst(statement, (child) => {
      if (isNodeOfType(child, "CallExpression") && isHookCall(child, EFFECT_HOOK_NAMES))
        effectCalls.push(child);
    });
  return effectCalls;
};
//#endregion
//#region src/core/rules/lint/react/utils/get-prop-root-name.ts
const getPropRootName = (expression, propNames) => {
  const rootName = getRootIdentifierName$1(expression, { followCallChains: true });
  return rootName !== null && propNames.has(rootName) ? rootName : null;
};
//#endregion
//#region src/core/rules/lint/react/utils/get-single-setter-call-from-handler.ts
const getSingleSetterCallFromHandler = (handler) => {
  const handlerStatements = getCallbackStatements(handler);
  if (handlerStatements.length !== 1) return null;
  const onlyStatement = handlerStatements[0];
  const expression = isNodeOfType(onlyStatement, "ExpressionStatement")
    ? onlyStatement.expression
    : onlyStatement;
  if (!isNodeOfType(expression, "CallExpression")) return null;
  if (!isNodeOfType(expression.callee, "Identifier")) return null;
  if (!isSetterIdentifier(expression.callee.name)) return null;
  if (!expression.arguments?.length) return null;
  return {
    setterName: expression.callee.name,
    setterArgument: expression.arguments[0],
  };
};
//#endregion
//#region src/core/rules/lint/react/utils/get-subscription-handler-argument.ts
const getSubscriptionHandlerArgument = (subscribeCall, effectBodyStatements) => {
  for (const argument of subscribeCall.arguments ?? []) {
    if (
      isNodeOfType(argument, "ArrowFunctionExpression") ||
      isNodeOfType(argument, "FunctionExpression")
    )
      return argument;
    if (isNodeOfType(argument, "Identifier"))
      for (const statement of effectBodyStatements) {
        if (!isNodeOfType(statement, "VariableDeclaration")) continue;
        for (const declarator of statement.declarations ?? []) {
          if (!isNodeOfType(declarator.id, "Identifier")) continue;
          if (declarator.id.name !== argument.name) continue;
          const init = declarator.init;
          if (
            isNodeOfType(init, "ArrowFunctionExpression") ||
            isNodeOfType(init, "FunctionExpression")
          )
            return init;
        }
      }
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-sentinel-identifier.ts
const isSentinelIdentifier = (node) =>
  isNodeOfType(node, "Identifier") && SENTINEL_IDENTIFIER_NAMES.has(node.name);
//#endregion
//#region src/core/rules/lint/react/utils/get-trigger-guard-root-name.ts
const getTriggerGuardRootName = (testNode) => {
  if (!testNode) return null;
  if (isNodeOfType(testNode, "Identifier")) return testNode.name;
  if (isNodeOfType(testNode, "BinaryExpression")) {
    if (!["!==", "===", "!=", "=="].includes(testNode.operator)) return null;
    for (const side of [testNode.left, testNode.right])
      if (isNodeOfType(side, "Identifier") && !isSentinelIdentifier(side)) return side.name;
    return null;
  }
  if (
    isNodeOfType(testNode, "MemberExpression") &&
    isNodeOfType(testNode.property, "Identifier") &&
    testNode.property.name === "length"
  ) {
    if (isNodeOfType(testNode.object, "Identifier")) return testNode.object.name;
  }
  if (isNodeOfType(testNode, "UnaryExpression") && testNode.operator === "!")
    return getTriggerGuardRootName(testNode.argument);
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-function-shaped-return.ts
const isFunctionShapedReturn = (returnedValue) => {
  if (
    isNodeOfType(returnedValue, "ArrowFunctionExpression") ||
    isNodeOfType(returnedValue, "FunctionExpression")
  )
    return true;
  if (isNodeOfType(returnedValue, "CallExpression")) return true;
  if (isNodeOfType(returnedValue, "Identifier")) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-external-sync-effect.ts
const isExternalSyncEffect = (effectCallback) => {
  if (isNodeOfType(effectCallback.body, "BlockStatement")) {
    const statements = effectCallback.body.body ?? [];
    for (const statement of statements)
      if (
        isNodeOfType(statement, "ReturnStatement") &&
        statement.argument &&
        isFunctionShapedReturn(statement.argument)
      )
        return true;
  }
  let didFindExternalCall = false;
  walkAst(effectCallback, (child) => {
    if (didFindExternalCall) return false;
    if (isNodeOfType(child, "NewExpression")) {
      const constructor = child.callee;
      if (
        isNodeOfType(constructor, "Identifier") &&
        EXTERNAL_SYNC_OBSERVER_CONSTRUCTORS.has(constructor.name)
      )
        didFindExternalCall = true;
      return;
    }
    if (isNodeOfType(child, "AssignmentExpression")) {
      if (
        isNodeOfType(child.left, "MemberExpression") &&
        isNodeOfType(child.left.property, "Identifier") &&
        child.left.property.name === "current"
      )
        didFindExternalCall = true;
      return;
    }
    if (!isNodeOfType(child, "CallExpression")) return;
    if (
      isNodeOfType(child.callee, "Identifier") &&
      EXTERNAL_SYNC_DIRECT_CALLEE_NAMES.has(child.callee.name)
    ) {
      didFindExternalCall = true;
      return;
    }
    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.property, "Identifier")
    ) {
      const propertyName = child.callee.property.name;
      if (EXTERNAL_SYNC_MEMBER_METHOD_NAMES.has(propertyName)) {
        didFindExternalCall = true;
        return;
      }
      if (EXTERNAL_SYNC_AMBIGUOUS_HTTP_METHOD_NAMES.has(propertyName)) {
        const receiverRootName = getRootIdentifierName$1(child.callee.object);
        if (receiverRootName !== null && EXTERNAL_SYNC_HTTP_CLIENT_RECEIVERS.has(receiverRootName))
          didFindExternalCall = true;
      }
    }
  });
  return didFindExternalCall;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-function-like-node.ts
const isFunctionLikeNode = (node) =>
  isNodeOfType(node, "FunctionDeclaration") ||
  isNodeOfType(node, "FunctionExpression") ||
  isNodeOfType(node, "ArrowFunctionExpression");
//#endregion
//#region src/core/rules/lint/react/utils/is-unconditional-setter-call-statement.ts
const isUnconditionalSetterCallStatement = (statement, setterNames) => {
  if (!isNodeOfType(statement, "ExpressionStatement")) return null;
  const expression = statement.expression;
  if (!isNodeOfType(expression, "CallExpression")) return null;
  const callee = expression.callee;
  if (!isNodeOfType(callee, "Identifier")) return null;
  if (!setterNames.has(callee.name)) return null;
  return expression;
};
//#endregion
//#region src/core/rules/lint/react/utils/walk-component-respecting-shadows.ts
const walkComponentRespectingShadows = (node, shadowedStateNames, visit) => {
  if (!node || typeof node !== "object") return;
  let nextShadowedStateNames = shadowedStateNames;
  if (isFunctionLikeNode(node)) {
    const localBindings = collectFunctionLocalBindings(node);
    if (localBindings.size > 0) {
      const merged = new Set(shadowedStateNames);
      for (const localName of localBindings) merged.add(localName);
      nextShadowedStateNames = merged;
    }
  }
  visit(node, shadowedStateNames);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child)
        if (item && typeof item === "object" && item.type)
          walkComponentRespectingShadows(item, nextShadowedStateNames, visit);
    } else if (child && typeof child === "object" && child.type)
      walkComponentRespectingShadows(child, nextShadowedStateNames, visit);
  }
};
//#endregion
//#region src/core/rules/lint/react/utils/numeric-name-hints.ts
const NUMERIC_NAME_HINTS = ["count", "length", "total", "size", "num"];
//#endregion
//#region src/core/rules/lint/react/utils/prevent-default-elements.ts
const PREVENT_DEFAULT_ELEMENTS = new Map([
  ["form", ["onSubmit"]],
  ["a", ["onClick"]],
]);
//#endregion
//#region src/core/rules/lint/react/utils/string-coercion-functions.ts
const STRING_COERCION_FUNCTIONS = new Set(["String", "Number"]);
//#endregion
//#region src/core/rules/lint/react/utils/svg-path-attributes.ts
const SVG_PATH_ATTRIBUTES = new Set(["d", "points", "transform"]);
//#endregion
//#region src/core/rules/lint/react/utils/svg-path-high-precision-pattern.ts
const SVG_PATH_HIGH_PRECISION_PATTERN = /\d+\.\d{4,}/;
//#endregion
//#region src/core/rules/lint/react/utils/uncontrolled-input-tags.ts
const UNCONTROLLED_INPUT_TAGS = new Set(["input", "textarea", "select"]);
//#endregion
//#region src/core/rules/lint/react/utils/value-bypass-input-types.ts
const VALUE_BYPASS_INPUT_TYPES = new Set(["hidden", "checkbox", "radio"]);
//#endregion
//#region src/core/rules/lint/react/utils/value-partner-attributes.ts
const VALUE_PARTNER_ATTRIBUTES = ["onChange", "onInput", "readOnly"];
//#endregion
//#region src/core/rules/lint/react/utils/build-prevent-default-message.ts
const buildPreventDefaultMessage = (elementName) => {
  if (elementName === "form")
    return "preventDefault() on <form> onSubmit - form won't work without JavaScript. Consider using the native action attribute for progressive enhancement";
  return "preventDefault() on <a> onClick - use a <button> or routing component instead";
};
//#endregion
//#region src/core/rules/lint/react/utils/is-use-state-undefined-initializer.ts
const isUseStateUndefinedInitializer = (init) => {
  if (!init || !isNodeOfType(init, "CallExpression")) return false;
  if (!isHookCall(init, "useState")) return false;
  const callArguments = init.arguments ?? [];
  if (callArguments.length === 0) return true;
  const firstArgument = callArguments[0];
  return isNodeOfType(firstArgument, "Identifier") && firstArgument.name === "undefined";
};
//#endregion
//#region src/core/rules/lint/react/utils/collect-undefined-initial-state-names.ts
const collectUndefinedInitialStateNames = (componentBody) => {
  const stateNames = /* @__PURE__ */ new Set();
  if (!isNodeOfType(componentBody, "BlockStatement")) return stateNames;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
      const valueElement = declarator.id.elements?.[0];
      if (!isNodeOfType(valueElement, "Identifier")) continue;
      if (!isUseStateUndefinedInitializer(declarator.init)) continue;
      stateNames.add(valueElement.name);
    }
  }
  return stateNames;
};
//#endregion
//#region src/core/rules/lint/react/utils/contains-prevent-default-call.ts
const containsPreventDefaultCall = (node) => {
  let didFindPreventDefault = false;
  walkAst(node, (child) => {
    if (didFindPreventDefault) return;
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.property, "Identifier") &&
      child.callee.property.name === "preventDefault"
    )
      didFindPreventDefault = true;
  });
  return didFindPreventDefault;
};
//#endregion
//#region src/core/rules/lint/react/utils/extract-index-name.ts
const extractIndexName = (node) => {
  if (isNodeOfType(node, "Identifier") && INDEX_PARAMETER_NAMES.has(node.name)) return node.name;
  if (isNodeOfType(node, "TemplateLiteral")) {
    const indexExpression = node.expressions?.find(
      (expression) =>
        isNodeOfType(expression, "Identifier") && INDEX_PARAMETER_NAMES.has(expression.name),
    );
    if (indexExpression) return indexExpression.name;
  }
  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.object, "Identifier") &&
    INDEX_PARAMETER_NAMES.has(node.callee.object.name) &&
    isNodeOfType(node.callee.property, "Identifier") &&
    node.callee.property.name === "toString"
  )
    return node.callee.object.name;
  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "Identifier") &&
    STRING_COERCION_FUNCTIONS.has(node.callee.name) &&
    isNodeOfType(node.arguments?.[0], "Identifier") &&
    INDEX_PARAMETER_NAMES.has(node.arguments[0].name)
  )
    return node.arguments[0].name;
  if (
    isNodeOfType(node, "BinaryExpression") &&
    node.operator === "+" &&
    ((isNodeOfType(node.left, "Identifier") &&
      INDEX_PARAMETER_NAMES.has(node.left.name) &&
      isNodeOfType(node.right, "Literal") &&
      node.right.value === "") ||
      (isNodeOfType(node.right, "Identifier") &&
        INDEX_PARAMETER_NAMES.has(node.right.name) &&
        isNodeOfType(node.left, "Literal") &&
        node.left.value === ""))
  )
    return isNodeOfType(node.left, "Identifier") ? node.left.name : node.right.name;
  return null;
};
//#endregion
//#region src/core/rules/lint/react/utils/get-input-type-literal.ts
const getInputTypeLiteral = (attributes) => {
  const typeAttribute = findJsxAttribute(attributes, "type");
  if (!typeAttribute || !isNodeOfType(typeAttribute.value, "Literal")) return null;
  const value = typeAttribute.value.value;
  return typeof value === "string" ? value : null;
};
//#endregion
//#region src/core/rules/lint/react/utils/has-jsx-spread-attribute.ts
const hasJsxSpreadAttribute = (attributes) =>
  attributes.some((attribute) => isNodeOfType(attribute, "JSXSpreadAttribute"));
//#endregion
//#region src/core/rules/lint/react/utils/is-inside-static-placeholder-map.ts
const isInsideStaticPlaceholderMap = (node) => {
  let current = node;
  while (current.parent) {
    current = current.parent;
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "MemberExpression") &&
      current.callee.property?.name === "map"
    ) {
      const receiver = current.callee.object;
      if (isNodeOfType(receiver, "CallExpression")) {
        const callee = receiver.callee;
        if (
          isNodeOfType(callee, "MemberExpression") &&
          isNodeOfType(callee.object, "Identifier") &&
          callee.object.name === "Array" &&
          callee.property?.name === "from"
        )
          return true;
      }
      if (
        isNodeOfType(receiver, "NewExpression") &&
        isNodeOfType(receiver.callee, "Identifier") &&
        receiver.callee.name === "Array"
      )
        return true;
    }
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/react/utils/is-numeric-name.ts
const isNumericName = (name) => {
  for (const hint of NUMERIC_NAME_HINTS) {
    if (name === hint) return true;
    const camelSuffix = hint.charAt(0).toUpperCase() + hint.slice(1);
    if (name.endsWith(camelSuffix)) return true;
    if (name.endsWith(`_${hint}`)) return true;
    if (name.endsWith(`_${hint.toUpperCase()}`)) return true;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/react/advanced-event-handler-refs.ts
const advancedEventHandlerRefs = defineRule({
  recommendation:
    "Store event handlers in refs or useEffectEvent when subscriptions need the latest callback without tearing down and re-adding listeners.",
  examples: [
    {
      before: `useEffect(() => window.addEventListener("resize", onResize), [onResize]);`,
      after: `const onResizeRef = useRef(onResize);
useEffect(() => window.addEventListener("resize", () => onResizeRef.current()), []);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      if ((node.arguments?.length ?? 0) < 2) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const depsNode = node.arguments[1];
      if (!isNodeOfType(depsNode, "ArrayExpression") || !depsNode.elements?.length) return;
      const depIdentifierNames = /* @__PURE__ */ new Set();
      for (const element of depsNode.elements)
        if (isNodeOfType(element, "Identifier")) depIdentifierNames.add(element.name);
      if (depIdentifierNames.size === 0) return;
      let registeredHandlerName = null;
      walkAst(callback.body, (child) => {
        if (registeredHandlerName) return;
        if (!isNodeOfType(child, "CallExpression")) return;
        if (!isNodeOfType(child.callee, "MemberExpression")) return;
        if (!isNodeOfType(child.callee.property, "Identifier")) return;
        if (!SUBSCRIPTION_METHOD_NAMES.has(child.callee.property.name)) return;
        const handlerArg = child.arguments?.[1];
        if (!isNodeOfType(handlerArg, "Identifier")) return;
        if (depIdentifierNames.has(handlerArg.name)) registeredHandlerName = handlerArg.name;
      });
      if (registeredHandlerName)
        context.report({
          node,
          message: `useEffect re-subscribes a "${registeredHandlerName}" listener every time the handler identity changes - store the handler in a ref and have the listener read \`handlerRef.current()\`, then drop it from the deps`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/utils/continuous-value-hook-pattern.ts
const CONTINUOUS_VALUE_HOOK_PATTERN =
  /^use(?:Window(?:Width|Height|Dimensions)|Scroll(?:Position|Y|X)|MousePosition|ResizeObserver|IntersectionObserver)/;
//#endregion
//#region src/core/rules/lint/performance/utils/high-frequency-dom-events.ts
const HIGH_FREQUENCY_DOM_EVENTS = new Set([
  "scroll",
  "mousemove",
  "wheel",
  "pointermove",
  "touchmove",
  "drag",
]);
//#endregion
//#region src/core/rules/lint/performance/utils/nondeterministic-render-patterns.ts
const NONDETERMINISTIC_RENDER_PATTERNS = [
  {
    display: "new Date()",
    matches: (node) =>
      isNodeOfType(node, "NewExpression") &&
      isNodeOfType(node.callee, "Identifier") &&
      node.callee.name === "Date",
  },
  {
    display: "Date.now()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "Date" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "now",
  },
  {
    display: "Math.random()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "Math" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "random",
  },
  {
    display: "performance.now()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "performance" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "now",
  },
  {
    display: "crypto.randomUUID()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "crypto" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "randomUUID",
  },
];
//#endregion
//#region src/core/rules/lint/performance/utils/callback-returns-jsx.ts
const callbackReturnsJsx = (callback) => {
  if (!callback) return false;
  if (
    !isNodeOfType(callback, "ArrowFunctionExpression") &&
    !isNodeOfType(callback, "FunctionExpression")
  )
    return false;
  const body = callback.body;
  if (isNodeOfType(body, "JSXElement") || isNodeOfType(body, "JSXFragment")) return true;
  if (!isNodeOfType(body, "BlockStatement")) return false;
  for (const stmt of body.body ?? [])
    if (
      isNodeOfType(stmt, "ReturnStatement") &&
      (isNodeOfType(stmt.argument, "JSXElement") || isNodeOfType(stmt.argument, "JSXFragment"))
    )
      return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/collect-identifier-names.ts
const collectIdentifierNames = (node, into) => {
  if (!node) return;
  walkAst(node, (child) => {
    if (isNodeOfType(child, "Identifier")) into.add(child.name);
  });
};
//#endregion
//#region src/core/rules/lint/performance/utils/contains-early-return.ts
const containsEarlyReturn = (ifStatement) => {
  const consequent = ifStatement.consequent;
  if (!consequent) return false;
  if (isNodeOfType(consequent, "ReturnStatement")) return true;
  if (!isNodeOfType(consequent, "BlockStatement")) return false;
  for (const stmt of consequent.body ?? []) if (isNodeOfType(stmt, "ReturnStatement")) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/find-opening-element-of-child.ts
const findOpeningElementOfChild = (jsxNode) => {
  let cursor = jsxNode.parent ?? null;
  while (cursor) {
    if (isNodeOfType(cursor, "JSXElement")) return cursor.openingElement;
    if (isNodeOfType(cursor, "JSXFragment")) return null;
    cursor = cursor.parent ?? null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-threshold-comparison.ts
const isThresholdComparison = (node, valueName) => {
  if (!isNodeOfType(node, "BinaryExpression")) return false;
  if (!["<", "<=", ">", ">=", "===", "!==", "==", "!="].includes(node.operator)) return false;
  if (
    !(
      (isNodeOfType(node.left, "Identifier") && node.left.name === valueName) ||
      (isNodeOfType(node.right, "Identifier") && node.right.name === valueName)
    )
  )
    return false;
  return isNodeOfType(node.left, "Literal") || isNodeOfType(node.right, "Literal");
};
//#endregion
//#region src/core/rules/lint/performance/utils/find-threshold-derived-bindings.ts
const findThresholdDerivedBindings = (componentBody) => {
  const out = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return out;
  const statements = componentBody.body ?? [];
  for (let outerIndex = 0; outerIndex < statements.length; outerIndex++) {
    const outerStatement = statements[outerIndex];
    if (!isNodeOfType(outerStatement, "VariableDeclaration")) continue;
    for (const declarator of outerStatement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      const init = declarator.init;
      if (!isNodeOfType(init, "CallExpression")) continue;
      if (!isNodeOfType(init.callee, "Identifier")) continue;
      if (!CONTINUOUS_VALUE_HOOK_PATTERN.test(init.callee.name)) continue;
      const continuousName = declarator.id.name;
      const hookName = init.callee.name;
      for (let innerIndex = outerIndex + 1; innerIndex < statements.length; innerIndex++) {
        const innerStatement = statements[innerIndex];
        if (!isNodeOfType(innerStatement, "VariableDeclaration")) break;
        let foundThreshold = false;
        for (const innerDecl of innerStatement.declarations ?? [])
          if (innerDecl.init && isThresholdComparison(innerDecl.init, continuousName)) {
            foundThreshold = true;
            break;
          }
        if (foundThreshold) {
          out.push({
            continuousName,
            hookName,
            declarator,
          });
          break;
        }
      }
    }
  }
  return out;
};
//#endregion
//#region src/core/rules/lint/performance/utils/handler-calls-set-state.ts
const handlerCallsSetState = (handler) => {
  if (
    !isNodeOfType(handler, "ArrowFunctionExpression") &&
    !isNodeOfType(handler, "FunctionExpression")
  )
    return null;
  let setStateCall = null;
  walkAst(handler.body, (child) => {
    if (setStateCall) return;
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "Identifier") &&
      /^set[A-Z]/.test(child.callee.name)
    )
      setStateCall = child;
  });
  return setStateCall;
};
//#endregion
//#region src/core/rules/lint/performance/utils/has-suppress-hydration-warning-attribute.ts
const hasSuppressHydrationWarningAttribute = (openingElement) => {
  if (!openingElement) return false;
  for (const attribute of openingElement.attributes ?? [])
    if (
      isNodeOfType(attribute, "JSXAttribute") &&
      isNodeOfType(attribute.name, "JSXIdentifier") &&
      attribute.name.name === "suppressHydrationWarning"
    )
      return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-add-event-listener-call.ts
const isAddEventListenerCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  if (node.callee.property.name !== "addEventListener") return false;
  return true;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-early-return-if-statement.ts
const isEarlyReturnIfStatement = (statement) => {
  if (!isNodeOfType(statement, "IfStatement")) return false;
  const consequent = statement.consequent;
  if (!consequent) return false;
  if (isNodeOfType(consequent, "ReturnStatement")) return true;
  if (!isNodeOfType(consequent, "BlockStatement")) return false;
  for (const inner of consequent.body ?? [])
    if (isNodeOfType(inner, "ReturnStatement")) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-inline-reference.ts
const isInlineReference = (node) => {
  if (
    isNodeOfType(node, "ArrowFunctionExpression") ||
    isNodeOfType(node, "FunctionExpression") ||
    (isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      node.callee.property?.name === "bind")
  )
    return "functions";
  if (isNodeOfType(node, "ObjectExpression")) return "objects";
  if (isNodeOfType(node, "ArrayExpression")) return "Arrays";
  if (isNodeOfType(node, "JSXElement") || isNodeOfType(node, "JSXFragment")) return "JSX";
  return null;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-memo-call.ts
const isMemoCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "memo") return true;
  if (
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.object, "Identifier") &&
    node.callee.object.name === "React" &&
    isNodeOfType(node.callee.property, "Identifier") &&
    node.callee.property.name === "memo"
  )
    return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-motion-element.ts
const isMotionElement = (attributeNode) => {
  const openingElement = attributeNode.parent;
  if (!openingElement || !isNodeOfType(openingElement, "JSXOpeningElement")) return false;
  const elementName = openingElement.name;
  if (
    isNodeOfType(elementName, "JSXMemberExpression") &&
    isNodeOfType(elementName.object, "JSXIdentifier") &&
    (elementName.object.name === "motion" || elementName.object.name === "m")
  )
    return true;
  if (isNodeOfType(elementName, "JSXIdentifier") && elementName.name.startsWith("Motion"))
    return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-trivially-cheap-expression.ts
const isTriviallyCheapExpression = (node) => {
  if (!node) return false;
  if (!isSimpleExpression(node)) return false;
  if (isNodeOfType(node, "Identifier")) return false;
  if (isNodeOfType(node, "MemberExpression")) return false;
  return true;
};
//#endregion
//#region src/core/rules/lint/performance/utils/jsx-references-local-scope.ts
const jsxReferencesLocalScope = (jsxNode) => {
  let referencesScope = false;
  walkAst(jsxNode, (child) => {
    if (referencesScope) return;
    if (
      isNodeOfType(child, "JSXExpressionContainer") &&
      !isNodeOfType(child.expression, "JSXEmptyExpression")
    )
      referencesScope = true;
    if (isNodeOfType(child, "JSXSpreadAttribute")) referencesScope = true;
  });
  return referencesScope;
};
//#endregion
//#region src/core/rules/lint/performance/utils/intl-classes.ts
const INTL_CLASSES = new Set([
  "NumberFormat",
  "DateTimeFormat",
  "Collator",
  "RelativeTimeFormat",
  "ListFormat",
  "PluralRules",
  "Segmenter",
  "DisplayNames",
]);
//#endregion
//#region src/core/rules/lint/performance/utils/iteration-method-names-with-callback.ts
const ITERATION_METHOD_NAMES_WITH_CALLBACK = new Set([
  "forEach",
  "map",
  "filter",
  "reduce",
  "reduceRight",
  "find",
  "findIndex",
  "some",
  "every",
  "flatMap",
]);
//#endregion
//#region src/core/rules/lint/performance/utils/promise-concurrency-methods.ts
const PROMISE_CONCURRENCY_METHODS = new Set(["all", "allSettled", "race", "any"]);
//#endregion
//#region src/core/rules/lint/performance/utils/build-member-access-key.ts
const buildMemberAccessKey = (node) => {
  if (isNodeOfType(node, "Identifier")) return node.name;
  if (isNodeOfType(node, "ThisExpression")) return "this";
  if (!isNodeOfType(node, "MemberExpression") || node.computed) return null;
  const objectKey = buildMemberAccessKey(node.object);
  if (!objectKey) return null;
  if (!isNodeOfType(node.property, "Identifier")) return null;
  return `${objectKey}.${node.property.name}`;
};
//#endregion
//#region src/core/rules/lint/performance/utils/find-first-await-outside-nested-functions.ts
const findFirstAwaitOutsideNestedFunctions = (block) => {
  let firstAwait = null;
  walkAst(block, (child) => {
    if (firstAwait) return false;
    if (
      child !== block &&
      (isNodeOfType(child, "FunctionDeclaration") ||
        isNodeOfType(child, "FunctionExpression") ||
        isNodeOfType(child, "ArrowFunctionExpression"))
    )
      return false;
    if (isNodeOfType(child, "AwaitExpression")) firstAwait = child;
  });
  return firstAwait;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-functionish-expression.ts
const isFunctionishExpression = (node) =>
  isNodeOfType(node, "ArrowFunctionExpression") || isNodeOfType(node, "FunctionExpression");
//#endregion
//#region src/core/rules/lint/performance/utils/is-intl-new-expression.ts
const isIntlNewExpression = (node) => {
  if (!isNodeOfType(node, "NewExpression")) return false;
  const callee = node.callee;
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.object, "Identifier") &&
    callee.object.name === "Intl" &&
    isNodeOfType(callee.property, "Identifier") &&
    INTL_CLASSES.has(callee.property.name)
  )
    return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/performance/utils/is-wrapped-in-promise-concurrency.ts
const isWrappedInPromiseConcurrency = (mapCall) => {
  const parent = mapCall.parent;
  if (!isNodeOfType(parent, "CallExpression")) return false;
  if (parent.arguments?.[0] !== mapCall) return false;
  const callee = parent.callee;
  if (!isNodeOfType(callee, "MemberExpression") || callee.computed) return false;
  if (!isNodeOfType(callee.object, "Identifier") || callee.object.name !== "Promise") return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  return PROMISE_CONCURRENCY_METHODS.has(callee.property.name);
};
//#endregion
//#region src/core/rules/lint/performance/utils/report-if-independent.ts
const reportIfIndependent = (statements, context) => {
  const declaredNames = /* @__PURE__ */ new Set();
  for (const statement of statements) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    const declarator = statement.declarations[0];
    const awaitArgument = declarator.init?.argument;
    let referencesEarlierResult = false;
    walkAst(awaitArgument, (child) => {
      if (isNodeOfType(child, "Identifier") && declaredNames.has(child.name))
        referencesEarlierResult = true;
    });
    if (referencesEarlierResult) return;
    if (isNodeOfType(declarator.id, "Identifier")) declaredNames.add(declarator.id.name);
  }
  context.report({
    node: statements[0],
    message: `${statements.length} sequential await statements that appear independent - use Promise.all() for parallel execution`,
  });
};
//#endregion
//#region src/core/rules/lint/performance/utils/versioned-key-pattern.ts
const VERSIONED_KEY_PATTERN = /(?:[._:-]v\d+|@\d+|\bv\d+\b)/i;
//#endregion
//#region src/core/rules/lint/performance/utils/is-json-stringify-call.ts
const isJsonStringifyCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "Identifier")) return false;
  if (node.callee.object.name !== "JSON") return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return node.callee.property.name === "stringify";
};
//#endregion
//#region src/core/rules/lint/performance/async-await-in-loop.ts
const SLEEP_LIKE_FUNCTION_NAMES = new Set([
  "sleep",
  "delay",
  "wait",
  "setTimeout",
  "pause",
  "throttle",
]);
const isNestedFunction = (node) =>
  isFunctionishExpression(node) || isNodeOfType(node, "FunctionDeclaration");
const isAwaitingSleepLikeCall = (awaitNode) => {
  const argument = awaitNode.argument;
  if (!isNodeOfType(argument, "CallExpression")) return false;
  if (
    isNodeOfType(argument.callee, "Identifier") &&
    SLEEP_LIKE_FUNCTION_NAMES.has(argument.callee.name)
  )
    return true;
  return (
    isNodeOfType(argument.callee, "MemberExpression") &&
    isNodeOfType(argument.callee.property, "Identifier") &&
    SLEEP_LIKE_FUNCTION_NAMES.has(argument.callee.property.name)
  );
};
const collectPatternIdentifierNames = (pattern, identifierNames) => {
  if (!pattern) return;
  if (isNodeOfType(pattern, "Identifier")) {
    identifierNames.add(pattern.name);
    return;
  }
  if (isNodeOfType(pattern, "ObjectPattern")) {
    for (const property of pattern.properties ?? [])
      if (isNodeOfType(property, "Property"))
        collectPatternIdentifierNames(property.value, identifierNames);
      else if (isNodeOfType(property, "RestElement"))
        collectPatternIdentifierNames(property.argument, identifierNames);
    return;
  }
  if (isNodeOfType(pattern, "ArrayPattern")) {
    for (const element of pattern.elements ?? [])
      collectPatternIdentifierNames(element, identifierNames);
    return;
  }
  if (isNodeOfType(pattern, "AssignmentPattern"))
    collectPatternIdentifierNames(pattern.left, identifierNames);
};
const collectAssignedIdentifierNames = (node) => {
  const assignedIdentifierNames = /* @__PURE__ */ new Set();
  walkAst(node, (child) => {
    if (isNestedFunction(child)) return false;
    if (isNodeOfType(child, "AssignmentExpression"))
      collectPatternIdentifierNames(child.left, assignedIdentifierNames);
    if (isNodeOfType(child, "VariableDeclarator") && isNodeOfType(child.init, "AwaitExpression"))
      collectPatternIdentifierNames(child.id, assignedIdentifierNames);
  });
  return assignedIdentifierNames;
};
const collectAwaitedArgumentIdentifierNames = (node) => {
  const awaitedArgumentIdentifierNames = /* @__PURE__ */ new Set();
  walkAst(node, (child) => {
    if (isNestedFunction(child)) return false;
    if (!isNodeOfType(child, "AwaitExpression") || !child.argument) return;
    walkAst(child.argument, (innerChild) => {
      if (isNodeOfType(innerChild, "Identifier"))
        awaitedArgumentIdentifierNames.add(innerChild.name);
      if (
        isNodeOfType(innerChild, "MemberExpression") &&
        isNodeOfType(innerChild.object, "Identifier")
      )
        awaitedArgumentIdentifierNames.add(innerChild.object.name);
    });
  });
  return awaitedArgumentIdentifierNames;
};
const hasLoopCarriedDependency = (node) => {
  const assignedIdentifierNames = collectAssignedIdentifierNames(node);
  if (assignedIdentifierNames.size === 0) return false;
  const awaitedArgumentIdentifierNames = collectAwaitedArgumentIdentifierNames(node);
  for (const identifierName of assignedIdentifierNames)
    if (awaitedArgumentIdentifierNames.has(identifierName)) return true;
  return false;
};
const loopBodyHasOnlySleepLikeAwaits = (node) => {
  let hasAwait = false;
  let allAwaitsAreSleepLike = true;
  walkAst(node, (child) => {
    if (isNestedFunction(child)) return false;
    if (!isNodeOfType(child, "AwaitExpression")) return;
    hasAwait = true;
    if (!isAwaitingSleepLikeCall(child)) allAwaitsAreSleepLike = false;
  });
  return hasAwait && allAwaitsAreSleepLike;
};
const asyncAwaitInLoop = defineRule({
  recommendation:
    "Start independent async operations before the loop or collect promises and await Promise.all when iterations do not depend on each other.",
  examples: [
    {
      before: `for (const id of ids) { results.push(await load(id)); }`,
      after: `const results = await Promise.all(ids.map(load));`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    const inspectLoopBody = (loopBody, label) => {
      if (isTestOrInfraFile) return;
      if (!loopBody) return;
      if (loopBodyHasOnlySleepLikeAwaits(loopBody)) return;
      if (hasLoopCarriedDependency(loopBody)) return;
      const firstAwait = findFirstAwaitOutsideNestedFunctions(loopBody);
      if (firstAwait)
        context.report({
          node: firstAwait,
          message: `await inside a ${label} runs the calls sequentially - for independent operations, collect them and use \`await Promise.all(items.map(...))\` to run them concurrently`,
        });
    };
    return {
      ForStatement(node) {
        inspectLoopBody(node.body, "for-loop");
      },
      ForInStatement(node) {
        inspectLoopBody(node.body, "for…in loop");
      },
      ForOfStatement(node) {
        if (node.await) return;
        inspectLoopBody(node.body, "for…of loop");
      },
      WhileStatement(node) {
        inspectLoopBody(node.body, "while-loop");
      },
      DoWhileStatement(node) {
        inspectLoopBody(node.body, "do-while loop");
      },
      CallExpression(node) {
        if (isTestOrInfraFile) return;
        if (!isNodeOfType(node.callee, "MemberExpression")) return;
        if (!isNodeOfType(node.callee.property, "Identifier")) return;
        const methodName = node.callee.property.name;
        if (!ITERATION_METHOD_NAMES_WITH_CALLBACK.has(methodName)) return;
        const callback = node.arguments?.[0];
        if (!callback || !isFunctionishExpression(callback)) return;
        if (!callback.async) return;
        const body = callback.body;
        if (!body) return;
        if (
          (methodName === "map" || methodName === "flatMap") &&
          isWrappedInPromiseConcurrency(node)
        )
          return;
        if (loopBodyHasOnlySleepLikeAwaits(body)) return;
        if (hasLoopCarriedDependency(body)) return;
        const firstAwait = findFirstAwaitOutsideNestedFunctions(body);
        if (firstAwait) {
          const message =
            methodName === "forEach"
              ? "Async callback in .forEach - return values are dropped, so awaits don't actually wait. Use a `for…of` loop or `await Promise.all(items.map(async (item) => {...}))`"
              : `Async callback in .${methodName} - sequential awaits inside the callback waterfall. Use \`await Promise.all(items.map(async (item) => {...}))\` to run them concurrently`;
          context.report({
            node: firstAwait,
            message,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/async-defer-await.ts
const asyncDeferAwait = defineRule({
  recommendation:
    "Move awaits into the branch that needs the result so other branches can return without waiting.",
  examples: [
    {
      before: `const data = await loadData();
if (!enabled) return null;`,
      after: `if (!enabled) return null;
const data = await loadData();`,
    },
  ],
  create: (context) => {
    const inspectStatements = (statements) => {
      for (let statementIndex = 0; statementIndex < statements.length - 1; statementIndex++) {
        const currentStatement = statements[statementIndex];
        if (!isNodeOfType(currentStatement, "VariableDeclaration")) continue;
        const awaitedBindingNames = /* @__PURE__ */ new Set();
        let didAwait = false;
        for (const declarator of currentStatement.declarations ?? [])
          if (isNodeOfType(declarator.init, "AwaitExpression")) {
            didAwait = true;
            if (isNodeOfType(declarator.id, "Identifier"))
              awaitedBindingNames.add(declarator.id.name);
            else if (isNodeOfType(declarator.id, "ObjectPattern")) {
              for (const property of declarator.id.properties ?? [])
                if (
                  isNodeOfType(property, "Property") &&
                  isNodeOfType(property.value, "Identifier")
                )
                  awaitedBindingNames.add(property.value.name);
            }
          }
        if (!didAwait) continue;
        const nextStatement = statements[statementIndex + 1];
        if (!isEarlyReturnIfStatement(nextStatement)) continue;
        const testIdentifiers = /* @__PURE__ */ new Set();
        collectIdentifierNames(nextStatement.test, testIdentifiers);
        if ([...awaitedBindingNames].some((name) => testIdentifiers.has(name))) continue;
        const consequentIdentifiers = /* @__PURE__ */ new Set();
        collectIdentifierNames(nextStatement.consequent, consequentIdentifiers);
        if ([...awaitedBindingNames].some((name) => consequentIdentifiers.has(name))) continue;
        context.report({
          node: currentStatement,
          message:
            "await blocks the function before an early-return that doesn't use the awaited value - move the await after the synchronous guard so the skip path stays fast",
        });
      }
    };
    const enterFunction = (node) => {
      if (!node.async) return;
      if (!isNodeOfType(node.body, "BlockStatement")) return;
      inspectStatements(node.body.body ?? []);
    };
    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/async-parallel.ts
const asyncParallel = defineRule({
  recommendation:
    "Run independent async operations in parallel with Promise.all instead of awaiting them one after another.",
  examples: [
    {
      before: `const user = await getUser();
const teams = await getTeams();`,
      after: `const [user, teams] = await Promise.all([getUser(), getTeams()]);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    return {
      BlockStatement(node) {
        if (isTestOrInfraFile) return;
        const consecutiveAwaitStatements = [];
        const flushConsecutiveAwaits = () => {
          if (consecutiveAwaitStatements.length >= 3)
            reportIfIndependent(consecutiveAwaitStatements, context);
          consecutiveAwaitStatements.length = 0;
        };
        for (const statement of node.body ?? [])
          if (
            (isNodeOfType(statement, "VariableDeclaration") &&
              statement.declarations?.length === 1 &&
              isNodeOfType(statement.declarations[0].init, "AwaitExpression")) ||
            (isNodeOfType(statement, "ExpressionStatement") &&
              isNodeOfType(statement.expression, "AwaitExpression"))
          )
            consecutiveAwaitStatements.push(statement);
          else flushConsecutiveAwaits();
        flushConsecutiveAwaits();
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/client-localstorage-no-version.ts
const clientLocalstorageNoVersion = defineRule({
  recommendation:
    "Version localStorage keys or stored schemas and keep payloads minimal so future releases can migrate safely.",
  examples: [
    {
      before: `localStorage.setItem("settings", JSON.stringify(settings));`,
      after: `localStorage.setItem("settings:v2", JSON.stringify({ version: 2, settings }));`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.object, "Identifier")) return;
      if (!STORAGE_OBJECTS.has(node.callee.object.name)) return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (node.callee.property.name !== "setItem") return;
      const keyArg = node.arguments?.[0];
      if (!keyArg) return;
      if (!isNodeOfType(keyArg, "Literal")) return;
      if (typeof keyArg.value !== "string") return;
      if (VERSIONED_KEY_PATTERN.test(keyArg.value)) return;
      const valueArg = node.arguments?.[1];
      if (!valueArg) return;
      if (!isJsonStringifyCall(valueArg)) return;
      context.report({
        node: keyArg,
        message: `${node.callee.object.name}.setItem("${keyArg.value}", JSON.stringify(...)) - bake a version into the key (e.g. "${keyArg.value}:v1") so a future schema change can ignore old data instead of crashing on it`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/client-passive-event-listeners.ts
const clientPassiveEventListeners = defineRule({
  recommendation:
    "Add passive: true to touch and wheel listeners that do not call preventDefault so scrolling can start immediately.",
  examples: [
    {
      before: `window.addEventListener("wheel", onWheel);`,
      after: `window.addEventListener("wheel", onWheel, { passive: true });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isMemberProperty(node.callee, "addEventListener")) return;
      if ((node.arguments?.length ?? 0) < 2) return;
      const eventNameNode = node.arguments[0];
      if (!isNodeOfType(eventNameNode, "Literal") || !PASSIVE_EVENT_NAMES.has(eventNameNode.value))
        return;
      const eventName = eventNameNode.value;
      const optionsArgument = node.arguments[2];
      if (!optionsArgument) {
        context.report({
          node,
          message: `"${eventName}" listener without { passive: true } - blocks scrolling performance. Only add { passive: true } if the handler does NOT call event.preventDefault() (passive listeners silently ignore preventDefault())`,
        });
        return;
      }
      if (!isNodeOfType(optionsArgument, "ObjectExpression")) return;
      if (
        !optionsArgument.properties?.some(
          (property) =>
            isNodeOfType(property, "Property") &&
            isNodeOfType(property.key, "Identifier") &&
            property.key.name === "passive" &&
            isNodeOfType(property.value, "Literal") &&
            property.value.value === true,
        )
      )
        context.report({
          node,
          message: `"${eventName}" listener without { passive: true } - blocks scrolling performance. Only add { passive: true } if the handler does NOT call event.preventDefault() (passive listeners silently ignore preventDefault())`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/utils/border-side-keys.ts
const BORDER_SIDE_KEYS = new Map([
  ["borderLeft", "left"],
  ["borderRight", "right"],
  ["borderInlineStart", "left"],
  ["borderInlineEnd", "right"],
]);
//#endregion
//#region src/core/rules/lint/design/utils/border-side-width-keys.ts
const BORDER_SIDE_WIDTH_KEYS = new Set([
  "borderLeftWidth",
  "borderRightWidth",
  "borderInlineStartWidth",
  "borderInlineEndWidth",
]);
//#endregion
//#region src/core/rules/lint/design/utils/extract-border-color-from-shorthand.ts
const extractBorderColorFromShorthand = (shorthandValue) => {
  const afterSolid = shorthandValue.match(/solid\s+(.+)$/i);
  if (!afterSolid) return null;
  return afterSolid[1].trim();
};
//#endregion
//#region src/core/rules/lint/design/utils/parse-color-to-rgb.ts
const parseColorToRgb = (value) => {
  const trimmed = value.trim().toLowerCase();
  const hex8Match = trimmed.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})[0-9a-f]{2}$/);
  if (hex8Match)
    return {
      red: parseInt(hex8Match[1], 16),
      green: parseInt(hex8Match[2], 16),
      blue: parseInt(hex8Match[3], 16),
    };
  const hex6Match = trimmed.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (hex6Match)
    return {
      red: parseInt(hex6Match[1], 16),
      green: parseInt(hex6Match[2], 16),
      blue: parseInt(hex6Match[3], 16),
    };
  const hex4Match = trimmed.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])[0-9a-f]$/);
  if (hex4Match)
    return {
      red: parseInt(hex4Match[1] + hex4Match[1], 16),
      green: parseInt(hex4Match[2] + hex4Match[2], 16),
      blue: parseInt(hex4Match[3] + hex4Match[3], 16),
    };
  const hex3Match = trimmed.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (hex3Match)
    return {
      red: parseInt(hex3Match[1] + hex3Match[1], 16),
      green: parseInt(hex3Match[2] + hex3Match[2], 16),
      blue: parseInt(hex3Match[3] + hex3Match[3], 16),
    };
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch)
    return {
      red: parseInt(rgbMatch[1], 10),
      green: parseInt(rgbMatch[2], 10),
      blue: parseInt(rgbMatch[3], 10),
    };
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/extract-color-from-shadow-layer.ts
const extractColorFromShadowLayer = (layer) => {
  const rgbMatch = layer.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch)
    return {
      red: parseInt(rgbMatch[1], 10),
      green: parseInt(rgbMatch[2], 10),
      blue: parseInt(rgbMatch[3], 10),
    };
  const hexMatch = layer.match(/#([0-9a-f]{3,6})\b/i);
  if (hexMatch) return parseColorToRgb(`#${hexMatch[1]}`);
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-inline-style-expression.ts
const getInlineStyleExpression = (node) => {
  if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return null;
  if (!isNodeOfType(node.value, "JSXExpressionContainer")) return null;
  const expression = node.value.expression;
  if (!isNodeOfType(expression, "ObjectExpression")) return null;
  return expression;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-string-from-class-name-attr.ts
const getStringFromClassNameAttr = (node) => {
  const classAttr = findJsxAttribute(node.attributes ?? [], "className");
  if (!classAttr?.value) return null;
  if (isNodeOfType(classAttr.value, "Literal") && typeof classAttr.value.value === "string")
    return classAttr.value.value;
  if (
    isNodeOfType(classAttr.value, "JSXExpressionContainer") &&
    isNodeOfType(classAttr.value.expression, "Literal") &&
    typeof classAttr.value.expression.value === "string"
  )
    return classAttr.value.expression.value;
  if (
    isNodeOfType(classAttr.value, "JSXExpressionContainer") &&
    isNodeOfType(classAttr.value.expression, "TemplateLiteral") &&
    classAttr.value.expression.quasis?.length === 1
  )
    return classAttr.value.expression.quasis[0].value?.raw ?? null;
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-style-property-key.ts
const getStylePropertyKey = (property) => {
  if (!isNodeOfType(property, "Property")) return null;
  if (isNodeOfType(property.key, "Identifier")) return property.key.name;
  if (isNodeOfType(property.key, "Literal") && typeof property.key.value === "string")
    return property.key.value;
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-style-property-number-value.ts
const getStylePropertyNumberValue = (property) => {
  if (isNodeOfType(property.value, "Literal") && typeof property.value.value === "number")
    return property.value.value;
  if (
    isNodeOfType(property.value, "UnaryExpression") &&
    property.value.operator === "-" &&
    isNodeOfType(property.value.argument, "Literal") &&
    typeof property.value.argument.value === "number"
  )
    return -property.value.argument.value;
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-style-property-string-value.ts
const getStylePropertyStringValue = (property) => {
  if (isNodeOfType(property.value, "Literal") && typeof property.value.value === "string")
    return property.value.value;
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/has-bounce-animation-name.ts
const hasBounceAnimationName = (value) => {
  const lowerValue = value.toLowerCase();
  for (const name of BOUNCE_ANIMATION_NAMES) if (lowerValue.includes(name)) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/has-color-chroma.ts
const hasColorChroma = (parsed) =>
  Math.max(parsed.red, parsed.green, parsed.blue) -
    Math.min(parsed.red, parsed.green, parsed.blue) >=
  30;
//#endregion
//#region src/core/rules/lint/design/utils/parse-shadow-layer-blur.ts
const parseShadowLayerBlur = (layer) => {
  const numericTokens = [
    ...layer
      .replace(/rgba?\([^)]*\)/g, "")
      .replace(/#[0-9a-f]{3,8}\b/gi, "")
      .matchAll(/(\d+(?:\.\d+)?)(px)?/g),
  ].map((match) => parseFloat(match[1]));
  return numericTokens.length >= 3 ? numericTokens[2] : 0;
};
//#endregion
//#region src/core/rules/lint/design/utils/split-shadow-layers.ts
const splitShadowLayers = (shadowValue) => shadowValue.split(/,(?![^(]*\))/);
//#endregion
//#region src/core/rules/lint/design/utils/has-colored-glow-shadow.ts
const hasColoredGlowShadow = (shadowValue) => {
  for (const layer of splitShadowLayers(shadowValue)) {
    const color = extractColorFromShadowLayer(layer);
    if (color && hasColorChroma(color) && parseShadowLayerBlur(layer) > 4) return true;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/is-pure-black-color.ts
const isPureBlackColor = (value) => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "#000" || trimmed === "#000000") return true;
  if (/^rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(trimmed)) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/is-background-dark.ts
const isBackgroundDark = (bgValue) => {
  const trimmed = bgValue.trim().toLowerCase();
  if (isPureBlackColor(trimmed)) return true;
  const parsed = parseColorToRgb(trimmed);
  if (!parsed) return false;
  return parsed.red <= 35 && parsed.green <= 35 && parsed.blue <= 35;
};
//#endregion
//#region src/core/rules/lint/design/utils/is-neutral-border-color.ts
const isNeutralBorderColor = (value) => {
  const trimmed = value.trim().toLowerCase();
  if (["gray", "grey", "silver", "white", "black", "transparent", "currentcolor"].includes(trimmed))
    return true;
  const parsed = parseColorToRgb(trimmed);
  if (parsed) return !hasColorChroma(parsed);
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/is-overshoot-cubic-bezier.ts
const isOvershootCubicBezier = (value) => {
  const match = value.match(
    /cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/,
  );
  if (!match) return false;
  const controlY1 = parseFloat(match[2]);
  const controlY2 = parseFloat(match[4]);
  return controlY1 < -0.1 || controlY1 > 1.1 || controlY2 < -0.1 || controlY2 > 1.1;
};
//#endregion
//#region src/core/rules/lint/design/utils/build-default-palette-regex.ts
const buildDefaultPaletteRegex = () => {
  const utilityPrefixGroup = TAILWIND_PALETTE_UTILITY_PREFIXES.join("|");
  const paletteNameGroup = TAILWIND_DEFAULT_PALETTE_NAMES.join("|");
  const paletteStopGroup = TAILWIND_DEFAULT_PALETTE_STOPS.join("|");
  return new RegExp(
    `(?:^|\\s|:)(${utilityPrefixGroup})-(${paletteNameGroup})-(${paletteStopGroup})(?=$|[\\s:/])`,
    "g",
  );
};
//#endregion
//#region src/core/rules/lint/design/utils/default-palette-regex.ts
const DEFAULT_PALETTE_REGEX = buildDefaultPaletteRegex();
//#endregion
//#region src/core/rules/lint/design/utils/collect-axis-shorthand-pairs.ts
const collectAxisShorthandPairs = (classNameValue, horizontalPattern, verticalPattern) => {
  const horizontalValues = /* @__PURE__ */ new Set();
  for (const horizontalMatch of classNameValue.matchAll(horizontalPattern))
    horizontalValues.add(`${horizontalMatch[1]}${horizontalMatch[2]}`);
  const matchedPairs = [];
  for (const verticalMatch of classNameValue.matchAll(verticalPattern)) {
    const verticalValue = `${verticalMatch[1]}${verticalMatch[2]}`;
    if (horizontalValues.has(verticalValue)) matchedPairs.push({ value: verticalValue });
  }
  return matchedPairs;
};
//#endregion
//#region src/core/rules/lint/design/utils/collect-jsx-label-text.ts
const collectJsxLabelText = (jsxElementNode) => {
  const childList = jsxElementNode.children ?? [];
  if (childList.length === 0) return null;
  const collectedFragments = [];
  for (const childNode of childList) {
    if (isNodeOfType(childNode, "JSXText")) {
      collectedFragments.push(typeof childNode.value === "string" ? childNode.value : "");
      continue;
    }
    if (isNodeOfType(childNode, "JSXExpressionContainer")) {
      const expression = childNode.expression;
      if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
        collectedFragments.push(expression.value);
        continue;
      }
      if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1) {
        const rawTemplate = expression.quasis[0].value?.raw;
        if (typeof rawTemplate === "string" && expression.expressions.length === 0) {
          collectedFragments.push(rawTemplate);
          continue;
        }
      }
      return null;
    }
    if (isNodeOfType(childNode, "JSXFragment")) {
      const fragmentLabel = collectJsxLabelText(childNode);
      if (fragmentLabel === null) return null;
      collectedFragments.push(fragmentLabel);
      continue;
    }
    if (isNodeOfType(childNode, "JSXElement")) return null;
  }
  return collectedFragments.join("").trim();
};
//#endregion
//#region src/core/rules/lint/design/utils/get-class-name-literal.ts
const getClassNameLiteral = (classAttribute) => {
  if (!classAttribute.value) return null;
  if (
    isNodeOfType(classAttribute.value, "Literal") &&
    typeof classAttribute.value.value === "string"
  )
    return classAttribute.value.value;
  if (isNodeOfType(classAttribute.value, "JSXExpressionContainer")) {
    const expression = classAttribute.value.expression;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "string")
      return expression.value;
    if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1)
      return expression.quasis[0].value?.raw ?? null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-inline-style-object-expression.ts
const getInlineStyleObjectExpression = (jsxAttribute) => {
  if (!isNodeOfType(jsxAttribute.name, "JSXIdentifier") || jsxAttribute.name.name !== "style")
    return null;
  if (!isNodeOfType(jsxAttribute.value, "JSXExpressionContainer")) return null;
  const expression = jsxAttribute.value.expression;
  if (!isNodeOfType(expression, "ObjectExpression")) return null;
  return expression;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-opening-element-tag-name.ts
const getOpeningElementTagName = (openingElement) => {
  if (!openingElement) return null;
  if (isNodeOfType(openingElement.name, "JSXIdentifier")) return openingElement.name.name;
  if (isNodeOfType(openingElement.name, "JSXMemberExpression")) {
    let cursor = openingElement.name;
    while (isNodeOfType(cursor, "JSXMemberExpression")) cursor = cursor.property;
    if (isNodeOfType(cursor, "JSXIdentifier")) return cursor.name;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-style-property-key-name.ts
const getStylePropertyKeyName = (objectProperty) => {
  if (!isNodeOfType(objectProperty, "Property")) return null;
  if (isNodeOfType(objectProperty.key, "Identifier")) return objectProperty.key.name;
  if (isNodeOfType(objectProperty.key, "Literal") && typeof objectProperty.key.value === "string")
    return objectProperty.key.value;
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/get-style-property-numeric-value.ts
const getStylePropertyNumericValue = (objectProperty) => {
  const valueNode = objectProperty.value;
  if (!valueNode) return null;
  if (isNodeOfType(valueNode, "Literal") && typeof valueNode.value === "number")
    return valueNode.value;
  if (isNodeOfType(valueNode, "Literal") && typeof valueNode.value === "string") {
    const parsed = parseFloat(valueNode.value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/design/utils/has-responsive-prefix.ts
const hasResponsivePrefix = (classNameValue, axisPrefix) =>
  new RegExp(`(?:^|\\s)\\w+:${axisPrefix}-`).test(classNameValue);
//#endregion
//#region src/core/rules/lint/design/utils/is-button-like-tag-name.ts
const isButtonLikeTagName = (tagName) => {
  if (tagName === "button") return true;
  if (tagName === "Button") return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/is-inside-excluded-ancestor.ts
const isInsideExcludedAncestor = (jsxTextNode) => {
  let cursor = jsxTextNode.parent;
  while (cursor) {
    if (isNodeOfType(cursor, "JSXElement")) {
      const tagName = getOpeningElementTagName(cursor.openingElement);
      if (tagName && ELLIPSIS_EXCLUDED_TAG_NAMES.has(tagName.toLowerCase())) return true;
      const translateAttribute = findJsxAttribute(
        cursor.openingElement?.attributes ?? [],
        "translate",
      );
      if (
        isNodeOfType(translateAttribute?.value, "Literal") &&
        translateAttribute.value.value === "no"
      )
        return true;
    }
    cursor = cursor.parent;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/design/utils/tokenize-class-name.ts
const tokenizeClassName$1 = (classNameValue) => classNameValue.split(/\s+/).filter(Boolean);
//#endregion
//#region src/core/rules/lint/design/design-no-bold-heading.ts
const noBoldHeading = defineRule({
  recommendation:
    "Use medium or semibold heading weights instead of font-bold so display text keeps readable letter shapes.",
  examples: [
    {
      before: `<h1 className="font-bold" />`,
      after: `<h1 className="font-semibold" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(openingNode) {
      const tagName = getOpeningElementTagName(openingNode);
      if (!tagName || !HEADING_TAG_NAMES.has(tagName)) return;
      const classAttribute = findJsxAttribute(openingNode.attributes ?? [], "className");
      if (classAttribute) {
        const classNameLiteral = getClassNameLiteral(classAttribute);
        if (classNameLiteral) {
          for (const tailwindWeightToken of HEAVY_HEADING_TAILWIND_WEIGHTS)
            if (new RegExp(`(?:^|\\s)${tailwindWeightToken}(?:$|\\s|:)`).test(classNameLiteral)) {
              context.report({
                node: classAttribute,
                message: `${tailwindWeightToken} on <${tagName}> crushes counter shapes at display sizes - use font-semibold (600) or font-medium (500)`,
              });
              return;
            }
        }
      }
      const styleAttribute = findJsxAttribute(openingNode.attributes ?? [], "style");
      if (!styleAttribute) return;
      const styleObject = getInlineStyleObjectExpression(styleAttribute);
      if (!styleObject) return;
      for (const objectProperty of styleObject.properties ?? []) {
        if (getStylePropertyKeyName(objectProperty) !== "fontWeight") continue;
        const numericWeight = getStylePropertyNumericValue(objectProperty);
        if (numericWeight !== null && numericWeight >= 700) {
          context.report({
            node: objectProperty,
            message: `fontWeight: ${numericWeight} on <${tagName}> crushes counter shapes at display sizes - use 500 or 600`,
          });
          return;
        }
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-default-tailwind-palette.ts
const noDefaultTailwindPalette = defineRule({
  recommendation:
    "Replace default gray/slate/zinc-heavy palettes with project tokens or a deliberate brand palette.",
  examples: [
    {
      before: `<button className="bg-indigo-600 text-white" />`,
      after: `<button className="bg-brand text-brand-foreground" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(jsxAttribute) {
      if (
        !isNodeOfType(jsxAttribute.name, "JSXIdentifier") ||
        jsxAttribute.name.name !== "className"
      )
        return;
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      const reportedTokens = /* @__PURE__ */ new Set();
      for (const paletteMatch of classNameLiteral.matchAll(DEFAULT_PALETTE_REGEX)) {
        const matchedToken = `${paletteMatch[1]}-${paletteMatch[2]}-${paletteMatch[3]}`;
        if (reportedTokens.has(matchedToken)) continue;
        reportedTokens.add(matchedToken);
        const replacementSuggestion =
          paletteMatch[2] === "indigo"
            ? "use your project's brand color or zinc/neutral/stone"
            : "use zinc (true neutral), neutral (warmer), or stone (warmest)";
        context.report({
          node: jsxAttribute,
          message: `${matchedToken} reads as the Tailwind template default - ${replacementSuggestion}`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-redundant-padding-axes.ts
const noRedundantPaddingAxes = defineRule({
  recommendation:
    "Use the shorthand padding utility for matching axes or remove duplicate axis utilities.",
  examples: [
    {
      before: `<div className="px-4 py-4" />`,
      after: `<div className="p-4" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(jsxAttribute) {
      if (
        !isNodeOfType(jsxAttribute.name, "JSXIdentifier") ||
        jsxAttribute.name.name !== "className"
      )
        return;
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      if (
        hasResponsivePrefix(classNameLiteral, "px") ||
        hasResponsivePrefix(classNameLiteral, "py")
      )
        return;
      const matchedPairs = collectAxisShorthandPairs(
        classNameLiteral,
        PADDING_HORIZONTAL_AXIS_PATTERN,
        PADDING_VERTICAL_AXIS_PATTERN,
      );
      if (matchedPairs.length === 0) return;
      for (const matchedPair of matchedPairs)
        context.report({
          node: jsxAttribute,
          message: `px-${matchedPair.value} py-${matchedPair.value} → use the shorthand p-${matchedPair.value}`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-redundant-size-axes.ts
const noRedundantSizeAxes = defineRule({
  recommendation:
    "Use size-* when width and height match, or keep only the axis utility that actually differs.",
  examples: [
    {
      before: `<div className="h-6 w-6" />`,
      after: `<div className="size-6" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(jsxAttribute) {
      if (
        !isNodeOfType(jsxAttribute.name, "JSXIdentifier") ||
        jsxAttribute.name.name !== "className"
      )
        return;
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      if (hasResponsivePrefix(classNameLiteral, "w") || hasResponsivePrefix(classNameLiteral, "h"))
        return;
      const matchedPairs = collectAxisShorthandPairs(
        classNameLiteral,
        SIZE_WIDTH_AXIS_PATTERN,
        SIZE_HEIGHT_AXIS_PATTERN,
      );
      if (matchedPairs.length === 0) return;
      for (const matchedPair of matchedPairs)
        context.report({
          node: jsxAttribute,
          message: `w-${matchedPair.value} h-${matchedPair.value} → use the shorthand size-${matchedPair.value} (Tailwind v3.4+)`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-space-on-flex-children.ts
const noSpaceOnFlexChildren = defineRule({
  recommendation:
    "Use gap on the flex container instead of spacing margins on individual flex children.",
  examples: [
    {
      before: `<div className="flex"><span className="mr-2" /><span /></div>`,
      after: `<div className="flex gap-2"><span /><span /></div>`,
    },
  ],
  create: (context) => ({
    JSXAttribute(jsxAttribute) {
      if (
        !isNodeOfType(jsxAttribute.name, "JSXIdentifier") ||
        jsxAttribute.name.name !== "className"
      )
        return;
      const classNameLiteral = getClassNameLiteral(jsxAttribute);
      if (!classNameLiteral) return;
      const tokens = tokenizeClassName$1(classNameLiteral);
      let hasFlexOrGridLayout = false;
      for (const token of tokens) {
        const lastSegment = token.includes(":") ? token.slice(token.lastIndexOf(":") + 1) : token;
        if (FLEX_OR_GRID_DISPLAY_TOKENS.has(lastSegment)) {
          hasFlexOrGridLayout = true;
          break;
        }
      }
      if (!hasFlexOrGridLayout) return;
      const spaceMatch = classNameLiteral.match(SPACE_AXIS_PATTERN);
      if (!spaceMatch) return;
      const spaceAxis = spaceMatch[1];
      const spaceValue = spaceMatch[2];
      context.report({
        node: jsxAttribute,
        message: `space-${spaceAxis}-${spaceValue} on a flex/grid parent - use gap-${spaceAxis}-${spaceValue} instead. Per-sibling margins phantom-gap on conditional render and don't mirror in RTL`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-three-period-ellipsis.ts
const noThreePeriodEllipsis = defineRule({
  recommendation:
    "Use the single ellipsis character or clearer loading/status copy instead of three periods.",
  examples: [
    {
      before: `<span>Loading...</span>`,
      after: `<span>Loading…</span>`,
    },
  ],
  create: (context) => ({
    JSXText(jsxTextNode) {
      const textValue = typeof jsxTextNode.value === "string" ? jsxTextNode.value : "";
      if (!TRAILING_THREE_PERIOD_ELLIPSIS_PATTERN.test(textValue)) return;
      if (isInsideExcludedAncestor(jsxTextNode)) return;
      context.report({
        node: jsxTextNode,
        message:
          'Three-period ellipsis ("...") in JSX text - use the actual ellipsis character "…" (or `&hellip;`)',
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/design-no-vague-button-label.ts
const noVagueButtonLabel = defineRule({
  recommendation:
    "Use action-specific button labels that state what will happen, such as Save settings or Invite member.",
  examples: [
    {
      before: `<button>Continue</button>`,
      after: `<button>Save settings</button>`,
    },
  ],
  create: (context) => ({
    JSXElement(jsxElementNode) {
      const tagName = getOpeningElementTagName(jsxElementNode.openingElement);
      if (!tagName || !isButtonLikeTagName(tagName)) return;
      const labelText = collectJsxLabelText(jsxElementNode);
      if (!labelText) return;
      const normalizedLabel = labelText
        .toLowerCase()
        .replace(/[.!?…]+$/, "")
        .trim();
      if (!VAGUE_BUTTON_LABELS.has(normalizedLabel)) return;
      context.report({
        node: jsxElementNode.openingElement ?? jsxElementNode,
        message: `Vague button label "${labelText}" - name the action ("Save changes", "Send invite", "Delete account") so screen readers and hesitant users know what happens`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/effect-needs-cleanup.ts
const effectNeedsCleanup = defineRule({
  recommendation:
    "Return cleanup from effects that register timers, subscriptions, listeners, observers, or async resources.",
  examples: [
    {
      before: `useEffect(() => { window.addEventListener("resize", onResize); }, []);`,
      after: `useEffect(() => { window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const usages = findSubscribeLikeUsages(callback);
      if (usages.length === 0) return;
      if (effectHasCleanupRelease(callback)) return;
      const firstUsage = usages[0];
      const verb = firstUsage.kind === "timer" ? "schedules" : "subscribes via";
      const release =
        firstUsage.kind === "timer"
          ? `clear${firstUsage.resourceName === "setInterval" ? "Interval" : "Timeout"}(...)`
          : "the matching remove/unsubscribe call";
      context.report({
        node,
        message: `useEffect ${verb} \`${firstUsage.resourceName}(...)\` but never returns a cleanup - leaks the registration on every re-run and on unmount. Return a cleanup function that calls ${release}`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/effect-no-adjust-state-on-prop-change.ts
const hasAnyName = (names, candidates) => {
  for (const name of names) if (candidates.has(name)) return true;
  return false;
};
const effectNoAdjustStateOnPropChange = defineRule({
  recommendation:
    "Do not adjust local state from a prop-change effect; either derive the value during render or restructure state so the prop change does not need a synchronizing effect.",
  examples: [
    {
      before: `function List({ items }) {
  const [selection, setSelection] = useState(null);
  useEffect(() => setSelection(null), [items]);
}`,
      after: `function List({ items }) {
  const [prevItems, setPrevItems] = useState(items);
  const [selection, setSelection] = useState(null);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelection(null);
  }
}`,
    },
  ],
  create: (context) => {
    const propTracker = createComponentPropStackTracker();
    return {
      ...propTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const propNames = propTracker.getCurrentPropNames();
        if (propNames.size === 0) return;
        if (!hasAnyName(collectDepIdentifierNames(node), propNames)) return;
        const callback = getEffectCallback(node);
        if (!callback) return;
        walkInsideStatementBlocks(callback.body, (child) => {
          if (!isSetterCall(child)) return;
          const argumentNames = [];
          collectValueIdentifierNames(child.arguments?.[0], argumentNames);
          if (hasAnyName(argumentNames, propNames)) return;
          context.report({
            node: child,
            message:
              "state adjusted from a prop-change effect - derive during render or reset state directly while rendering instead of synchronizing after paint",
          });
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/effect-no-initialize-state.ts
const effectNoInitializeState = defineRule({
  recommendation:
    "Initialize useState with the value you need instead of rendering once with empty state and filling it from a mount-only effect; use useSyncExternalStore for SSR-sensitive browser values.",
  examples: [
    {
      before: `const [name, setName] = useState("");
useEffect(() => setName(initialName), []);`,
      after: `const [name, setName] = useState(initialName);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      if (
        [...collectDepIdentifierNames(node)].filter((name) => !isSetterIdentifier(name)).length > 0
      )
        return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const componentBody = node.parent?.parent;
      if (!isNodeOfType(componentBody, "BlockStatement")) return;
      const setterToStateName = new Map(
        collectUseStateBindings(componentBody).map((binding) => [
          binding.setterName,
          binding.valueName,
        ]),
      );
      walkInsideStatementBlocks(callback.body, (child) => {
        if (!isNodeOfType(child, "CallExpression")) return;
        if (!isNodeOfType(child.callee, "Identifier")) return;
        const stateName = setterToStateName.get(child.callee.name);
        if (!stateName) return;
        context.report({
          node: child,
          message: `state "${stateName}" is initialized from a mount-only effect - pass the initial value to useState instead`,
        });
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/effect-no-pass-data-to-parent.ts
const isCallbackPropName$1 = (name) => /^on[A-Z]/.test(name);
const effectHasCleanup = (callback) =>
  getCallbackStatements(callback).some((statement) => isNodeOfType(statement, "ReturnStatement"));
const collectConstantBindings = (componentBody) => {
  const constantNames = /* @__PURE__ */ new Set();
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      const init = declarator.init;
      if (
        isNodeOfType(init, "Literal") ||
        isNodeOfType(init, "TemplateLiteral") ||
        isNodeOfType(init, "ArrayExpression") ||
        isNodeOfType(init, "ObjectExpression")
      )
        constantNames.add(declarator.id.name);
    }
  }
  return constantNames;
};
const effectNoPassDataToParent = defineRule({
  recommendation:
    "Do not fetch or derive child-owned data and push it to a parent from an effect; fetch in the parent and pass data down, or return data from the hook.",
  examples: [
    {
      before: `useEffect(() => {
  onData(result);
}, [result]);`,
      after: `const result = useData();
return <ParentOwnedView result={result} />;`,
    },
  ],
  create: (context) => {
    const propTracker = createComponentPropStackTracker();
    return {
      ...propTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const propNames = propTracker.getCurrentPropNames();
        const callbackPropNames = new Set([...propNames].filter(isCallbackPropName$1));
        if (callbackPropNames.size === 0) return;
        const callback = getEffectCallback(node);
        if (!callback || effectHasCleanup(callback)) return;
        const componentBody = node.parent?.parent;
        if (!isNodeOfType(componentBody, "BlockStatement")) return;
        const knownNonDataNames = new Set(propNames);
        for (const binding of collectUseStateBindings(componentBody))
          knownNonDataNames.add(binding.valueName);
        for (const refName of collectUseRefBindingNames(componentBody))
          knownNonDataNames.add(refName);
        for (const constantName of collectConstantBindings(componentBody))
          knownNonDataNames.add(constantName);
        walkInsideStatementBlocks(callback.body, (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (
            !isNodeOfType(child.callee, "Identifier") ||
            !callbackPropNames.has(child.callee.name)
          )
            return;
          const argumentNames = [];
          for (const argument of child.arguments ?? [])
            collectValueIdentifierNames(argument, argumentNames);
          const dataName = argumentNames.find((name) => !knownNonDataNames.has(name));
          if (!dataName) return;
          context.report({
            node: child,
            message: `effect passes child-owned data "${dataName}" to parent callback "${child.callee.name}" - move the data ownership to the parent instead`,
          });
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/effect-no-pass-live-state-to-parent.ts
const isCallbackPropName = (name) => /^on[A-Z]/.test(name);
const effectNoPassLiveStateToParent = defineRule({
  recommendation:
    "Do not notify parents about every live state change from an effect; lift that state to the parent or return it from the custom hook.",
  examples: [
    {
      before: `const [value, setValue] = useState("");
useEffect(() => onChange(value), [value]);`,
      after: `const [value, setValue] = useState("");
<Child value={value} onChange={setValue} />`,
    },
  ],
  create: (context) => {
    const propTracker = createComponentPropStackTracker();
    return {
      ...propTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const propNames = propTracker.getCurrentPropNames();
        if (propNames.size === 0) return;
        const callbackPropNames = new Set([...propNames].filter(isCallbackPropName));
        if (callbackPropNames.size === 0) return;
        const componentBody = node.parent?.parent;
        if (!isNodeOfType(componentBody, "BlockStatement")) return;
        const stateNames = new Set(
          collectUseStateBindings(componentBody).map((binding) => binding.valueName),
        );
        if (stateNames.size === 0) return;
        const callback = getEffectCallback(node);
        if (!callback) return;
        walkInsideStatementBlocks(callback.body, (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (
            !isNodeOfType(child.callee, "Identifier") ||
            !callbackPropNames.has(child.callee.name)
          )
            return;
          const argumentNames = [];
          for (const argument of child.arguments ?? [])
            collectValueIdentifierNames(argument, argumentNames);
          if (!argumentNames.some((name) => stateNames.has(name))) return;
          context.report({
            node: child,
            message: `effect passes live state to parent callback "${child.callee.name}" - lift the state up instead of syncing it after render`,
          });
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/effect-no-reset-all-state-on-prop-change.ts
const isUndefinedValue = (node) =>
  !node || (isNodeOfType(node, "Identifier") && node.name === "undefined");
const isSameInitialValue = (setterArgument, initializer) => {
  if (isUndefinedValue(setterArgument) && isUndefinedValue(initializer)) return true;
  if (!setterArgument || !initializer) return false;
  return areExpressionsStructurallyEqual(setterArgument, initializer);
};
const hasPropDependency = (effectNode, propNames) => {
  for (const depName of collectDepIdentifierNames(effectNode))
    if (propNames.has(depName)) return depName;
  return null;
};
const effectNoResetAllStateOnPropChange = defineRule({
  recommendation:
    "When a prop represents a new entity, reset the component with a key prop instead of clearing every local state variable from an effect.",
  examples: [
    {
      before: `function Profile({ userId }) {
  const [comment, setComment] = useState("");
  useEffect(() => setComment(""), [userId]);
}`,
      after: `<Profile key={userId} userId={userId} />`,
    },
  ],
  create: (context) => {
    const propTracker = createComponentPropStackTracker();
    return {
      ...propTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const propName = hasPropDependency(node, propTracker.getCurrentPropNames());
        if (!propName) return;
        const callback = getEffectCallback(node);
        if (!callback) return;
        const componentBody = node.parent?.parent;
        if (!isNodeOfType(componentBody, "BlockStatement")) return;
        const stateBindings = collectUseStateBindings(componentBody);
        if (stateBindings.length === 0) return;
        const resetSetterNames = /* @__PURE__ */ new Set();
        walkInsideStatementBlocks(callback.body, (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (!isNodeOfType(child.callee, "Identifier")) return;
          const binding = stateBindings.find(
            (stateBinding) => stateBinding.setterName === child.callee.name,
          );
          if (!binding) return;
          const initializer = binding.declarator.init?.arguments?.[0];
          if (isSameInitialValue(child.arguments?.[0], initializer))
            resetSetterNames.add(binding.setterName);
        });
        if (resetSetterNames.size !== stateBindings.length) return;
        context.report({
          node,
          message: `effect resets all local state when prop "${propName}" changes - pass that value as a key so React resets the component state`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-batch-dom-css.ts
const jsBatchDomCss = defineRule({
  recommendation:
    "Batch DOM style changes with classes, cssText, or a single write phase to avoid repeated layout work.",
  examples: [
    {
      before: `el.style.width = width;
el.style.height = height;`,
      after: `el.className = "expanded";`,
    },
  ],
  create: (context) => {
    const isStyleAssignment = (node) =>
      isNodeOfType(node, "ExpressionStatement") &&
      isNodeOfType(node.expression, "AssignmentExpression") &&
      isNodeOfType(node.expression.left, "MemberExpression") &&
      isNodeOfType(node.expression.left.object, "MemberExpression") &&
      isNodeOfType(node.expression.left.object.property, "Identifier") &&
      node.expression.left.object.property.name === "style";
    return {
      BlockStatement(node) {
        const statements = node.body ?? [];
        for (let statementIndex = 1; statementIndex < statements.length; statementIndex++)
          if (
            isStyleAssignment(statements[statementIndex]) &&
            isStyleAssignment(statements[statementIndex - 1])
          )
            context.report({
              node: statements[statementIndex],
              message:
                "Multiple sequential element.style assignments - batch with cssText or classList for fewer reflows",
            });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-cache-property-access.ts
const jsCachePropertyAccess = defineRule({
  recommendation:
    "Cache repeated deep property reads in a local variable inside hot loops or render paths.",
  examples: [
    {
      before: `for (const item of items) total += item.deep.value;`,
      after: `for (const item of items) { const value = item.deep.value; total += value; }`,
    },
  ],
  create: (context) => {
    const inspectLoopBody = (loopBody) => {
      const counts = /* @__PURE__ */ new Map();
      walkAst(loopBody, (child) => {
        if (!isNodeOfType(child, "MemberExpression")) return;
        if (child.computed) return;
        if (isNodeOfType(child.parent, "MemberExpression") && child.parent.object === child) return;
        const key = buildMemberAccessKey(child);
        if (!key) return;
        if (key.split(".").length < 3) return;
        const existing = counts.get(key);
        if (existing) existing.count++;
        else
          counts.set(key, {
            count: 1,
            firstNode: child,
          });
      });
      for (const [key, { count, firstNode }] of counts)
        if (count >= 3)
          context.report({
            node: firstNode,
            message: `${key} is read ${count} times inside this loop - hoist into a const at the top of the loop body`,
          });
    };
    const handleLoop = (node) => {
      if (node.body) inspectLoopBody(node.body);
    };
    return {
      ForStatement: handleLoop,
      ForInStatement: handleLoop,
      ForOfStatement: handleLoop,
      WhileStatement: handleLoop,
      DoWhileStatement: handleLoop,
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-cache-storage.ts
const jsCacheStorage = defineRule({
  recommendation:
    "Read localStorage or sessionStorage once and reuse the value instead of performing repeated synchronous storage reads.",
  examples: [
    {
      before: `const theme = localStorage.getItem("theme");
const mode = localStorage.getItem("theme");`,
      after: `const theme = localStorage.getItem("theme");`,
    },
  ],
  create: (context) => {
    const storageReadCounts = /* @__PURE__ */ new Map();
    return {
      CallExpression(node) {
        if (!isMemberProperty(node.callee, "getItem")) return;
        const storageObject = node.callee.object;
        if (!isNodeOfType(storageObject, "Identifier") || !STORAGE_OBJECTS.has(storageObject.name))
          return;
        const storageKeyArgument = node.arguments?.[0];
        if (!isNodeOfType(storageKeyArgument, "Literal")) return;
        const storageKey = String(storageKeyArgument.value);
        const readCount = (storageReadCounts.get(storageKey) ?? 0) + 1;
        storageReadCounts.set(storageKey, readCount);
        if (readCount === 2)
          context.report({
            node,
            message: `${storageObject.name}.getItem("${storageKey}") called multiple times - cache the result in a variable`,
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-combine-iterations.ts
const ITERATOR_SOURCE_METHOD_NAMES = new Set(["entries", "keys", "values"]);
const isIteratorFromCall = (node) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  node.callee.object.name === "Iterator" &&
  isNodeOfType(node.callee.property, "Identifier") &&
  node.callee.property.name === "from";
const isIteratorHelperChain = (node) => {
  let currentNode = node;
  while (currentNode) {
    if (isIteratorFromCall(currentNode)) return true;
    if (!isNodeOfType(currentNode, "CallExpression")) return false;
    const callee = currentNode.callee;
    if (!isNodeOfType(callee, "MemberExpression")) return false;
    if (
      isNodeOfType(callee.property, "Identifier") &&
      ITERATOR_SOURCE_METHOD_NAMES.has(callee.property.name)
    )
      return true;
    currentNode = callee.object;
  }
  return false;
};
const jsCombineIterations = defineRule({
  recommendation:
    "Combine chained array passes when they traverse the same data and the intermediate arrays are not needed.",
  examples: [
    {
      before: `const active = users.filter(isActive);
const names = active.map(getName);`,
      after: `const names = users.flatMap((user) => isActive(user) ? [getName(user)] : []);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    return {
      CallExpression(node) {
        if (isTestOrInfraFile) return;
        if (
          !isNodeOfType(node.callee, "MemberExpression") ||
          !isNodeOfType(node.callee.property, "Identifier")
        )
          return;
        const outerMethod = node.callee.property.name;
        if (!CHAINABLE_ITERATION_METHODS.has(outerMethod)) return;
        const innerCall = node.callee.object;
        if (
          !isNodeOfType(innerCall, "CallExpression") ||
          !isNodeOfType(innerCall.callee, "MemberExpression") ||
          !isNodeOfType(innerCall.callee.property, "Identifier")
        )
          return;
        const innerMethod = innerCall.callee.property.name;
        if (!CHAINABLE_ITERATION_METHODS.has(innerMethod)) return;
        if (isIteratorHelperChain(innerCall.callee.object)) return;
        if (innerMethod === "map" && outerMethod === "filter") {
          const filterArgument = node.arguments?.[0];
          if (
            (isNodeOfType(filterArgument, "Identifier") && filterArgument.name === "Boolean") ||
            (isNodeOfType(filterArgument, "ArrowFunctionExpression") &&
              filterArgument.params?.length === 1 &&
              isNodeOfType(filterArgument.body, "Identifier") &&
              isNodeOfType(filterArgument.params[0], "Identifier") &&
              filterArgument.body.name === filterArgument.params[0].name)
          )
            return;
        }
        context.report({
          node,
          message: `.${innerMethod}().${outerMethod}() iterates the array twice - combine into a single loop with .reduce() or for...of`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-early-exit.ts
const jsEarlyExit = defineRule({
  recommendation:
    "Return early from invalid or empty branches so the main path stays shallow and unnecessary work is skipped.",
  examples: [
    {
      before: `if (items.length) { process(items); return true; } return false;`,
      after: `if (items.length === 0) return false;
process(items);
return true;`,
    },
  ],
  create: (context) => ({
    IfStatement(node) {
      if (!isNodeOfType(node.consequent, "BlockStatement") || !node.consequent.body) return;
      let nestingDepth = 0;
      let currentBlock = node.consequent;
      while (isNodeOfType(currentBlock, "BlockStatement") && currentBlock.body?.length === 1) {
        const innerStatement = currentBlock.body[0];
        if (!isNodeOfType(innerStatement, "IfStatement")) break;
        nestingDepth++;
        currentBlock = innerStatement.consequent;
      }
      if (nestingDepth >= 3)
        context.report({
          node,
          message: `${nestingDepth + 1} levels of nested if statements - use early returns to flatten`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-flatmap-filter.ts
const jsFlatmapFilter = defineRule({
  recommendation:
    "Use flatMap when mapping and filtering into a new array can be done in a single pass.",
  examples: [
    {
      before: `items.map(toRow).filter(Boolean);`,
      after: `items.flatMap((item) => { const row = toRow(item); return row ? [row] : []; });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (node.callee.property.name !== "filter") return;
      const filterArgument = node.arguments?.[0];
      if (!filterArgument) return;
      const isIdentityArrow =
        isNodeOfType(filterArgument, "ArrowFunctionExpression") &&
        filterArgument.params?.length === 1 &&
        isNodeOfType(filterArgument.body, "Identifier") &&
        isNodeOfType(filterArgument.params[0], "Identifier") &&
        filterArgument.body.name === filterArgument.params[0].name;
      if (
        !(
          (isNodeOfType(filterArgument, "Identifier") && filterArgument.name === "Boolean") ||
          isIdentityArrow
        )
      )
        return;
      const innerCall = node.callee.object;
      if (!isNodeOfType(innerCall, "CallExpression")) return;
      if (!isNodeOfType(innerCall.callee, "MemberExpression")) return;
      if (!isNodeOfType(innerCall.callee.property, "Identifier")) return;
      if (innerCall.callee.property.name !== "map") return;
      context.report({
        node,
        message:
          ".map().filter(Boolean) iterates twice - use .flatMap() to transform and filter in a single pass",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-hoist-intl.ts
const jsHoistIntl = defineRule({
  recommendation:
    "Hoist Intl formatter construction to module scope or memoize it because formatter creation is expensive.",
  examples: [
    {
      before: `const label = new Intl.DateTimeFormat("en").format(date);`,
      after: `const DATE_FORMAT = new Intl.DateTimeFormat("en");
const label = DATE_FORMAT.format(date);`,
    },
  ],
  create: (context) => ({
    NewExpression(node) {
      if (!isIntlNewExpression(node)) return;
      let cursor = node.parent ?? null;
      let inFunctionBody = false;
      while (cursor) {
        if (
          isNodeOfType(cursor, "FunctionDeclaration") ||
          isNodeOfType(cursor, "FunctionExpression") ||
          isNodeOfType(cursor, "ArrowFunctionExpression")
        ) {
          inFunctionBody = true;
          break;
        }
        cursor = cursor.parent ?? null;
      }
      if (!inFunctionBody) return;
      const className = node.callee.property?.name ?? "Intl";
      context.report({
        node,
        message: `new Intl.${className}() inside a function - hoist to module scope or wrap in useMemo so it isn't recreated each call`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-hoist-regexp.ts
const jsHoistRegexp = defineRule({
  recommendation:
    "Hoist RegExp construction out of loops, renders, and hot functions when the pattern is constant.",
  examples: [
    {
      before: `items.filter((item) => /react/i.test(item.name));`,
      after: `const REACT_PATTERN = /react/i;
items.filter((item) => REACT_PATTERN.test(item.name));`,
    },
  ],
  create: (context) =>
    createLoopAwareVisitors({
      NewExpression(node) {
        if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "RegExp")
          context.report({
            node,
            message: "new RegExp() inside a loop - hoist to a module-level constant",
          });
      },
    }),
});
//#endregion
//#region src/core/rules/lint/performance/js-index-maps.ts
const jsIndexMaps = defineRule({
  recommendation:
    "Build a Map keyed by id for repeated joins or lookups instead of calling find inside loops.",
  examples: [
    {
      before: `users.map((user) => posts.find((post) => post.userId === user.id));`,
      after: `const postsByUserId = new Map(posts.map((post) => [post.userId, post]));`,
    },
  ],
  create: (context) =>
    createLoopAwareVisitors({
      CallExpression(node) {
        if (
          !isNodeOfType(node.callee, "MemberExpression") ||
          !isNodeOfType(node.callee.property, "Identifier")
        )
          return;
        const methodName = node.callee.property.name;
        if (methodName === "find" || methodName === "findIndex")
          context.report({
            node,
            message: `array.${methodName}() in a loop is O(n*m) - build a Map for O(1) lookups`,
          });
      },
    }),
});
//#endregion
//#region src/core/rules/lint/performance/js-length-check-first.ts
const isEqualityLengthComparison = (node) =>
  isNodeOfType(node, "BinaryExpression") &&
  (node.operator === "===" || node.operator === "==") &&
  (isMemberProperty(node.left, "length") || isMemberProperty(node.right, "length"));
const isInequalityLengthComparison = (node) =>
  isNodeOfType(node, "BinaryExpression") &&
  (node.operator === "!==" || node.operator === "!=") &&
  (isMemberProperty(node.left, "length") || isMemberProperty(node.right, "length"));
const isDescendantOf = (node, target) => {
  let current = node;
  while (current) {
    if (current === target) return true;
    current = current.parent;
  }
  return false;
};
const isInsideLengthGuard = (node) => {
  let ancestor = node.parent ?? null;
  while (ancestor) {
    if (
      isNodeOfType(ancestor, "LogicalExpression") &&
      ancestor.operator === "&&" &&
      isEqualityLengthComparison(ancestor.left)
    )
      return true;
    if (isNodeOfType(ancestor, "IfStatement")) {
      const isInTrueBranch = isDescendantOf(node, ancestor.consequent);
      const isInFalseBranch = isDescendantOf(node, ancestor.alternate);
      if (isInTrueBranch && isEqualityLengthComparison(ancestor.test)) return true;
      if (isInFalseBranch && isInequalityLengthComparison(ancestor.test)) return true;
    }
    if (isNodeOfType(ancestor, "ConditionalExpression")) {
      const isInTrueBranch = isDescendantOf(node, ancestor.consequent);
      const isInFalseBranch = isDescendantOf(node, ancestor.alternate);
      if (isInTrueBranch && isEqualityLengthComparison(ancestor.test)) return true;
      if (isInFalseBranch && isInequalityLengthComparison(ancestor.test)) return true;
    }
    ancestor = ancestor.parent ?? null;
  }
  return false;
};
const isIndexedMemberAccess = (node, indexName) =>
  isNodeOfType(node, "MemberExpression") &&
  node.computed &&
  isNodeOfType(node.property, "Identifier") &&
  node.property.name === indexName;
const jsLengthCheckFirst = defineRule({
  recommendation: "Check array lengths before doing expensive element-by-element comparisons.",
  examples: [
    {
      before: `return a.every((value, index) => value === b[index]);`,
      after: `return a.length === b.length && a.every((value, index) => value === b[index]);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (node.callee.property.name !== "every") return;
      const callback = node.arguments?.[0];
      if (
        !isNodeOfType(callback, "ArrowFunctionExpression") &&
        !isNodeOfType(callback, "FunctionExpression")
      )
        return;
      const params = callback.params ?? [];
      if (params.length < 2) return;
      const indexParam = params[1];
      if (!isNodeOfType(indexParam, "Identifier")) return;
      const indexName = indexParam.name;
      let hasElementWiseComparison = false;
      walkAst(callback.body, (child) => {
        if (hasElementWiseComparison) return;
        if (
          !isNodeOfType(child, "BinaryExpression") ||
          (child.operator !== "===" && child.operator !== "!==")
        )
          return;
        if (
          isIndexedMemberAccess(child.left, indexName) ||
          isIndexedMemberAccess(child.right, indexName)
        )
          hasElementWiseComparison = true;
      });
      if (!hasElementWiseComparison) return;
      if (isInsideLengthGuard(node)) return;
      context.report({
        node,
        message:
          ".every() over an array compared to another array - short-circuit with `a.length === b.length && a.every(...)` so unequal-length arrays exit immediately",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-min-max-loop.ts
const jsMinMaxLoop = defineRule({
  recommendation:
    "Compute min or max with a single loop or reducer instead of sorting the entire collection.",
  examples: [
    {
      before: `const max = items.toSorted((a, b) => b.score - a.score)[0];`,
      after: `let max = items[0];
for (const item of items) if (item.score > max.score) max = item;`,
    },
  ],
  create: (context) => ({
    MemberExpression(node) {
      if (!node.computed) return;
      const object = node.object;
      if (!isNodeOfType(object, "CallExpression") || !isMemberProperty(object.callee, "sort"))
        return;
      const isFirstElement = isNodeOfType(node.property, "Literal") && node.property.value === 0;
      const isLastElement =
        isNodeOfType(node.property, "BinaryExpression") &&
        node.property.operator === "-" &&
        isNodeOfType(node.property.right, "Literal") &&
        node.property.right.value === 1;
      if (isFirstElement || isLastElement) {
        const targetFunction = isFirstElement ? "min" : "max";
        context.report({
          node,
          message: `array.sort()[${isFirstElement ? "0" : "length-1"}] for min/max - use Math.${targetFunction}(...array) instead (O(n) vs O(n log n))`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-set-map-lookups.ts
const STRING_RETURNING_METHODS = new Set([
  "toString",
  "toLocaleString",
  "toLowerCase",
  "toUpperCase",
  "toLocaleLowerCase",
  "toLocaleUpperCase",
  "trim",
  "trimStart",
  "trimEnd",
  "padStart",
  "padEnd",
  "normalize",
  "repeat",
  "replace",
  "replaceAll",
  "substring",
  "substr",
  "charAt",
  "toFixed",
  "toExponential",
  "toPrecision",
  "toJSON",
]);
const STRING_TYPED_PROPERTY_NAMES = new Set([
  "textContent",
  "innerText",
  "innerHTML",
  "outerHTML",
  "nodeValue",
  "nodeName",
  "localName",
  "namespaceURI",
  "baseURI",
  "documentURI",
  "tagName",
  "className",
  "id",
  "lang",
  "dir",
  "title",
  "alt",
  "type",
  "name",
  "placeholder",
  "href",
  "src",
  "value",
  "accessKey",
  "contentEditable",
  "hash",
  "host",
  "hostname",
  "pathname",
  "port",
  "protocol",
  "search",
  "origin",
  "username",
  "password",
  "characterSet",
  "contentType",
  "charset",
  "mimeType",
  "mediaType",
  "cssText",
  "message",
  "stack",
  "fileName",
  "code",
  "label",
  "slug",
  "prefix",
]);
const STRING_TYPED_IDENTIFIER_NAMES = new Set([
  "text",
  "string",
  "str",
  "content",
  "contents",
  "html",
  "xml",
  "json",
  "css",
  "yaml",
  "markdown",
  "source",
  "sourceCode",
  "template",
  "raw",
  "comment",
  "description",
  "summary",
  "snippet",
  "url",
  "uri",
  "path",
  "filename",
  "filepath",
  "fileName",
  "filePath",
  "line",
  "char",
  "character",
  "letter",
  "word",
  "phrase",
  "sentence",
  "paragraph",
  "query",
  "search",
  "haystack",
  "needle",
  "route",
  "key",
  "token",
  "tag",
]);
const STRING_TYPED_IDENTIFIER_SUFFIX_PATTERN =
  /(?:Text|Name|Label|Title|Url|Path|Key|Route|Slug|Token|Tag|Id|Code|Type|Value)$/;
const isLikelyStringReceiver = (receiver) => {
  if (!receiver) return false;
  if (isNodeOfType(receiver, "Literal") && typeof receiver.value === "string") return true;
  if (isNodeOfType(receiver, "TemplateLiteral")) return true;
  if (
    isNodeOfType(receiver, "CallExpression") &&
    isNodeOfType(receiver.callee, "Identifier") &&
    receiver.callee.name === "String"
  )
    return true;
  if (
    isNodeOfType(receiver, "CallExpression") &&
    isNodeOfType(receiver.callee, "MemberExpression") &&
    isNodeOfType(receiver.callee.property, "Identifier") &&
    STRING_RETURNING_METHODS.has(receiver.callee.property.name)
  )
    return true;
  if (
    isNodeOfType(receiver, "MemberExpression") &&
    isNodeOfType(receiver.property, "Identifier") &&
    STRING_TYPED_PROPERTY_NAMES.has(receiver.property.name)
  )
    return true;
  if (
    isNodeOfType(receiver, "ChainExpression") &&
    receiver.expression &&
    isLikelyStringReceiver(receiver.expression)
  )
    return true;
  if (isNodeOfType(receiver, "Identifier"))
    return (
      STRING_TYPED_IDENTIFIER_NAMES.has(receiver.name) ||
      STRING_TYPED_IDENTIFIER_SUFFIX_PATTERN.test(receiver.name)
    );
  return false;
};
const jsSetMapLookups = defineRule({
  recommendation:
    "Use Set or Map for repeated membership and lookup checks instead of scanning arrays repeatedly.",
  examples: [
    {
      before: `selectedIds.includes(item.id);`,
      after: `selectedIdSet.has(item.id);`,
    },
  ],
  create: (context) =>
    createLoopAwareVisitors({
      CallExpression(node) {
        if (
          !isNodeOfType(node.callee, "MemberExpression") ||
          !isNodeOfType(node.callee.property, "Identifier")
        )
          return;
        const methodName = node.callee.property.name;
        if (methodName !== "includes" && methodName !== "indexOf") return;
        if (isLikelyStringReceiver(node.callee.object)) return;
        if (
          isNodeOfType(node.callee.object, "ArrayExpression") &&
          (node.callee.object.elements?.length ?? 0) < 8
        )
          return;
        context.report({
          node,
          message: `array.${methodName}() in a loop is O(n) per call - convert to a Set for O(1) lookups`,
        });
      },
    }),
});
//#endregion
//#region src/core/rules/lint/performance/js-tosorted-immutable.ts
const jsTosortedImmutable = defineRule({
  recommendation:
    "Use toSorted for immutable sorting instead of cloning and mutating arrays with sort.",
  examples: [
    {
      before: `items.sort(sortByName);`,
      after: `const sortedItems = items.toSorted(sortByName);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isMemberProperty(node.callee, "sort")) return;
      const receiver = node.callee.object;
      if (
        isNodeOfType(receiver, "ArrayExpression") &&
        receiver.elements?.length === 1 &&
        isNodeOfType(receiver.elements[0], "SpreadElement")
      )
        context.report({
          node,
          message: "[...array].sort() - use array.toSorted() for immutable sorting (ES2023)",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/i18n/utils/translation-component-names.ts
const TRANSLATION_COMPONENT_NAMES = new Set(["FormattedMessage", "I18n", "Trans", "Translate"]);
//#endregion
//#region src/core/rules/lint/i18n/utils/non-user-text-elements.ts
const NON_USER_TEXT_ELEMENTS = new Set(["code", "kbd", "pre", "script", "style", "textarea"]);
//#endregion
//#region src/core/rules/lint/i18n/utils/translation-hook-names.ts
const TRANSLATION_HOOK_NAMES = new Set(["useTranslations", "useTranslation"]);
//#endregion
//#region src/core/rules/lint/i18n/utils/translation-function-names.ts
const TRANSLATION_FUNCTION_NAMES = new Set(["t", "i18n.t"]);
//#endregion
//#region src/core/rules/lint/i18n/utils/is-inside-ignored-text-element.ts
const isInsideIgnoredTextElement = (node) => {
  let currentNode = node.parent;
  while (currentNode) {
    if (isNodeOfType(currentNode, "JSXElement")) {
      const elementName = getJsxName$2(currentNode.openingElement?.name);
      if (elementName && TRANSLATION_COMPONENT_NAMES.has(elementName)) return true;
      if (elementName && NON_USER_TEXT_ELEMENTS.has(elementName)) return true;
    }
    currentNode = currentNode.parent;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/i18n/utils/has-letters.ts
const hasLetters = (value) => /[A-Za-z]/.test(value);
//#endregion
//#region src/core/rules/lint/i18n/i18n-no-dynamic-translation-key.ts
const I18N_IMPORT_SOURCES = new Set(["i18next", "next-intl", "react-i18next"]);
const isStaticKey = (node) => isNodeOfType(node, "Literal") && typeof node.value === "string";
const i18nNoDynamicTranslationKey = defineRule({
  recommendation:
    "Use literal translation keys so extraction, type generation, and missing-key checks can see every message; map dynamic state to explicit keys before calling t().",
  examples: [
    {
      before: "t(`errors.${code}`)",
      after: `code === "required" ? t("errors.required") : t("errors.unknown")`,
    },
  ],
  create: (context) => {
    const translationFunctionNames = new Set(TRANSLATION_FUNCTION_NAMES);
    const translationHookNames = new Set(TRANSLATION_HOOK_NAMES);
    return {
      ImportDeclaration(node) {
        if (!I18N_IMPORT_SOURCES.has(getImportSourceValue(node) ?? "")) return;
        for (const specifier of node.specifiers ?? []) {
          const importedName = getImportedName(specifier);
          const localName = getLocalName(specifier);
          if (!localName) continue;
          if (importedName && TRANSLATION_HOOK_NAMES.has(importedName))
            translationHookNames.add(localName);
          if (importedName === "t") translationFunctionNames.add(localName);
        }
      },
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        if (!isNodeOfType(node.init, "CallExpression")) return;
        const calleeName = isNodeOfType(node.init.callee, "Identifier")
          ? node.init.callee.name
          : null;
        if (!calleeName || !translationHookNames.has(calleeName)) return;
        translationFunctionNames.add(node.id.name);
      },
      CallExpression(node) {
        if (
          !isNodeOfType(node.callee, "Identifier") ||
          !translationFunctionNames.has(node.callee.name)
        )
          return;
        if (isStaticKey(node.arguments?.[0])) return;
        context.report({
          node: node.arguments?.[0] ?? node,
          message:
            "translation key is dynamic - use a literal key or an explicit map of possible keys",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/i18n/i18n-no-literal-jsx-text.ts
const i18nNoLiteralJsxText = defineRule({
  recommendation:
    "Move user-facing JSX copy through next-intl, i18next, or the project translation layer; do not hide untranslated text by wrapping it in spans.",
  examples: [
    {
      before: `<button>Save changes</button>`,
      after: `<button>{t("actions.saveChanges")}</button>`,
    },
  ],
  create: (context) => ({
    JSXText(node) {
      const text = typeof node.value === "string" ? node.value.trim() : "";
      if (!text || !hasLetters(text)) return;
      if (isInsideIgnoredTextElement(node)) return;
      context.report({
        node,
        message: `literal JSX text "${text}" is user-facing copy - read it from the translation layer`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/mobx/utils/mobx-react-import-sources.ts
const MOBX_REACT_IMPORT_SOURCES = new Set(["mobx-react", "mobx-react-lite"]);
//#endregion
//#region src/core/rules/lint/mobx/mobx-observer-named-component.ts
const isAnonymousComponent = (node) =>
  (isNodeOfType(node, "ArrowFunctionExpression") || isNodeOfType(node, "FunctionExpression")) &&
  !node.id?.name;
const mobxObserverNamedComponent = defineRule({
  recommendation:
    "Pass a named function to MobX observer so React DevTools, stack traces, and hooks linting retain a real component boundary.",
  examples: [
    {
      before: `export const UserCard = observer(() => <div>{store.name}</div>);`,
      after: `export const UserCard = observer(function UserCard() { return <div>{store.name}</div>; });`,
    },
  ],
  create: (context) => {
    const observerNames = /* @__PURE__ */ new Set();
    return {
      ImportDeclaration(node) {
        if (!MOBX_REACT_IMPORT_SOURCES.has(getImportSourceValue(node) ?? "")) return;
        for (const specifier of node.specifiers ?? []) {
          if (getImportedName(specifier) !== "observer") continue;
          const localName = getLocalName(specifier);
          if (localName) observerNames.add(localName);
        }
      },
      CallExpression(node) {
        if (!isNodeOfType(node.callee, "Identifier") || !observerNames.has(node.callee.name))
          return;
        const componentArgument = node.arguments?.[0];
        if (!isAnonymousComponent(componentArgument)) return;
        context.report({
          node: componentArgument,
          message:
            "observer() wraps an anonymous component - use a named function so MobX components remain debuggable",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/motion-no-hover-transform-on-target.ts
const HOVER_TARGET_TRANSFORM_PATTERN = /(?:^|\s)hover:(?:-?translate-[xy]|scale|rotate)-/;
const getJsxElementName$1 = (openingElement) => {
  if (isNodeOfType(openingElement.name, "JSXIdentifier")) return openingElement.name.name;
  if (
    isNodeOfType(openingElement.name, "JSXMemberExpression") &&
    isNodeOfType(openingElement.name.property, "JSXIdentifier")
  )
    return openingElement.name.property.name;
  return null;
};
const isInteractiveOrCardLike = (openingElement, classNameValue) => {
  const elementName = getJsxElementName$1(openingElement);
  if (
    elementName === "button" ||
    elementName === "a" ||
    elementName === "Button" ||
    elementName === "Card"
  )
    return true;
  if (findJsxAttribute(openingElement.attributes ?? [], "onClick")) return true;
  return /(?:^|\s)(?:cursor-pointer|rounded|border|shadow|ring-|bg-card)(?:\s|$)/.test(
    classNameValue,
  );
};
const motionNoHoverTransformOnTarget = defineRule({
  recommendation:
    "Do not move the hovered hit target itself with hover:translate, hover:scale, or hover:rotate; keep the target stationary and animate a child with group-hover.",
  examples: [
    {
      before: `<button className="hover:scale-105 transition-transform">Open</button>`,
      after: `<button className="group"><span className="transition-transform group-hover:scale-105">Open</span></button>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const classAttribute = findJsxAttribute(node.attributes ?? [], "className");
      if (!classAttribute) return;
      const classNameValue = getStringFromClassNameAttr(node);
      if (!classNameValue || !HOVER_TARGET_TRANSFORM_PATTERN.test(classNameValue)) return;
      if (!isInteractiveOrCardLike(node, classNameValue)) return;
      context.report({
        node: classAttribute,
        message:
          "hover transform moves the pointer target and can cause flicker - keep the target stationary and animate a child with group-hover",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/motion-no-motion-in-lazymotion-strict.ts
const isTruthyJsxAttribute = (attribute) => {
  if (!attribute) return false;
  if (!attribute.value) return true;
  if (isNodeOfType(attribute.value, "Literal")) return attribute.value.value !== false;
  const expression = attribute.value.expression;
  if (isNodeOfType(expression, "Literal")) return expression.value !== false;
  return Boolean(expression);
};
const getJsxName$1 = (node) => {
  if (!node) return null;
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXMemberExpression")) {
    const objectName = getJsxName$1(node.object);
    const propertyName = getJsxName$1(node.property);
    return objectName && propertyName ? `${objectName}.${propertyName}` : propertyName;
  }
  return null;
};
const motionNoMotionInLazyMotionStrict = defineRule({
  recommendation:
    "Inside LazyMotion strict mode, render motion elements through the lightweight m namespace so the full Motion feature bundle cannot leak back in.",
  examples: [
    {
      before: `<LazyMotion strict features={domAnimation}><motion.div animate={{ opacity: 1 }} /></LazyMotion>`,
      after: `<LazyMotion strict features={domAnimation}><m.div animate={{ opacity: 1 }} /></LazyMotion>`,
    },
  ],
  create: (context) => {
    let lazyMotionStrictDepth = 0;
    return {
      JSXElement(node) {
        const openingElement = node.openingElement;
        const elementName = getJsxName$1(openingElement?.name);
        if (elementName === "LazyMotion") {
          if (isTruthyJsxAttribute(findJsxAttribute(openingElement.attributes ?? [], "strict")))
            lazyMotionStrictDepth++;
          return;
        }
        if (lazyMotionStrictDepth === 0) return;
        if (!elementName?.startsWith("motion.")) return;
        context.report({
          node: openingElement,
          message:
            "motion.* used inside <LazyMotion strict> - use m.* so strict mode can enforce the reduced bundle",
        });
      },
      "JSXElement:exit"(node) {
        if (getJsxName$1(node.openingElement?.name) !== "LazyMotion") return;
        if (isTruthyJsxAttribute(findJsxAttribute(node.openingElement.attributes ?? [], "strict")))
          lazyMotionStrictDepth = Math.max(0, lazyMotionStrictDepth - 1);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/utils/describe-client-side-navigation.ts
const describeClientSideNavigation = (node, isPagesRouterFile) => {
  const redirectGuidance = isPagesRouterFile
    ? "handle navigation in an event handler, getServerSideProps redirect, or middleware"
    : "use redirect() from next/navigation or handle navigation in an event handler";
  if (isNodeOfType(node, "CallExpression") && isNodeOfType(node.callee, "MemberExpression")) {
    const objectName = isNodeOfType(node.callee.object, "Identifier")
      ? node.callee.object.name
      : null;
    const methodName = isNodeOfType(node.callee.property, "Identifier")
      ? node.callee.property.name
      : null;
    if (objectName === "router" && (methodName === "push" || methodName === "replace"))
      return `router.${methodName}() in useEffect - ${redirectGuidance}`;
  }
  if (isNodeOfType(node, "AssignmentExpression") && isNodeOfType(node.left, "MemberExpression")) {
    const objectName = isNodeOfType(node.left.object, "Identifier") ? node.left.object.name : null;
    const propertyName = isNodeOfType(node.left.property, "Identifier")
      ? node.left.property.name
      : null;
    if (objectName === "window" && propertyName === "location")
      return `window.location assignment in useEffect - ${redirectGuidance}`;
    if (objectName === "location" && propertyName === "href")
      return `location.href assignment in useEffect - ${redirectGuidance}`;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/nextjs/utils/extract-mutating-route-segment.ts
const extractMutatingRouteSegment = (filename) => {
  const segments = filename.split("/");
  for (const segment of segments) {
    const cleaned = segment.replace(/^\[.*\]$/, "");
    if (MUTATING_ROUTE_SEGMENTS.has(cleaned)) return cleaned;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/nextjs/utils/file-mentions-suspense.ts
const fileMentionsSuspense = (programNode) => {
  let didSee = false;
  walkAst(programNode, (child) => {
    if (didSee) return false;
    if (
      isNodeOfType(child, "JSXOpeningElement") &&
      isNodeOfType(child.name, "JSXIdentifier") &&
      child.name.name === "Suspense"
    ) {
      didSee = true;
      return false;
    }
    if (isNodeOfType(child, "ImportDeclaration") && child.source?.value === "react") {
      if (
        (child.specifiers ?? []).some(
          (specifier) =>
            isNodeOfType(specifier, "ImportSpecifier") && specifier.imported?.name === "Suspense",
        )
      ) {
        didSee = true;
        return false;
      }
    }
  });
  return didSee;
};
//#endregion
//#region src/core/rules/lint/nextjs/utils/get-exported-get-handler-body.ts
const getExportedGetHandlerBody = (node) => {
  if (!isNodeOfType(node, "ExportNamedDeclaration")) return null;
  const declaration = node.declaration;
  if (!declaration) return null;
  if (isNodeOfType(declaration, "FunctionDeclaration") && declaration.id?.name === "GET")
    return declaration.body;
  if (isNodeOfType(declaration, "VariableDeclaration")) {
    for (const declarator of declaration.declarations ?? [])
      if (
        isNodeOfType(declarator.id, "Identifier") &&
        declarator.id.name === "GET" &&
        declarator.init &&
        (isNodeOfType(declarator.init, "ArrowFunctionExpression") ||
          isNodeOfType(declarator.init, "FunctionExpression"))
      )
        return declarator.init.body;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-async-client-component.ts
const nextjsAsyncClientComponent = defineRule({
  recommendation:
    "Keep Client Components synchronous and move async data loading to Server Components, loaders, or client data hooks.",
  examples: [
    {
      before: `"use client";
export default async function Page() {}`,
      after: `export default function Page() {}`,
    },
  ],
  create: (context) => {
    let fileHasUseClient = false;
    return {
      Program(programNode) {
        fileHasUseClient = hasDirective(programNode, "use client");
      },
      FunctionDeclaration(node) {
        if (!fileHasUseClient || !node.async) return;
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        context.report({
          node,
          message: `Async client component "${node.id.name}" - client components cannot be async`,
        });
      },
      VariableDeclarator(node) {
        if (!fileHasUseClient) return;
        if (!isComponentAssignment(node) || !node.init?.async) return;
        context.report({
          node,
          message: `Async client component "${node.id.name}" - client components cannot be async`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-image-missing-sizes.ts
const nextjsImageMissingSizes = defineRule({
  recommendation:
    "Provide width and height or fill plus sizes on Next.js images so layout and responsive image selection are stable.",
  examples: [
    {
      before: `<Image src="/hero.png" alt="Hero" />`,
      after: `<Image src="/hero.png" alt="Hero" width={1200} height={800} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "Image") return;
      const attributes = node.attributes ?? [];
      if (!hasJsxAttribute(attributes, "fill")) return;
      if (hasJsxAttribute(attributes, "sizes")) return;
      context.report({
        node,
        message:
          "next/image with fill but no sizes - the browser downloads the largest image. Add a sizes attribute for responsive behavior",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-inline-script-missing-id.ts
const nextjsInlineScriptMissingId = defineRule({
  recommendation:
    "Add a stable id to inline Next.js Script blocks so Next.js can track and dedupe them.",
  examples: [
    {
      before: `<Script>{\`window.x = 1\`}<\/Script>`,
      after: `<Script id="bootstrap-x">{\`window.x = 1\`}<\/Script>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "Script") return;
      const attributes = node.attributes ?? [];
      if (hasJsxAttribute(attributes, "src")) return;
      if (hasJsxAttribute(attributes, "id")) return;
      context.report({
        node,
        message:
          "Inline <Script> without id - Next.js requires an id attribute to track inline scripts",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-missing-metadata.ts
const nextjsMissingMetadata = defineRule({
  recommendation:
    "Export metadata or generateMetadata from App Router pages and layouts so titles and descriptions are defined server-side.",
  examples: [
    {
      before: `export default function Page() {}`,
      after: `export const metadata = { title: "Dashboard" };`,
    },
  ],
  create: (context) => ({
    Program(programNode) {
      const filename = context.getFilename?.() ?? "";
      if (!PAGE_FILE_PATTERN.test(filename)) return;
      if (INTERNAL_PAGE_PATH_PATTERN.test(filename)) return;
      if (NON_SEO_PAGE_PATTERN.test(filename)) return;
      if (
        !programNode.body?.some((statement) => {
          if (!isNodeOfType(statement, "ExportNamedDeclaration")) return false;
          const declaration = statement.declaration;
          if (isNodeOfType(declaration, "VariableDeclaration"))
            return declaration.declarations?.some(
              (declarator) =>
                isNodeOfType(declarator.id, "Identifier") &&
                (declarator.id.name === "metadata" || declarator.id.name === "generateMetadata"),
            );
          if (isNodeOfType(declaration, "FunctionDeclaration"))
            return declaration.id?.name === "generateMetadata";
          return false;
        })
      )
        context.report({
          node: programNode,
          message: "Page without metadata or generateMetadata export - hurts SEO",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-a-element.ts
const nextjsNoAElement = defineRule({
  recommendation:
    "Use next/link for internal navigation so Next.js can prefetch and preserve client-side routing behavior.",
  examples: [
    {
      before: `<a href="/settings">Settings</a>`,
      after: `<Link href="/settings">Settings</Link>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "a") return;
      const hrefAttribute = findJsxAttribute(node.attributes ?? [], "href");
      if (!hrefAttribute?.value) return;
      let hrefValue = null;
      if (isNodeOfType(hrefAttribute.value, "Literal")) hrefValue = hrefAttribute.value.value;
      else if (
        isNodeOfType(hrefAttribute.value, "JSXExpressionContainer") &&
        isNodeOfType(hrefAttribute.value.expression, "Literal")
      )
        hrefValue = hrefAttribute.value.expression.value;
      if (typeof hrefValue === "string" && hrefValue.startsWith("/"))
        context.report({
          node,
          message:
            "Use next/link instead of <a> for internal links - enables client-side navigation and prefetching",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-client-fetch-for-server-data.ts
const nextjsNoClientFetchForServerData = defineRule({
  recommendation:
    "Fetch server-owned data in Server Components or route loaders instead of fetching it from Client Component effects.",
  examples: [
    {
      before: `"use client";
useEffect(() => fetch("/api/posts"), []);`,
      after: `const posts = await getPosts();
<ClientPosts posts={posts} />`,
    },
  ],
  create: (context) => {
    let fileHasUseClient = false;
    return {
      Program(programNode) {
        fileHasUseClient = hasDirective(programNode, "use client");
      },
      CallExpression(node) {
        if (!fileHasUseClient || !isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const callback = getEffectCallback(node);
        if (!callback || !containsFetchCall(callback)) return;
        const filename = context.getFilename?.() ?? "";
        if (PAGE_OR_LAYOUT_FILE_PATTERN.test(filename) || PAGES_DIRECTORY_PATTERN.test(filename))
          context.report({
            node,
            message:
              "useEffect + fetch in a page/layout - fetch data server-side with a server component instead",
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-client-side-redirect.ts
const nextjsNoClientSideRedirect = defineRule({
  recommendation:
    "Use redirect from a Server Component, server action, or route handler when navigation is decided by server data.",
  examples: [
    {
      before: `useEffect(() => { if (!user) router.replace("/login"); }, [user]);`,
      after: `if (!user) redirect("/login");`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isPagesRouterFile = PAGES_DIRECTORY_PATTERN.test(filename);
    return {
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
        const callback = getEffectCallback(node);
        if (!callback) return;
        walkAst(callback, (child) => {
          const navigationDescription = describeClientSideNavigation(child, isPagesRouterFile);
          if (navigationDescription)
            context.report({
              node: child,
              message: navigationDescription,
            });
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-css-link.ts
const nextjsNoCssLink = defineRule({
  recommendation:
    "Import CSS through Next.js-supported CSS files or modules instead of adding stylesheet link tags in components.",
  examples: [
    {
      before: `<link rel="stylesheet" href="/styles.css" />`,
      after: `import "./styles.css";`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "link") return;
      const attributes = node.attributes ?? [];
      const relAttribute = findJsxAttribute(attributes, "rel");
      if (!relAttribute?.value) return;
      if (
        (isNodeOfType(relAttribute.value, "Literal") ? relAttribute.value.value : null) !==
        "stylesheet"
      )
        return;
      const hrefAttribute = findJsxAttribute(attributes, "href");
      if (!hrefAttribute?.value) return;
      const hrefValue = isNodeOfType(hrefAttribute.value, "Literal")
        ? hrefAttribute.value.value
        : null;
      if (typeof hrefValue === "string" && GOOGLE_FONTS_PATTERN.test(hrefValue)) return;
      context.report({
        node,
        message: '<link rel="stylesheet"> tag - import CSS directly for bundling and optimization',
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-font-link.ts
const nextjsNoFontLink = defineRule({
  recommendation:
    "Use next/font for local or Google fonts instead of link tags so fonts are optimized and self-hosted.",
  examples: [
    {
      before: `<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />`,
      after: `const inter = Inter({ subsets: ["latin"] });`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "link") return;
      const hrefAttribute = findJsxAttribute(node.attributes ?? [], "href");
      if (!hrefAttribute?.value) return;
      const hrefValue = isNodeOfType(hrefAttribute.value, "Literal")
        ? hrefAttribute.value.value
        : null;
      if (typeof hrefValue === "string" && GOOGLE_FONTS_PATTERN.test(hrefValue))
        context.report({
          node,
          message:
            "Loading Google Fonts via <link> - use next/font instead for self-hosting, zero layout shift, and no render-blocking requests",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-head-import.ts
const nextjsNoHeadImport = defineRule({
  recommendation:
    "Use the App Router metadata API or next/head in Pages Router only; do not import next/head in App Router files.",
  examples: [
    {
      before: `import Head from "next/head";`,
      after: `export const metadata = { title: "Home" };`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "next/head") return;
      const filename = context.getFilename?.() ?? "";
      if (!APP_DIRECTORY_PATTERN.test(filename)) return;
      context.report({
        node,
        message: "next/head is not supported in the App Router - use the Metadata API instead",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-img-element.ts
const nextjsNoImgElement = defineRule({
  recommendation:
    "Use next/image for images so sizing, optimization, lazy loading, and responsive formats are handled by Next.js.",
  examples: [
    {
      before: `<img src="/hero.png" alt="Hero" />`,
      after: `<Image src="/hero.png" alt="Hero" width={1200} height={800} />`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isOgImageFile = OG_ROUTE_PATTERN.test(filename) || OG_IMAGE_FILE_PATTERN$1.test(filename);
    return {
      JSXOpeningElement(node) {
        if (isOgImageFile) return;
        if (isNodeOfType(node.name, "JSXIdentifier") && node.name.name === "img")
          context.report({
            node,
            message:
              "Use next/image instead of <img> - provides automatic optimization, lazy loading, and responsive srcset",
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-native-script.ts
const nextjsNoNativeScript = defineRule({
  recommendation:
    "Use next/script with an explicit loading strategy instead of raw script tags for third-party and inline scripts.",
  examples: [
    {
      before: `<script src="/widget.js" />`,
      after: `<Script src="/widget.js" strategy="afterInteractive" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "script") return;
      const typeAttribute = findJsxAttribute(node.attributes ?? [], "type");
      const typeValue = isNodeOfType(typeAttribute?.value, "Literal")
        ? typeAttribute.value.value
        : null;
      if (typeof typeValue === "string" && !EXECUTABLE_SCRIPT_TYPES.has(typeValue)) return;
      context.report({
        node,
        message:
          "Use next/script <Script> instead of <script> - provides loading strategy optimization and deferred loading",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-polyfill-script.ts
const nextjsNoPolyfillScript = defineRule({
  recommendation:
    "Remove legacy polyfill scripts unless the supported browser matrix still requires them, and load needed polyfills selectively.",
  examples: [
    {
      before: `<script src="/polyfills/legacy.js" />`,
      after: `import "core-js/actual/array/to-sorted";`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (node.name.name !== "script" && node.name.name !== "Script") return;
      const srcAttribute = findJsxAttribute(node.attributes ?? [], "src");
      if (!srcAttribute?.value) return;
      const srcValue = isNodeOfType(srcAttribute.value, "Literal")
        ? srcAttribute.value.value
        : null;
      if (typeof srcValue === "string" && POLYFILL_SCRIPT_PATTERN.test(srcValue))
        context.report({
          node,
          message:
            "Polyfill CDN script - Next.js includes polyfills for fetch, Promise, Object.assign, and 50+ others automatically",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-redirect-in-try-catch.ts
const nextjsNoRedirectInTryCatch = defineRule({
  recommendation:
    "Call redirect outside try/catch blocks or rethrow redirect errors so Next.js can handle the control flow.",
  examples: [
    {
      before: `try { redirect("/login"); } catch (error) { log(error); }`,
      after: `if (!user) redirect("/login");`,
    },
  ],
  create: (context) => {
    let tryCatchDepth = 0;
    return {
      TryStatement() {
        tryCatchDepth++;
      },
      "TryStatement:exit"() {
        tryCatchDepth--;
      },
      CallExpression(node) {
        if (tryCatchDepth === 0) return;
        if (!isNodeOfType(node.callee, "Identifier")) return;
        if (!NEXTJS_NAVIGATION_FUNCTIONS.has(node.callee.name)) return;
        context.report({
          node,
          message: `${node.callee.name}() inside try-catch - this throws a special error Next.js handles internally. Move it outside the try block or use unstable_rethrow() in the catch`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-side-effect-in-get-handler.ts
const nextjsNoSideEffectInGetHandler = defineRule({
  recommendation:
    "Keep GET route handlers idempotent and move mutations, logging with side effects, and writes to POST or server actions.",
  examples: [
    {
      before: `export async function GET() { await db.user.create({ data }); }`,
      after: `export async function POST() { await db.user.create({ data }); }`,
    },
  ],
  create: (context) => ({
    ExportNamedDeclaration(node) {
      const filename = context.getFilename?.() ?? "";
      if (!ROUTE_HANDLER_FILE_PATTERN.test(filename)) return;
      const handlerBody = getExportedGetHandlerBody(node);
      if (!handlerBody) return;
      const mutatingSegment = extractMutatingRouteSegment(filename);
      if (mutatingSegment) {
        context.report({
          node,
          message: `GET handler on "/${mutatingSegment}" route - use POST to prevent CSRF and unintended prefetch triggers`,
        });
        return;
      }
      const sideEffect = findSideEffect(handlerBody);
      if (sideEffect)
        context.report({
          node,
          message: `GET handler has side effects (${sideEffect}) - use POST to prevent CSRF and unintended prefetch triggers`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/nextjs/nextjs-no-use-search-params-without-suspense.ts
const nextjsNoUseSearchParamsWithoutSuspense = defineRule({
  recommendation:
    "Wrap useSearchParams usage in Suspense or move it lower in the tree so static routes can stream correctly.",
  examples: [
    {
      before: `<SearchPanel />`,
      after: `<Suspense><SearchPanel /></Suspense>`,
    },
  ],
  create: (context) => {
    let hasSuspenseInFile = false;
    return {
      Program(programNode) {
        hasSuspenseInFile = fileMentionsSuspense(programNode);
      },
      CallExpression(node) {
        if (hasSuspenseInFile) return;
        if (!isHookCall(node, "useSearchParams")) return;
        context.report({
          node,
          message:
            "useSearchParams() requires a <Suspense> boundary - without one, the entire page bails out to client-side rendering",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-aria-expanded-without-controls.ts
const isInactiveAttributeValue$1 = (attribute) => {
  if (!attribute.value) return false;
  if (isNodeOfType(attribute.value, "Literal"))
    return attribute.value.value === "false" || attribute.value.value === false;
  const expression = attribute.value.expression;
  if (isNodeOfType(expression, "Literal"))
    return expression.value === false || expression.value === null;
  return isNodeOfType(expression, "Identifier") && expression.name === "undefined";
};
const hasNonEmptyControls = (node) => {
  const ariaControls = findJsxAttribute(node.attributes ?? [], "aria-controls");
  if (!ariaControls?.value) return false;
  if (isNodeOfType(ariaControls.value, "Literal")) {
    if (ariaControls.value.value === false || ariaControls.value.value === null) return false;
    return String(ariaControls.value.value ?? "").trim().length > 0;
  }
  const expression = ariaControls.value.expression;
  if (isNodeOfType(expression, "Literal")) {
    if (expression.value === false || expression.value === null) return false;
    return String(expression.value ?? "").trim().length > 0;
  }
  if (isNodeOfType(expression, "Identifier") && expression.name === "undefined") return false;
  return Boolean(expression);
};
const noAriaExpandedWithoutControls = defineRule({
  recommendation:
    "Pair aria-expanded with aria-controls so assistive tech can identify which panel, menu, or disclosure region the control opens.",
  examples: [
    {
      before: `<button aria-expanded={isOpen}>Filters</button>`,
      after: `<button aria-expanded={isOpen} aria-controls="filters-panel">Filters</button>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const ariaExpanded = findJsxAttribute(node.attributes ?? [], "aria-expanded");
      if (!ariaExpanded || isInactiveAttributeValue$1(ariaExpanded)) return;
      if (hasNonEmptyControls(node)) return;
      context.report({
        node,
        message:
          "aria-expanded control is missing aria-controls - point it at the id of the panel or menu it toggles",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-aria-invalid-without-describedby.ts
const FORM_FIELD_NAMES = new Set(["input", "textarea", "select"]);
const isInactiveAttributeValue = (attribute) => {
  if (!attribute.value) return false;
  if (isNodeOfType(attribute.value, "Literal"))
    return attribute.value.value === "false" || attribute.value.value === false;
  const expression = attribute.value.expression;
  if (isNodeOfType(expression, "Literal"))
    return expression.value === false || expression.value === null;
  return isNodeOfType(expression, "Identifier") && expression.name === "undefined";
};
const isEmptyDescribedBy = (attribute) => {
  if (!attribute) return true;
  if (!attribute.value) return true;
  if (isNodeOfType(attribute.value, "Literal")) {
    if (attribute.value.value === false || attribute.value.value === null) return true;
    return String(attribute.value.value ?? "").trim().length === 0;
  }
  const expression = attribute.value.expression;
  if (!expression) return true;
  if (isNodeOfType(expression, "Literal")) {
    if (expression.value === false || expression.value === null) return true;
    return String(expression.value ?? "").trim().length === 0;
  }
  return isNodeOfType(expression, "Identifier") && expression.name === "undefined";
};
const noAriaInvalidWithoutDescribedby = defineRule({
  recommendation:
    "When a field is invalid, wire the visible error text to the control with aria-describedby so screen reader users hear the specific fix, not just that the field is invalid.",
  examples: [
    {
      before: `<input aria-invalid={Boolean(error)} />`,
      after: `<input aria-invalid={Boolean(error)} aria-describedby={error ? "email-error" : undefined} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = isNodeOfType(node.name, "JSXIdentifier") ? node.name.name : null;
      if (!elementName || !FORM_FIELD_NAMES.has(elementName)) return;
      const ariaInvalid = findJsxAttribute(node.attributes ?? [], "aria-invalid");
      if (!ariaInvalid || isInactiveAttributeValue(ariaInvalid)) return;
      if (!isEmptyDescribedBy(findJsxAttribute(node.attributes ?? [], "aria-describedby"))) return;
      context.report({
        node,
        message:
          "invalid form field is not connected to its error text - add aria-describedby pointing at the visible error element id",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-array-index-as-key.ts
const noArrayIndexAsKey = defineRule({
  recommendation:
    "Use a stable item id for React keys so inserts, deletes, and sorting preserve component state correctly.",
  examples: [
    {
      before: `{items.map((item, index) => <Row key={index} item={item} />)}`,
      after: `{items.map((item) => <Row key={item.id} item={item} />)}`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "key") return;
      if (!node.value || !isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const indexName = extractIndexName(node.value.expression);
      if (!indexName) return;
      if (isInsideStaticPlaceholderMap(node)) return;
      context.report({
        node,
        message: `Array index "${indexName}" used as key - causes bugs when list is reordered or filtered`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-barrel-import.ts
const noBarrelImport = defineRule({
  recommendation:
    "Import directly from source files or configure framework-level package import optimization instead of importing through large barrels.",
  examples: [
    {
      before: `import { Button } from "@ui";`,
      after: `import { Button } from "@ui/button";`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    let didReportForFile = false;
    return {
      ImportDeclaration(node) {
        if (isTestOrInfraFile) return;
        if (didReportForFile) return;
        const source = node.source?.value;
        if (typeof source !== "string" || !source.startsWith(".")) return;
        if (BARREL_INDEX_SUFFIXES.some((suffix) => source.endsWith(suffix))) {
          didReportForFile = true;
          context.report({
            node,
            message:
              "Import from barrel/index file - import directly from the source module for better tree-shaking",
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-blocked-paste.ts
const PASTEABLE_FIELD_NAMES = new Set(["input", "textarea"]);
const noBlockedPaste = defineRule({
  recommendation:
    "Do not block paste in text fields; paste is how password managers, OTP autofill, and assistive tooling enter data, so validate and explain errors instead.",
  examples: [
    {
      before: `<input onPaste={(event) => event.preventDefault()} />`,
      after: `<input autoComplete="one-time-code" inputMode="numeric" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = isNodeOfType(node.name, "JSXIdentifier") ? node.name.name : null;
      if (!elementName || !PASTEABLE_FIELD_NAMES.has(elementName)) return;
      const onPaste = findJsxAttribute(node.attributes ?? [], "onPaste");
      if (!isNodeOfType(onPaste?.value, "JSXExpressionContainer")) return;
      if (!containsPreventDefaultCall(onPaste.value.expression)) return;
      context.report({
        node,
        message:
          "input paste is blocked - validate the pasted value and show an error instead of breaking password managers, OTP autofill, and assistive tools",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-button-navigation.ts
const BUTTON_LIKE_COMPONENT_PATTERN = /Button$/;
const ROUTER_NAVIGATION_METHOD_NAMES = new Set(["navigate", "push", "replace"]);
const getJsxElementName = (node) => {
  if (isNodeOfType(node.name, "JSXIdentifier")) return node.name.name;
  if (
    isNodeOfType(node.name, "JSXMemberExpression") &&
    isNodeOfType(node.name.property, "JSXIdentifier")
  )
    return node.name.property.name;
  return null;
};
const isButtonLikeElement = (node) => {
  const elementName = getJsxElementName(node);
  return (
    elementName === "button" ||
    Boolean(elementName && BUTTON_LIKE_COMPONENT_PATTERN.test(elementName))
  );
};
const hasLinkRenderingEscape = (node) => {
  if (getJsxElementName(node) === "button") return false;
  const asChild = findJsxAttribute(node.attributes ?? [], "asChild");
  if (asChild && !asChild.value) return true;
  if (isNodeOfType(asChild?.value, "JSXExpressionContainer")) {
    const expression = asChild.value.expression;
    if (isNodeOfType(expression, "Literal") && expression.value === true) return true;
  }
  const asAttribute =
    findJsxAttribute(node.attributes ?? [], "as") ??
    findJsxAttribute(node.attributes ?? [], "component");
  if (isNodeOfType(asAttribute?.value, "Literal")) {
    const value = String(asAttribute.value.value ?? "");
    return value === "a" || value === "Link" || value === "NavLink";
  }
  const expression = isNodeOfType(asAttribute?.value, "JSXExpressionContainer")
    ? asAttribute.value.expression
    : null;
  return (
    isNodeOfType(expression, "Identifier") &&
    (expression.name === "Link" || expression.name === "NavLink")
  );
};
const isRouterNavigationCall = (node) => {
  if (!isNodeOfType(node, "CallExpression") || !isNodeOfType(node.callee, "MemberExpression"))
    return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  const methodName = node.callee.property.name;
  if (!ROUTER_NAVIGATION_METHOD_NAMES.has(methodName)) return false;
  const receiverName = getRootIdentifierName$1(node.callee.object);
  return (
    receiverName === "router" ||
    receiverName === "navigation" ||
    receiverName === "history" ||
    receiverName === "window"
  );
};
const isLocationNavigationCall = (node) => {
  if (!isNodeOfType(node, "CallExpression") || !isNodeOfType(node.callee, "MemberExpression"))
    return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  if (node.callee.property.name !== "assign" && node.callee.property.name !== "replace")
    return false;
  const receiver = node.callee.object;
  if (isNodeOfType(receiver, "Identifier") && receiver.name === "location") return true;
  return (
    isNodeOfType(receiver, "MemberExpression") &&
    isNodeOfType(receiver.object, "Identifier") &&
    receiver.object.name === "window" &&
    isNodeOfType(receiver.property, "Identifier") &&
    receiver.property.name === "location"
  );
};
const isWindowLocationAssignment = (node) =>
  isNodeOfType(node, "AssignmentExpression") &&
  ((isNodeOfType(node.left, "MemberExpression") &&
    isNodeOfType(node.left.object, "Identifier") &&
    node.left.object.name === "location") ||
    (isNodeOfType(node.left, "MemberExpression") &&
      isNodeOfType(node.left.object, "MemberExpression") &&
      isNodeOfType(node.left.object.object, "Identifier") &&
      node.left.object.object.name === "window" &&
      isNodeOfType(node.left.object.property, "Identifier") &&
      node.left.object.property.name === "location") ||
    (isNodeOfType(node.left, "MemberExpression") &&
      isNodeOfType(node.left.object, "Identifier") &&
      node.left.object.name === "window" &&
      isNodeOfType(node.left.property, "Identifier") &&
      node.left.property.name === "location"));
const containsNavigation = (node) => {
  if (!node) return false;
  let didFindNavigation = false;
  walkAst(node, (child) => {
    if (didFindNavigation) return false;
    if (
      isRouterNavigationCall(child) ||
      isLocationNavigationCall(child) ||
      isWindowLocationAssignment(child)
    ) {
      didFindNavigation = true;
      return false;
    }
  });
  return didFindNavigation;
};
const noButtonNavigation = defineRule({
  recommendation:
    "Render navigation as a real link or framework Link so users keep open-in-new-tab, previews, history, and accessibility semantics; do not make the lint green by adding ARIA to a button.",
  examples: [
    {
      before: `<button onClick={() => router.push("/settings")}>Settings</button>`,
      after: `<Link href="/settings">Settings</Link>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isButtonLikeElement(node)) return;
      if (hasLinkRenderingEscape(node)) return;
      const onClick = findJsxAttribute(node.attributes ?? [], "onClick");
      if (!isNodeOfType(onClick?.value, "JSXExpressionContainer")) return;
      if (!containsNavigation(onClick.value.expression)) return;
      context.report({
        node,
        message:
          "button onClick performs navigation - use a real link or framework Link so browser navigation affordances keep working",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-cascading-set-state.ts
const noCascadingSetState = defineRule({
  recommendation:
    "Collapse cascading effects into a single state update, reducer transition, or render-time derivation so one render does not schedule another render chain.",
  examples: [
    {
      before: `useEffect(() => setB(a + 1), [a]);
useEffect(() => setC(b + 1), [b]);`,
      after: `const b = a + 1;
const c = b + 1;`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const setStateCallCount = countSetStateCalls(callback);
      if (setStateCallCount >= 3)
        context.report({
          node,
          message: `${setStateCallCount} setState calls in a single useEffect - consider using useReducer or deriving state`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-dark-mode-glow.ts
const noDarkModeGlow = defineRule({
  recommendation:
    "Reduce or remove decorative glows in dark mode and rely on contrast, elevation, and spacing for hierarchy.",
  examples: [
    {
      before: `<div className="dark:shadow-[0_0_80px_blue]" />`,
      after: `<div className="dark:ring-1 dark:ring-white/10" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let hasDarkBackground = false;
      let shadowProperty = null;
      let shadowValue = null;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (!key) continue;
        if (key === "backgroundColor" || key === "background") {
          const value = getStylePropertyStringValue(property);
          if (value && isBackgroundDark(value)) hasDarkBackground = true;
        }
        if (key === "boxShadow") {
          shadowProperty = property;
          shadowValue = getStylePropertyStringValue(property);
        }
      }
      if (!hasDarkBackground || !shadowValue || !shadowProperty) return;
      if (hasColoredGlowShadow(shadowValue))
        context.report({
          node: shadowProperty,
          message:
            "Colored glow on dark background - the default AI-generated 'cool' look. Use subtle, purposeful lighting instead",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-default-props.ts
const noDefaultProps = defineRule({
  recommendation:
    "Use ES default parameters or default values in destructuring instead of defaultProps on function components.",
  examples: [
    {
      before: `Button.defaultProps = { size: "md" };`,
      after: `function Button({ size = "md" }) {}`,
    },
  ],
  create: (context) => ({
    AssignmentExpression(node) {
      if (node.operator !== "=") return;
      const left = node.left;
      if (!isNodeOfType(left, "MemberExpression")) return;
      if (left.computed) return;
      if (!isNodeOfType(left.property, "Identifier") || left.property.name !== "defaultProps")
        return;
      if (!isNodeOfType(left.object, "Identifier")) return;
      if (!isUppercaseName(left.object.name)) return;
      context.report({
        node: left,
        message: `${left.object.name}.defaultProps - React 19 removes \`defaultProps\` for function components and discourages it for class components. Move defaults into the destructured props parameter (e.g. \`function ${left.object.name}({ size = "md", ...rest })\`) so the rule applies cleanly to both shapes`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-derived-state-effect.ts
const noDerivedStateEffect = defineRule({
  recommendation:
    "Derive values during render or memoize expensive derivations with useMemo instead of copying them into state from an effect.",
  examples: [
    {
      before: `useEffect(() => setFullName(\`\${first} \${last}\`), [first, last]);`,
      after: `const fullName = \`\${first} \${last}\`;`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES) || (node.arguments?.length ?? 0) < 2) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const depsNode = node.arguments[1];
      if (!isNodeOfType(depsNode, "ArrayExpression") || !depsNode.elements?.length) return;
      const dependencyNames = new Set(
        depsNode.elements
          .filter((element) => isNodeOfType(element, "Identifier"))
          .map((element) => element.name),
      );
      if (dependencyNames.size === 0) return;
      const statements = getCallbackStatements(callback);
      if (statements.length === 0) return;
      if (
        !statements.every((statement) => {
          if (!isNodeOfType(statement, "ExpressionStatement")) return false;
          return isSetterCall(statement.expression);
        })
      )
        return;
      let allArgumentsDeriveFromDeps = true;
      let hasAnyDependencyReference = false;
      let hasExpensiveDerivation = false;
      for (const statement of statements) {
        const setStateArguments = statement.expression.arguments;
        if (!setStateArguments?.length) continue;
        const valueIdentifierNames = [];
        collectValueIdentifierNames(setStateArguments[0], valueIdentifierNames);
        walkAst(setStateArguments[0], (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (isNodeOfType(child.callee, "MemberExpression")) {
            const rootName = getRootIdentifierName$1(child.callee);
            if (rootName && BUILTIN_GLOBAL_NAMESPACE_NAMES.has(rootName)) return;
            hasExpensiveDerivation = true;
            return;
          }
          if (isNodeOfType(child.callee, "Identifier")) {
            const calleeName = child.callee.name;
            if (!TRIVIAL_DERIVATION_CALLEE_NAMES.has(calleeName) && !isSetterIdentifier(calleeName))
              hasExpensiveDerivation = true;
          }
        });
        const nonSetterIdentifiers = valueIdentifierNames.filter(
          (name) => !isSetterIdentifier(name),
        );
        if (nonSetterIdentifiers.some((name) => dependencyNames.has(name)))
          hasAnyDependencyReference = true;
        if (nonSetterIdentifiers.some((name) => !dependencyNames.has(name))) {
          allArgumentsDeriveFromDeps = false;
          break;
        }
      }
      if (!allArgumentsDeriveFromDeps) return;
      if (hasExpensiveDerivation) hasAnyDependencyReference = true;
      let message;
      if (!hasAnyDependencyReference)
        message =
          "State reset in useEffect - use a key prop to reset component state when props change";
      else if (hasExpensiveDerivation)
        message =
          "Derived state in useEffect - wrap the calculation in useMemo([deps]) (or compute it directly during render if it isn't expensive)";
      else message = "Derived state in useEffect - compute during render instead";
      context.report({
        node,
        message,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-derived-usestate.ts
const noDerivedUseState = defineRule({
  recommendation:
    "Initialize state only for truly mutable local state; derive props and computed values directly during render or with useMemo.",
  examples: [
    {
      before: `const [fullName] = useState(\`\${first} \${last}\`);`,
      after: `const fullName = \`\${first} \${last}\`;`,
    },
  ],
  create: (context) => {
    const propStackTracker = createComponentPropStackTracker();
    return {
      ...propStackTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, "useState") || !node.arguments?.length) return;
        const initializer = node.arguments[0];
        if (
          isNodeOfType(initializer, "Identifier") &&
          propStackTracker.isPropName(initializer.name)
        ) {
          context.report({
            node,
            message: `useState initialized from prop "${initializer.name}" - if this value should stay in sync with the prop, derive it during render instead`,
          });
          return;
        }
        if (isNodeOfType(initializer, "MemberExpression") && !initializer.computed) {
          const rootIdentifierName = getRootIdentifierName$1(initializer);
          if (rootIdentifierName && propStackTracker.isPropName(rootIdentifierName))
            context.report({
              node,
              message: `useState initialized from prop "${rootIdentifierName}" - if this value should stay in sync with the prop, derive it during render instead`,
            });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-direct-state-mutation.ts
const noDirectStateMutation = defineRule({
  recommendation:
    "Create a new object or array when updating state and pass it to the setter instead of mutating the existing state reference.",
  examples: [
    {
      before: `items.push(next);
setItems(items);`,
      after: `setItems([...items, next]);`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const bindings = collectUseStateBindings(componentBody);
      if (bindings.length === 0) return;
      const stateValueToSetter = /* @__PURE__ */ new Map();
      for (const binding of bindings) stateValueToSetter.set(binding.valueName, binding.setterName);
      walkComponentRespectingShadows(
        componentBody,
        /* @__PURE__ */ new Set(),
        (child, currentlyShadowed) => {
          if (isNodeOfType(child, "AssignmentExpression")) {
            if (!isNodeOfType(child.left, "MemberExpression")) return;
            const rootName = getRootIdentifierName$1(child.left);
            if (!rootName || !stateValueToSetter.has(rootName)) return;
            if (currentlyShadowed.has(rootName)) return;
            const setterName = stateValueToSetter.get(rootName);
            context.report({
              node: child,
              message: `Direct property assignment on useState value "${rootName}" - call ${setterName} with a new value; React only re-renders on a new reference`,
            });
            return;
          }
          if (isNodeOfType(child, "CallExpression")) {
            const callee = child.callee;
            if (!isNodeOfType(callee, "MemberExpression")) return;
            if (!isNodeOfType(callee.property, "Identifier")) return;
            const methodName = callee.property.name;
            if (!MUTATING_ARRAY_METHODS.has(methodName)) return;
            const rootName = getRootIdentifierName$1(callee.object);
            if (!rootName || !stateValueToSetter.has(rootName)) return;
            if (currentlyShadowed.has(rootName)) return;
            const setterName = stateValueToSetter.get(rootName);
            context.report({
              node: child,
              message: `In-place mutation of useState value "${rootName}" via .${methodName}() - call ${setterName} with a new array; React only re-renders on a new reference`,
            });
          }
        },
      );
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/design/no-disabled-zoom.ts
const noDisabledZoom = defineRule({
  recommendation:
    "Allow pinch zoom by removing user-scalable=no and restrictive maximum-scale values.",
  examples: [
    {
      before: `<meta name="viewport" content="user-scalable=no" />`,
      after: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "meta") return;
      const nameAttr = findJsxAttribute(node.attributes ?? [], "name");
      if (!nameAttr?.value) return;
      if ((isNodeOfType(nameAttr.value, "Literal") ? nameAttr.value.value : null) !== "viewport")
        return;
      const contentAttr = findJsxAttribute(node.attributes ?? [], "content");
      if (!contentAttr?.value) return;
      const contentValue =
        isNodeOfType(contentAttr.value, "Literal") && typeof contentAttr.value.value === "string"
          ? contentAttr.value.value
          : null;
      if (!contentValue) return;
      const hasUserScalableNo = /user-scalable\s*=\s*no/i.test(contentValue);
      const maxScaleMatch = contentValue.match(/maximum-scale\s*=\s*([\d.]+)/i);
      const hasRestrictiveMaxScale = maxScaleMatch !== null && parseFloat(maxScaleMatch[1]) < 2;
      if (hasUserScalableNo && hasRestrictiveMaxScale)
        context.report({
          node,
          message: `user-scalable=no and maximum-scale=${maxScaleMatch[1]} disable pinch-to-zoom - this is an accessibility violation (WCAG 1.4.4). Remove both and fix layout if it breaks at 200% zoom`,
        });
      else if (hasUserScalableNo)
        context.report({
          node,
          message:
            "user-scalable=no disables pinch-to-zoom - this is an accessibility violation (WCAG 1.4.4). Remove it and fix layout if it breaks at 200% zoom",
        });
      else if (hasRestrictiveMaxScale)
        context.report({
          node,
          message: `maximum-scale=${maxScaleMatch[1]} restricts zoom below 200% - this is an accessibility violation (WCAG 1.4.4). Use maximum-scale=5 or remove it`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-document-start-view-transition.ts
const noDocumentStartViewTransition = defineRule({
  recommendation:
    "Start view transitions from user-triggered navigation or state changes instead of calling document.startViewTransition during render or mount.",
  examples: [
    {
      before: `document.startViewTransition(() => setOpen(true));`,
      after: `button.onclick = () => document.startViewTransition(() => setOpen(true));`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const callee = node.callee;
      if (!isNodeOfType(callee, "MemberExpression")) return;
      if (!isNodeOfType(callee.object, "Identifier") || callee.object.name !== "document") return;
      if (
        !isNodeOfType(callee.property, "Identifier") ||
        callee.property.name !== "startViewTransition"
      )
        return;
      context.report({
        node,
        message:
          "document.startViewTransition() bypasses React's <ViewTransition> integration - render a <ViewTransition> component and let React drive the transition (around startTransition / useDeferredValue / Suspense)",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-dynamic-import-path.ts
const noDynamicImportPath = defineRule({
  recommendation:
    "Use static dynamic import specifiers or an explicit import map so bundlers can split and prefetch chunks safely.",
  examples: [
    {
      before: `import(\`./widgets/\${name}.tsx\`);`,
      after: `const widgets = { chart: () => import("./widgets/chart") };`,
    },
  ],
  create: (context) => ({
    ImportExpression(node) {
      const source = node.source;
      if (source && !isNodeOfType(source, "Literal") && !isNodeOfType(source, "TemplateLiteral")) {
        context.report({
          node,
          message:
            "Dynamic import path is not statically analyzable - use a string literal so the bundler can split this chunk",
        });
        return;
      }
      if (isNodeOfType(source, "TemplateLiteral") && (source.expressions?.length ?? 0) > 0)
        context.report({
          node,
          message:
            "Template literal with interpolation in dynamic import - use a string literal so the bundler can split this chunk",
        });
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "require") return;
      const argument = node.arguments?.[0];
      if (!argument) return;
      if (!isNodeOfType(argument, "Literal") && !isNodeOfType(argument, "TemplateLiteral")) {
        context.report({
          node,
          message:
            "Dynamic require() path is not statically analyzable - use a string literal so the bundler can trace this dependency",
        });
        return;
      }
      if (isNodeOfType(argument, "TemplateLiteral") && (argument.expressions?.length ?? 0) > 0)
        context.report({
          node,
          message:
            "Template literal with interpolation in require() - use a string literal so the bundler can trace this dependency",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-effect-chain.ts
const noEffectChain = defineRule({
  recommendation:
    "Merge dependent effects or derive intermediate values during render so updates flow from data, not from effect-to-effect state relays.",
  examples: [
    {
      before: `useEffect(() => setFiltered(filter(items)), [items]);
useEffect(() => setCount(filtered.length), [filtered]);`,
      after: `const filtered = filter(items);
const count = filtered.length;`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const useStateBindings = collectUseStateBindings(componentBody);
      if (useStateBindings.length === 0) return;
      const setterToStateName = /* @__PURE__ */ new Map();
      for (const binding of useStateBindings)
        setterToStateName.set(binding.setterName, binding.valueName);
      const effectInfos = [];
      for (const effectCall of findTopLevelEffectCalls(componentBody)) {
        const callback = getEffectCallback(effectCall);
        if (!callback) continue;
        effectInfos.push({
          node: effectCall,
          depNames: collectDepIdentifierNames(effectCall),
          writtenStateNames: collectWrittenStateNamesInEffect(callback, setterToStateName),
          isExternalSync: isExternalSyncEffect(callback),
        });
      }
      if (effectInfos.length < 2) return;
      const reportedNodes = /* @__PURE__ */ new Set();
      for (const writerEffect of effectInfos) {
        if (writerEffect.isExternalSync) continue;
        if (writerEffect.writtenStateNames.size === 0) continue;
        for (const readerEffect of effectInfos) {
          if (readerEffect === writerEffect) continue;
          if (readerEffect.isExternalSync) continue;
          if (readerEffect.depNames.size === 0) continue;
          let chainedStateName = null;
          for (const writtenName of writerEffect.writtenStateNames)
            if (readerEffect.depNames.has(writtenName)) {
              chainedStateName = writtenName;
              break;
            }
          if (!chainedStateName) continue;
          if (reportedNodes.has(readerEffect.node)) continue;
          reportedNodes.add(readerEffect.node);
          context.report({
            node: readerEffect.node,
            message: `useEffect reacts to "${chainedStateName}" which is set by another useEffect - chains of effects add an extra render per link and become rigid as code evolves. Compute what you can during render and write all related state inside the event handler that originally fires the chain`,
          });
        }
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-effect-event-handler.ts
const noEffectEventHandler = defineRule({
  recommendation:
    "Move interaction-triggered work into the event handler that caused it, or use useEffectEvent for non-reactive event logic inside effects.",
  examples: [
    {
      before: `useEffect(() => { if (submitted) save(); }, [submitted]);`,
      after: `const handleSubmit = () => save();`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES) || (node.arguments?.length ?? 0) < 2) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const depsNode = node.arguments[1];
      if (!isNodeOfType(depsNode, "ArrayExpression") || !depsNode.elements?.length) return;
      const dependencyNames = new Set(
        depsNode.elements
          .filter((element) => isNodeOfType(element, "Identifier"))
          .map((element) => element.name),
      );
      const statements = getCallbackStatements(callback);
      if (statements.length !== 1) return;
      const soleStatement = statements[0];
      if (!isNodeOfType(soleStatement, "IfStatement")) return;
      const rootIdentifierName = getRootIdentifierName$1(soleStatement.test);
      if (!rootIdentifierName || !dependencyNames.has(rootIdentifierName)) return;
      context.report({
        node,
        message:
          "useEffect simulating an event handler - move logic to an actual event handler instead",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-effect-event-in-deps.ts
const noEffectEventInDeps = defineRule({
  recommendation:
    "Remove useEffectEvent callbacks from dependency arrays; they are intentionally stable event functions and should not re-subscribe effects.",
  examples: [
    {
      before: `useEffect(() => subscribe(onMessage), [onMessage]);`,
      after: `useEffect(() => subscribe(onMessage), []);`,
    },
  ],
  create: (context) => {
    const componentBindings = createComponentBindingStackTracker({
      onVariableDeclarator: (declaratorNode) => {
        if (!isNodeOfType(declaratorNode.id, "Identifier")) return;
        const initializer = declaratorNode.init;
        if (!initializer || !isNodeOfType(initializer, "CallExpression")) return;
        if (!isHookCall(initializer, "useEffectEvent")) return;
        componentBindings.addBindingToCurrentFrame(declaratorNode.id.name);
      },
    });
    return {
      ...componentBindings.visitors,
      CallExpression(node) {
        if (!isHookCall(node, HOOKS_WITH_DEPS) || node.arguments.length < 2) return;
        if (!componentBindings.isInsideComponent()) return;
        const depsNode = node.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) return;
        for (const element of depsNode.elements ?? []) {
          if (!isNodeOfType(element, "Identifier")) continue;
          if (componentBindings.isBoundName(element.name))
            context.report({
              node: element,
              message: `"${element.name}" is from useEffectEvent and must not be in the deps array - its identity is intentionally unstable; call it inside the effect without listing it`,
            });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/security/no-eval.ts
const noEval = defineRule({
  recommendation:
    "Remove eval-like execution and replace it with explicit parsing, safe lookup tables, or trusted compile-time code generation.",
  examples: [
    {
      before: `eval(userInput);`,
      after: `handlers[actionName]?.();`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "eval") {
        context.report({
          node,
          message: "eval() is a code injection risk - avoid dynamic code execution",
        });
        return;
      }
      if (
        isNodeOfType(node.callee, "Identifier") &&
        (node.callee.name === "setTimeout" || node.callee.name === "setInterval") &&
        isNodeOfType(node.arguments?.[0], "Literal") &&
        typeof node.arguments[0].value === "string"
      )
        context.report({
          node,
          message: `${node.callee.name}() with string argument executes code dynamically - use a function instead`,
        });
    },
    NewExpression(node) {
      if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "Function")
        context.report({
          node,
          message: "new Function() is a code injection risk - avoid dynamic code execution",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-event-trigger-state.ts
const noEventTriggerState = defineRule({
  recommendation:
    "Call setters from the event handler itself instead of setting flags that an effect later observes to perform the real action.",
  examples: [
    {
      before: `const onClick = () => setShouldSave(true);
useEffect(() => { if (shouldSave) save(); }, [shouldSave]);`,
      after: `const onClick = () => save();`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const useStateBindings = collectUseStateBindings(componentBody);
      if (useStateBindings.length === 0) return;
      const handlerOnlyWriteStateNames = collectHandlerOnlyWriteStateNames(
        componentBody,
        useStateBindings,
        collectHandlerBindingNames(componentBody),
      );
      if (handlerOnlyWriteStateNames.size === 0) return;
      const returnExpressions = collectReturnExpressions(componentBody);
      const dependencyGraph = buildLocalDependencyGraph(componentBody);
      const renderReachableNames = expandTransitiveDependencies(
        collectRenderReachableNames(returnExpressions),
        dependencyGraph,
      );
      walkAst(componentBody, (effectCall) => {
        if (!isNodeOfType(effectCall, "CallExpression")) return;
        if (!isHookCall(effectCall, EFFECT_HOOK_NAMES)) return;
        if ((effectCall.arguments?.length ?? 0) < 2) return;
        const depsNode = effectCall.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) return;
        if ((depsNode.elements?.length ?? 0) !== 1) return;
        const depElement = depsNode.elements[0];
        if (!isNodeOfType(depElement, "Identifier")) return;
        if (!handlerOnlyWriteStateNames.has(depElement.name)) return;
        if (renderReachableNames.has(depElement.name)) return;
        const callback = getEffectCallback(effectCall);
        if (!callback) return;
        const bodyStatements = getCallbackStatements(callback);
        if (bodyStatements.length !== 1) return;
        const soleStatement = bodyStatements[0];
        if (!isNodeOfType(soleStatement, "IfStatement")) return;
        if (getTriggerGuardRootName(soleStatement.test) !== depElement.name) return;
        const sideEffectCalleeName = findTriggeredSideEffectCalleeName(soleStatement.consequent);
        if (!sideEffectCalleeName) return;
        context.report({
          node: effectCall,
          message: `useState "${depElement.name}" exists only to schedule "${sideEffectCalleeName}(...)" from a useEffect - call "${sideEffectCalleeName}(...)" directly inside the event handler that sets it, and delete the state`,
        });
      });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-fetch-in-effect.ts
const noFetchInEffect = defineRule({
  recommendation:
    "Move data fetching to the framework loader, Server Component, query library, or Suspense-aware data layer instead of starting requests from useEffect.",
  examples: [
    {
      before: `useEffect(() => { fetch(\`/api/user/\${id}\`).then(setUser); }, [id]);`,
      after: `const user = await getUser(id);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      if (containsFetchCall(callback))
        context.report({
          node,
          message:
            "fetch() inside useEffect - use a data fetching library (react-query, SWR) or server component",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-flush-sync.ts
const noFlushSync = defineRule({
  recommendation:
    "Remove flushSync unless a browser API requires the DOM to be updated synchronously before the next line runs.",
  examples: [
    {
      before: `flushSync(() => setOpen(true));`,
      after: `setOpen(true);`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "react-dom") return;
      for (const specifier of node.specifiers ?? []) {
        if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
        if (specifier.imported?.name === "flushSync")
          context.report({
            node: specifier,
            message:
              "flushSync from react-dom skips View Transition snapshots and concurrent rendering - prefer startTransition for non-urgent updates",
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-full-lodash-import.ts
const noFullLodashImport = defineRule({
  recommendation:
    "Import only the lodash functions you use, or replace them with native JavaScript helpers where practical.",
  examples: [
    {
      before: `import _ from "lodash";`,
      after: `import debounce from "lodash/debounce";`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (source === "lodash" || source === "lodash-es")
        context.report({
          node,
          message: "Importing entire lodash library - import from 'lodash/functionName' instead",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-generic-handler-names.ts
const noGenericHandlerNames = defineRule({
  recommendation:
    "Name handlers after the user action or domain event, such as handleSave or handleInvite, instead of generic click/change names.",
  examples: [
    {
      before: `const handleClick = () => saveSettings();`,
      after: `const handleSaveSettings = () => saveSettings();`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || !node.name.name.startsWith("on")) return;
      if (!node.value || !isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const eventSuffix = node.name.name.slice(2);
      if (!GENERIC_EVENT_SUFFIXES.has(eventSuffix)) return;
      const mirroredHandlerName = `handle${eventSuffix}`;
      const expression = node.value.expression;
      if (isNodeOfType(expression, "Identifier") && expression.name === mirroredHandlerName)
        context.report({
          node,
          message: `Non-descriptive handler name "${expression.name}" - name should describe what it does, not when it runs`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-giant-component.ts
const noGiantComponent = defineRule({
  recommendation:
    "Split large components by responsibility into smaller components or hooks so rendering, state, and effects stay local.",
  examples: [
    {
      before: `function Dashboard() { return <>{header}{filters}{table}{modal}</>; }`,
      after: `function Dashboard() { return <><DashboardHeader /><Filters /><DataTable /><EditModal /></>; }`,
    },
  ],
  create: (context) => {
    const reportOversizedComponent = (nameNode, componentName, bodyNode) => {
      if (!bodyNode.loc) return;
      const lineCount = bodyNode.loc.end.line - bodyNode.loc.start.line + 1;
      if (lineCount > 300)
        context.report({
          node: nameNode,
          message: `Component "${componentName}" is ${lineCount} lines - consider breaking it into smaller focused components`,
        });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        reportOversizedComponent(node.id, node.id.name, node);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        reportOversizedComponent(node.id, node.id.name, node.init);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/no-global-css-variable-animation.ts
const noGlobalCssVariableAnimation = defineRule({
  recommendation:
    "Animate local element styles or transform values instead of global CSS variables that can invalidate large parts of the tree.",
  examples: [
    {
      before: `document.documentElement.style.setProperty("--x", value);`,
      after: `element.style.transform = \`translateX(\${value}px)\`;`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier")) return;
      if (!ANIMATION_CALLBACK_NAMES.has(node.callee.name)) return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      const calleeName = node.callee.name;
      walkAst(callback, (child) => {
        if (!isNodeOfType(child, "CallExpression")) return;
        if (!isMemberProperty(child.callee, "setProperty")) return;
        if (!isNodeOfType(child.arguments?.[0], "Literal")) return;
        const variableName = child.arguments[0].value;
        if (typeof variableName !== "string" || !variableName.startsWith("--")) return;
        context.report({
          node: child,
          message: `CSS variable "${variableName}" updated in ${calleeName} - forces style recalculation on all inheriting elements every frame`,
        });
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-gradient-text.ts
const noGradientText = defineRule({
  recommendation:
    "Use solid text color for important copy and reserve gradients for decorative accents with accessible fallbacks.",
  examples: [
    {
      before: `<h1 className="bg-gradient-to-r text-transparent bg-clip-text" />`,
      after: `<h1 className="text-foreground" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let hasBackgroundClipText = false;
      let hasGradientBackground = false;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        const value = getStylePropertyStringValue(property);
        if (!key || !value) continue;
        if ((key === "backgroundClip" || key === "WebkitBackgroundClip") && value === "text")
          hasBackgroundClipText = true;
        if ((key === "backgroundImage" || key === "background") && value.includes("gradient"))
          hasGradientBackground = true;
      }
      if (hasBackgroundClipText && hasGradientBackground)
        context.report({
          node,
          message:
            "Gradient text (background-clip: text) is decorative rather than meaningful - a common AI tell. Use solid colors for text",
        });
    },
    JSXOpeningElement(node) {
      const classStr = getStringFromClassNameAttr(node);
      if (!classStr) return;
      if (/\bbg-clip-text\b/.test(classStr) && /\bbg-gradient-to-/.test(classStr))
        context.report({
          node,
          message:
            "Gradient text (bg-clip-text + bg-gradient) is decorative rather than meaningful - a common AI tell. Use solid colors for text",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-gray-on-colored-background.ts
const noGrayOnColoredBackground = defineRule({
  recommendation:
    "Use foreground colors chosen for the colored surface instead of gray text that loses contrast on tinted backgrounds.",
  examples: [
    {
      before: `<div className="bg-blue-600 text-gray-500" />`,
      after: `<div className="bg-blue-600 text-white" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const classStr = getStringFromClassNameAttr(node);
      if (!classStr) return;
      const grayTextMatch = classStr.match(/\btext-(?:gray|slate|zinc|neutral|stone)-\d+\b/);
      const coloredBgMatch = classStr.match(
        /\bbg-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/,
      );
      if (grayTextMatch && coloredBgMatch)
        context.report({
          node,
          message: `Gray text (${grayTextMatch[0]}) on colored background (${coloredBgMatch[0]}) looks washed out - use a darker shade of the background color or white`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-icon-only-button-without-label.ts
const BUTTON_COMPONENT_PATTERN = /Button$/;
const ICON_COMPONENT_PATTERN = /(?:Icon|Spinner|Loader|Glyph)$/;
const getJsxName = (node) => {
  if (!node) return null;
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXMemberExpression")) return getJsxName(node.property);
  return null;
};
const hasNonEmptyAttributeValue = (attribute) => {
  if (!attribute) return false;
  if (!attribute.value) return false;
  if (isNodeOfType(attribute.value, "Literal")) {
    if (attribute.value.value === false || attribute.value.value === null) return false;
    return String(attribute.value.value ?? "").trim().length > 0;
  }
  const expression = attribute.value.expression;
  if (!expression) return false;
  if (isNodeOfType(expression, "Literal")) {
    if (expression.value === false || expression.value === null) return false;
    return String(expression.value ?? "").trim().length > 0;
  }
  return !isNodeOfType(expression, "Identifier") || expression.name !== "undefined";
};
const hasAccessibleNameAttribute = (openingElement) =>
  Boolean(
    hasNonEmptyAttributeValue(findJsxAttribute(openingElement.attributes ?? [], "aria-label")) ||
    hasNonEmptyAttributeValue(findJsxAttribute(openingElement.attributes ?? [], "aria-labelledby")),
  );
const hasTextContent = (node) => {
  for (const child of node.children ?? []) {
    if (isNodeOfType(child, "JSXText") && child.value.trim().length > 0) return true;
    if (isNodeOfType(child, "JSXExpressionContainer")) {
      const expression = child.expression;
      if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
        if (expression.value.trim().length > 0) return true;
        continue;
      }
      if (isNodeOfType(expression, "TemplateLiteral")) return true;
      if (isNodeOfType(expression, "Identifier") || isNodeOfType(expression, "MemberExpression"))
        return true;
    }
    if (isNodeOfType(child, "JSXElement") && hasTextContent(child)) return true;
  }
  return false;
};
const hasIconLikeChild = (node) =>
  (node.children ?? []).some((child) => {
    if (!isNodeOfType(child, "JSXElement")) return false;
    const childName = getJsxName(child.openingElement?.name);
    return childName === "svg" || Boolean(childName && ICON_COMPONENT_PATTERN.test(childName));
  });
const noIconOnlyButtonWithoutLabel = defineRule({
  recommendation:
    "Give icon-only buttons an explicit accessible name and hide decorative icons from assistive tech; adding a tooltip is not enough because it is not the button name.",
  examples: [
    {
      before: `<button><XIcon /></button>`,
      after: `<button aria-label="Close dialog"><XIcon aria-hidden="true" /></button>`,
    },
  ],
  create: (context) => ({
    JSXElement(node) {
      const openingElement = node.openingElement;
      const elementName = getJsxName(openingElement?.name);
      if (elementName !== "button" && !BUTTON_COMPONENT_PATTERN.test(elementName ?? "")) return;
      if (hasAccessibleNameAttribute(openingElement)) return;
      if (hasTextContent(node)) return;
      if (!hasIconLikeChild(node) && (node.children ?? []).length > 0) return;
      context.report({
        node: openingElement,
        message:
          "icon-only button has no accessible name - add aria-label or aria-labelledby and hide decorative icons with aria-hidden",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-inline-bounce-easing.ts
const noInlineBounceEasing = defineRule({
  recommendation:
    "Move easing curves into named tokens and use restrained spring or cubic-bezier values instead of inline bounce curves.",
  examples: [
    {
      before: `transitionTimingFunction: "cubic-bezier(.68,-.55,.27,1.55)"`,
      after: `className="transition-transform ease-out"`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (!key) continue;
        const value = getStylePropertyStringValue(property);
        if (!value) continue;
        if (
          (key === "transition" ||
            key === "transitionTimingFunction" ||
            key === "animation" ||
            key === "animationTimingFunction") &&
          isOvershootCubicBezier(value)
        )
          context.report({
            node: property,
            message:
              "Bounce/elastic easing feels dated - real objects decelerate smoothly. Use ease-out or cubic-bezier(0.16, 1, 0.3, 1) instead",
          });
        if ((key === "animation" || key === "animationName") && hasBounceAnimationName(value))
          context.report({
            node: property,
            message:
              "Bounce/elastic animation name detected - these feel tacky. Use exponential easing (ease-out-quart/expo) for natural deceleration",
          });
      }
    },
    JSXOpeningElement(node) {
      const classStr = getStringFromClassNameAttr(node);
      if (!classStr) return;
      if (/\banimate-bounce\b/.test(classStr))
        context.report({
          node,
          message:
            "animate-bounce feels dated and tacky - use a subtle ease-out transform for natural deceleration",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-inline-exhaustive-style.ts
const noInlineExhaustiveStyle = defineRule({
  recommendation:
    "Move large inline style objects to classes, CSS variables, or focused style helpers so design tokens remain reusable.",
  examples: [
    {
      before: `<div style={{ display: "flex", gap: 8, padding: 12 }} />`,
      after: `<div className="flex gap-2 p-3" />`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isOgImageFile = OG_IMAGE_FILE_PATTERN$1.test(filename) || OG_ROUTE_PATTERN.test(filename);
    return {
      JSXAttribute(node) {
        if (isOgImageFile) return;
        const expression = getInlineStyleExpression(node);
        if (!expression) return;
        const propertyCount =
          expression.properties?.filter((property) => isNodeOfType(property, "Property")).length ??
          0;
        if (propertyCount >= 8)
          context.report({
            node: expression,
            message: `${propertyCount} inline style properties - extract to a CSS class, CSS module, or styled component for maintainability and reuse`,
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/no-inline-prop-on-memo-component.ts
const noInlinePropOnMemoComponent = defineRule({
  recommendation:
    "Hoist or memoize object, array, and function props passed to memoized children so memo can skip unchanged renders.",
  examples: [
    {
      before: `<MemoChart options={{ color }} />`,
      after: `const options = useMemo(() => ({ color }), [color]);
<MemoChart options={options} />`,
    },
  ],
  create: (context) => {
    const memoizedComponentNames = /* @__PURE__ */ new Set();
    return {
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier") || !node.init) return;
        if (isMemoCall(node.init)) memoizedComponentNames.add(node.id.name);
      },
      ExportDefaultDeclaration(node) {
        if (node.declaration && isMemoCall(node.declaration)) {
          const innerArgument = node.declaration.arguments?.[0];
          if (isNodeOfType(innerArgument, "Identifier"))
            memoizedComponentNames.add(innerArgument.name);
        }
      },
      JSXAttribute(node) {
        if (!node.value || !isNodeOfType(node.value, "JSXExpressionContainer")) return;
        const openingElement = node.parent;
        if (!openingElement || !isNodeOfType(openingElement, "JSXOpeningElement")) return;
        let elementName = null;
        if (isNodeOfType(openingElement.name, "JSXIdentifier"))
          elementName = openingElement.name.name;
        if (!elementName || !memoizedComponentNames.has(elementName)) return;
        const propType = isInlineReference(node.value.expression);
        if (propType)
          context.report({
            node: node.value.expression,
            message: `JSX attribute values should not contain ${propType} created in the same scope - ${elementName} is wrapped in memo(), so new references cause unnecessary re-renders`,
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/design/no-justified-text.ts
const noJustifiedText = defineRule({
  recommendation:
    "Use left-aligned text for body copy instead of text-align: justify to avoid rivers and uneven word spacing.",
  examples: [
    {
      before: `<p style={{ textAlign: "justify" }} />`,
      after: `<p className="text-left text-pretty" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let isJustified = false;
      let hasHyphens = false;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        const value = getStylePropertyStringValue(property);
        if (!key || !value) continue;
        if (key === "textAlign" && value === "justify") isJustified = true;
        if ((key === "hyphens" || key === "WebkitHyphens") && value === "auto") hasHyphens = true;
      }
      if (isJustified && !hasHyphens)
        context.report({
          node,
          message:
            'Justified text without hyphens creates uneven word spacing ("rivers of white"). Use text-align: left, or add hyphens: auto',
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-large-animated-blur.ts
const noLargeAnimatedBlur = defineRule({
  recommendation:
    "Avoid animating large blur or filter values; use opacity, transform, or a pre-rendered asset for the effect.",
  examples: [
    {
      before: `filter: blur(80px); transition: filter 300ms;`,
      after: `opacity: 0.8; transform: scale(1.02);`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (node.name.name !== "style" && !MOTION_ANIMATE_PROPS.has(node.name.name)) return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      for (const property of expression.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        const key = isNodeOfType(property.key, "Identifier") ? property.key.name : null;
        if (key !== "filter" && key !== "backdropFilter" && key !== "WebkitBackdropFilter")
          continue;
        if (!isNodeOfType(property.value, "Literal") || typeof property.value.value !== "string")
          continue;
        const match = BLUR_VALUE_PATTERN.exec(property.value.value);
        if (!match) continue;
        const blurRadius = Number.parseFloat(match[1]);
        if (blurRadius > 10)
          context.report({
            node: property,
            message: `blur(${blurRadius}px) is expensive - cost escalates with radius and layer size, can exceed GPU memory on mobile`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-layout-property-animation.ts
const noLayoutPropertyAnimation = defineRule({
  recommendation:
    "Animate transform, opacity, clip-path, or FLIP-derived transforms instead of layout properties like width, height, margin, top, or left.",
  examples: [
    {
      before: `transition: width 200ms;`,
      after: `transition: transform 200ms;`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || !MOTION_ANIMATE_PROPS.has(node.name.name))
        return;
      if (!node.value || !isNodeOfType(node.value, "JSXExpressionContainer")) return;
      if (isMotionElement(node)) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      for (const property of expression.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        let propertyName = null;
        if (isNodeOfType(property.key, "Identifier")) propertyName = property.key.name;
        else if (isNodeOfType(property.key, "Literal")) propertyName = property.key.value;
        if (propertyName && LAYOUT_PROPERTIES.has(propertyName))
          context.report({
            node: property,
            message: `Animating layout property "${propertyName}" triggers layout recalculation every frame - use transform/scale or the layout prop`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-layout-transition-inline.ts
const noLayoutTransitionInline = defineRule({
  recommendation:
    "Transition transform and opacity explicitly instead of inline layout-property transitions.",
  examples: [
    {
      before: `<div style={{ transition: "width 200ms" }} />`,
      after: `<div style={{ transition: "transform 200ms" }} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (key !== "transition" && key !== "transitionProperty") continue;
        const value = getStylePropertyStringValue(property);
        if (!value) continue;
        const lower = value.toLowerCase();
        if (/\ball\b/.test(lower)) continue;
        const layoutMatch = lower.match(
          /\b(?:(?:max|min)-)?(?:width|height)\b|\bpadding(?:-(?:top|right|bottom|left))?\b|\bmargin(?:-(?:top|right|bottom|left))?\b/,
        );
        if (layoutMatch)
          context.report({
            node: property,
            message: `Transitioning layout property "${layoutMatch[0]}" causes layout thrash every frame - use transform and opacity instead`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-legacy-class-lifecycles.ts
const noLegacyClassLifecycles = defineRule({
  recommendation:
    "Replace unsafe class lifecycle methods with constructor initialization, componentDidMount/componentDidUpdate, getSnapshotBeforeUpdate, or function components.",
  examples: [
    {
      before: `componentWillMount() { load(); }`,
      after: `componentDidMount() { load(); }`,
    },
  ],
  create: (context) => {
    const checkMember = (memberNode) => {
      if (!memberNode) return;
      if (
        !isNodeOfType(memberNode, "MethodDefinition") &&
        !isNodeOfType(memberNode, "PropertyDefinition")
      )
        return;
      if (!isNodeOfType(memberNode.key, "Identifier")) return;
      const message = buildLegacyLifecycleMessage(memberNode.key.name);
      if (message)
        context.report({
          node: memberNode.key,
          message,
        });
    };
    return {
      ClassBody(node) {
        for (const member of node.body ?? []) checkMember(member);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-legacy-context-api.ts
const noLegacyContextApi = defineRule({
  recommendation:
    "Migrate legacy contextTypes/getChildContext usage to createContext providers and useContext or use.",
  examples: [
    {
      before: `MyComponent.contextTypes = { theme: PropTypes.object };`,
      after: `const theme = useContext(ThemeContext);`,
    },
  ],
  create: (context) => {
    const checkMember = (memberNode) => {
      if (!memberNode) return;
      if (
        !isNodeOfType(memberNode, "MethodDefinition") &&
        !isNodeOfType(memberNode, "PropertyDefinition")
      )
        return;
      if (!isNodeOfType(memberNode.key, "Identifier")) return;
      if (!LEGACY_CONTEXT_NAMES.has(memberNode.key.name)) return;
      context.report({
        node: memberNode.key,
        message: buildLegacyContextMessage(memberNode.key.name),
      });
    };
    return {
      ClassBody(node) {
        for (const member of node.body ?? []) checkMember(member);
      },
      AssignmentExpression(node) {
        if (node.operator !== "=") return;
        const left = node.left;
        if (!isNodeOfType(left, "MemberExpression")) return;
        if (left.computed) return;
        if (!isNodeOfType(left.property, "Identifier")) return;
        if (!LEGACY_CONTEXT_NAMES.has(left.property.name)) return;
        if (!isNodeOfType(left.object, "Identifier")) return;
        if (!isUppercaseName(left.object.name)) return;
        if (isInsideClassBody(node)) return;
        context.report({
          node: left,
          message: buildLegacyContextMessage(left.property.name),
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/design/no-long-transition-duration.ts
const noLongTransitionDuration = defineRule({
  recommendation:
    "Keep interaction transitions short and purposeful, and reserve longer durations for large page-level motion.",
  examples: [
    {
      before: `<button className="duration-1000" />`,
      after: `<button className="duration-150" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (!key) continue;
        const value = getStylePropertyStringValue(property);
        if (!value) continue;
        let durationMs = null;
        if (key === "transitionDuration" || key === "animationDuration") {
          let longestDurationPropertyMs = 0;
          for (const segment of value.split(",")) {
            const trimmedSegment = segment.trim();
            const msMatch = trimmedSegment.match(/^([\d.]+)ms$/);
            const secondsMatch = trimmedSegment.match(/^([\d.]+)s$/);
            if (msMatch)
              longestDurationPropertyMs = Math.max(
                longestDurationPropertyMs,
                parseFloat(msMatch[1]),
              );
            else if (secondsMatch)
              longestDurationPropertyMs = Math.max(
                longestDurationPropertyMs,
                parseFloat(secondsMatch[1]) * 1e3,
              );
          }
          if (longestDurationPropertyMs > 0) durationMs = longestDurationPropertyMs;
        }
        if (key === "transition" || key === "animation") {
          let longestDurationMs = 0;
          const segments = value.split(",");
          for (const segment of segments) {
            const firstTimeMatch = segment.match(/(?<![a-zA-Z\d])([\d.]+)(m?s)(?![a-zA-Z\d-])/);
            if (!firstTimeMatch) continue;
            const segmentDurationMs =
              firstTimeMatch[2] === "ms"
                ? parseFloat(firstTimeMatch[1])
                : parseFloat(firstTimeMatch[1]) * 1e3;
            longestDurationMs = Math.max(longestDurationMs, segmentDurationMs);
          }
          if (longestDurationMs > 0) durationMs = longestDurationMs;
        }
        if (durationMs !== null && durationMs > 1e3)
          context.report({
            node: property,
            message: `${durationMs}ms transition is too slow for UI feedback - keep transitions under ${LONG_TRANSITION_DURATION_THRESHOLD_MS}ms. Use longer durations only for page-load hero animations`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-many-boolean-props.ts
const noManyBooleanProps = defineRule({
  recommendation:
    "Replace many boolean props with a variant enum, options object, or composed subcomponents to avoid invalid state combinations.",
  examples: [
    {
      before: `<Button primary danger loading />`,
      after: `<Button variant="danger" loading />`,
    },
  ],
  create: (context) => {
    const reportIfMany = (booleanLikePropNames, componentName, reportNode) => {
      if (booleanLikePropNames.length >= 4)
        context.report({
          node: reportNode,
          message: `Component "${componentName}" takes ${booleanLikePropNames.length} boolean-like props (${booleanLikePropNames.slice(0, 3).join(", ")}…) - consider compound components or explicit variants instead of stacking flags`,
        });
    };
    const checkComponent = (param, body, componentName, reportNode) => {
      if (!param) return;
      if (isNodeOfType(param, "ObjectPattern")) {
        const booleanLikePropNames = [];
        for (const property of param.properties ?? []) {
          if (!isNodeOfType(property, "Property")) continue;
          const keyName = isNodeOfType(property.key, "Identifier") ? property.key.name : null;
          if (!keyName) continue;
          if (BOOLEAN_PROP_PREFIX_PATTERN.test(keyName)) booleanLikePropNames.push(keyName);
        }
        reportIfMany(booleanLikePropNames, componentName, reportNode);
        return;
      }
      if (isNodeOfType(param, "Identifier"))
        reportIfMany(
          [...collectBooleanLikePropsFromBody(body, param.name)],
          componentName,
          reportNode,
        );
    };
    return {
      FunctionDeclaration(node) {
        if (!isComponentDeclaration(node)) return;
        checkComponent(node.params?.[0], node.body, node.id.name, node.id);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.params?.[0], node.init?.body, node.id.name, node.id);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-mirror-prop-effect.ts
const noMirrorPropEffect = defineRule({
  recommendation:
    "Use the prop directly, derive a value during render, or make the component controlled instead of mirroring props into local state with an effect.",
  examples: [
    {
      before: `useEffect(() => setValue(propValue), [propValue]);`,
      after: `const value = propValue;`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const propNames = propStackTracker.getCurrentPropNames();
      if (propNames.size === 0) return;
      const mirrorBindings = [];
      for (const statement of componentBody.body ?? []) {
        if (!isNodeOfType(statement, "VariableDeclaration")) continue;
        for (const declarator of statement.declarations ?? []) {
          if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
          const elements = declarator.id.elements ?? [];
          if (elements.length < 2) continue;
          const valueElement = elements[0];
          const setterElement = elements[1];
          if (
            !isNodeOfType(valueElement, "Identifier") ||
            !isNodeOfType(setterElement, "Identifier") ||
            !isSetterIdentifier(setterElement.name)
          )
            continue;
          if (!isNodeOfType(declarator.init, "CallExpression")) continue;
          if (!isHookCall(declarator.init, "useState")) continue;
          const initializer = declarator.init.arguments?.[0];
          if (!initializer) continue;
          const propRootName = getPropRootName(initializer, propNames);
          if (!propRootName) continue;
          mirrorBindings.push({
            valueName: valueElement.name,
            setterName: setterElement.name,
            initializer,
            propRootName,
          });
        }
      }
      if (mirrorBindings.length === 0) return;
      for (const statement of componentBody.body ?? []) {
        if (!isNodeOfType(statement, "ExpressionStatement")) continue;
        const effectCall = statement.expression;
        if (!isNodeOfType(effectCall, "CallExpression")) continue;
        if (!isHookCall(effectCall, EFFECT_HOOK_NAMES)) continue;
        if ((effectCall.arguments?.length ?? 0) < 2) continue;
        const depsNode = effectCall.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) continue;
        const depIdentifierNames = /* @__PURE__ */ new Set();
        for (const element of depsNode.elements ?? [])
          if (isNodeOfType(element, "Identifier")) depIdentifierNames.add(element.name);
        if (depIdentifierNames.size === 0) continue;
        const callback = getEffectCallback(effectCall);
        if (!callback) continue;
        const bodyStatements = getCallbackStatements(callback);
        if (bodyStatements.length !== 1) continue;
        const onlyStatement = bodyStatements[0];
        const expression = isNodeOfType(onlyStatement, "ExpressionStatement")
          ? onlyStatement.expression
          : onlyStatement;
        if (!isNodeOfType(expression, "CallExpression")) continue;
        if (!isNodeOfType(expression.callee, "Identifier")) continue;
        if (!isSetterIdentifier(expression.callee.name)) continue;
        if (!expression.arguments?.length) continue;
        const setterArgument = expression.arguments[0];
        const matchedBinding = mirrorBindings.find(
          (binding) =>
            binding.setterName === expression.callee.name &&
            depIdentifierNames.has(binding.propRootName) &&
            areExpressionsStructurallyEqual(binding.initializer, setterArgument),
        );
        if (!matchedBinding) continue;
        context.report({
          node: effectCall,
          message: `useState "${matchedBinding.valueName}" is mirrored from prop "${matchedBinding.propRootName}" via this effect - delete both the useState and the effect, and read the prop directly in render`,
        });
      }
    };
    const propStackTracker = createComponentPropStackTracker({ onComponentEnter: checkComponent });
    return propStackTracker.visitors;
  },
});
//#endregion
//#region src/core/rules/lint/performance/no-moment.ts
const noMoment = defineRule({
  recommendation:
    "Replace Moment with Intl, date-fns, Day.js, or another smaller date strategy appropriate for the feature.",
  examples: [
    {
      before: `import moment from "moment";`,
      after: `import { format } from "date-fns";`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value === "moment")
        context.report({
          node,
          message: 'moment.js is 300kb+ - use "date-fns" or "dayjs" instead',
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-mutable-in-deps.ts
const noMutableInDeps = defineRule({
  recommendation:
    "Replace mutable dependency values with stable primitives, refs, reducers, or memoized immutable values before putting them in a hook dependency array.",
  examples: [
    {
      before: `const options = new Map();
useEffect(sync, [options]);`,
      after: `const options = useMemo(() => new Map(), []);
useEffect(sync, [options]);`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const useRefBindingNames = collectUseRefBindingNames(componentBody);
      walkAst(componentBody, (child) => {
        if (!isNodeOfType(child, "CallExpression")) return;
        if (!isHookCall(child, HOOKS_WITH_DEPS)) return;
        if ((child.arguments?.length ?? 0) < 2) return;
        const depsNode = child.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) return;
        for (const element of depsNode.elements ?? []) {
          if (!element) continue;
          const issue = findMutableDepIssue(element, useRefBindingNames);
          if (!issue) continue;
          if (issue.kind === "ref-current")
            context.report({
              node: element,
              message: `"${issue.rootName}.current" in deps - refs are mutable and don't trigger re-renders, so React won't re-run this effect when it changes. Read the ref inside the effect body instead`,
            });
          else
            context.report({
              node: element,
              message: `Mutable global "${issue.rootName}.*" in deps - values like \`location.pathname\` can change without triggering a re-render, so they can't drive effect re-runs. Subscribe with useSyncExternalStore or read inside the effect`,
            });
        }
      });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-nested-component-definition.ts
const noNestedComponentDefinition = defineRule({
  recommendation:
    "Move component definitions to module scope so React sees a stable component type and preserves state across parent renders.",
  examples: [
    {
      before: `function Parent() { function Child() { return <div />; } return <Child />; }`,
      after: `function Child() { return <div />; }
function Parent() { return <Child />; }`,
    },
  ],
  create: (context) => {
    const componentStack = [];
    return {
      FunctionDeclaration(node) {
        if (!isComponentDeclaration(node)) return;
        if (componentStack.length > 0)
          context.report({
            node: node.id,
            message: `Component "${node.id.name}" defined inside "${componentStack[componentStack.length - 1]}" - creates new instance every render, destroying state`,
          });
        componentStack.push(node.id.name);
      },
      "FunctionDeclaration:exit"(node) {
        if (isComponentDeclaration(node)) componentStack.pop();
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        if (componentStack.length > 0)
          context.report({
            node: node.id,
            message: `Component "${node.id.name}" defined inside "${componentStack[componentStack.length - 1]}" - creates new instance every render, destroying state`,
          });
        componentStack.push(node.id.name);
      },
      "VariableDeclarator:exit"(node) {
        if (isComponentAssignment(node)) componentStack.pop();
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/design/no-outline-none.ts
const noOutlineNone = defineRule({
  recommendation:
    "Keep a visible focus style with focus-visible rings or outlines whenever removing the browser default outline.",
  examples: [
    {
      before: `<button className="outline-none" />`,
      after: `<button className="focus-visible:ring-2" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let hasOutlineNone = false;
      let outlineProperty = null;
      for (const property of expression.properties ?? []) {
        if (getStylePropertyKey(property) !== "outline") continue;
        const strValue = getStylePropertyStringValue(property);
        const numValue = getStylePropertyNumberValue(property);
        if (strValue === "none" || strValue === "0" || numValue === 0) {
          hasOutlineNone = true;
          outlineProperty = property;
        }
      }
      if (!hasOutlineNone || !outlineProperty) return;
      if (
        !expression.properties?.some((property) => {
          return getStylePropertyKey(property) === "boxShadow";
        })
      )
        context.report({
          node: outlineProperty,
          message:
            "outline: none removes keyboard focus visibility - use :focus-visible styling instead, or provide a box-shadow focus ring",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-permanent-will-change.ts
const noPermanentWillChange = defineRule({
  recommendation:
    "Apply will-change only shortly before an animation starts and remove it when the animation ends.",
  examples: [
    {
      before: `.card { will-change: transform; }`,
      after: `.card.animating { will-change: transform; }`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      for (const property of expression.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if ((isNodeOfType(property.key, "Identifier") ? property.key.name : null) !== "willChange")
          continue;
        context.report({
          node: property,
          message:
            "Permanent will-change wastes GPU memory - apply only during active animation and remove after",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-polymorphic-children.ts
const noPolymorphicChildren = defineRule({
  recommendation:
    "Keep children as renderable content and pass component types or render functions through explicit props when polymorphism is required.",
  examples: [
    {
      before: `<Slot>{Component}</Slot>`,
      after: `<Slot component={Component} />`,
    },
  ],
  create: (context) => ({
    BinaryExpression(node) {
      if (node.operator !== "===" && node.operator !== "==") return;
      const isTypeofChildren = (operand) =>
        isNodeOfType(operand, "UnaryExpression") &&
        operand.operator === "typeof" &&
        isNodeOfType(operand.argument, "Identifier") &&
        operand.argument.name === "children";
      if (!isTypeofChildren(node.left) && !isTypeofChildren(node.right)) return;
      const isStringLiteral = (operand) =>
        isNodeOfType(operand, "Literal") && operand.value === "string";
      if (!isStringLiteral(node.left) && !isStringLiteral(node.right)) return;
      context.report({
        node,
        message:
          'Polymorphic `typeof children === "string"` check - expose explicit subcomponents (e.g. `<Button.Text>`) instead of branching on what the consumer passed',
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-prevent-default.ts
const noPreventDefault = defineRule({
  recommendation:
    "Avoid preventDefault unless the component is intentionally replacing native browser behavior; prefer semantic controls.",
  examples: [
    {
      before: `<button onClick={(event) => { event.preventDefault(); save(); }} />`,
      after: `<button type="button" onClick={save} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = isNodeOfType(node.name, "JSXIdentifier") ? node.name.name : null;
      if (!elementName) return;
      const targetEventProps = PREVENT_DEFAULT_ELEMENTS.get(elementName);
      if (!targetEventProps) return;
      for (const targetEventProp of targetEventProps) {
        const eventAttribute = findJsxAttribute(node.attributes ?? [], targetEventProp);
        if (!eventAttribute?.value || !isNodeOfType(eventAttribute.value, "JSXExpressionContainer"))
          continue;
        const expression = eventAttribute.value.expression;
        if (
          !isNodeOfType(expression, "ArrowFunctionExpression") &&
          !isNodeOfType(expression, "FunctionExpression")
        )
          continue;
        if (!containsPreventDefaultCall(expression)) continue;
        context.report({
          node,
          message: buildPreventDefaultMessage(elementName),
        });
        return;
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-prop-callback-in-effect.ts
const noPropCallbackInEffect = defineRule({
  recommendation:
    "Wrap callback props with useEffectEvent/useLatest or call them from the originating event so effects do not re-run only because callback identity changed.",
  examples: [
    {
      before: `useEffect(() => { socket.on("done", onDone); }, [onDone]);`,
      after: `const onDoneEvent = useEffectEvent(onDone);
useEffect(() => socket.on("done", onDoneEvent), []);`,
    },
  ],
  create: (context) => {
    const propStackTracker = createComponentPropStackTracker();
    return {
      ...propStackTracker.visitors,
      CallExpression(node) {
        if (!isHookCall(node, EFFECT_HOOK_NAMES) || (node.arguments?.length ?? 0) < 2) return;
        const callback = getEffectCallback(node);
        if (!callback) return;
        const depsNode = node.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression") || !depsNode.elements?.length) return;
        if (
          !depsNode.elements.some(
            (element) =>
              isNodeOfType(element, "Identifier") && !propStackTracker.isPropName(element.name),
          )
        )
          return;
        const reportedNodes = /* @__PURE__ */ new Set();
        walkInsideStatementBlocks(callback.body, (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (!isNodeOfType(child.callee, "Identifier")) return;
          const calleeName = child.callee.name;
          if (!propStackTracker.isPropName(calleeName)) return;
          if (reportedNodes.has(child)) return;
          reportedNodes.add(child);
          context.report({
            node: child,
            message: `useEffect calls prop callback "${calleeName}" with local state in deps - this is the "lift state via callback" anti-pattern; lift state into a shared Provider so both sides read the same source`,
          });
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/design/no-pure-black-background.ts
const noPureBlackBackground = defineRule({
  recommendation:
    "Use near-black or tokenized dark surfaces instead of pure black so contrast and depth stay controlled.",
  examples: [
    {
      before: `<div className="bg-black" />`,
      after: `<div className="bg-neutral-950" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (key !== "backgroundColor" && key !== "background") continue;
        const value = getStylePropertyStringValue(property);
        if (value && isPureBlackColor(value))
          context.report({
            node: property,
            message:
              "Pure #000 background looks harsh - tint slightly toward your brand hue for a more refined feel (e.g. #0a0a0f)",
          });
      }
    },
    JSXOpeningElement(node) {
      const classStr = getStringFromClassNameAttr(node);
      if (!classStr) return;
      if (/\bbg-black\b(?!\/)/.test(classStr))
        context.report({
          node,
          message:
            "Pure black background (bg-black) looks harsh - use a near-black tinted toward your brand hue (e.g. bg-gray-950)",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-react-dom-deprecated-apis.ts
const noReactDomDeprecatedApis = defineRule(
  createDeprecatedReactImportRule({
    recommendation:
      "Replace deprecated react-dom APIs with createRoot, hydrateRoot, root.unmount, React act, or Testing Library helpers.",
    examples: [
      {
        before: `ReactDOM.render(<App />, root);`,
        after: `createRoot(root).render(<App />);`,
      },
    ],
    source: "react-dom",
    messages: REACT_DOM_DEPRECATED_MESSAGES,
    handleExtraSource: (node, context) => {
      if (node.source?.value !== "react-dom/test-utils") return false;
      reportTestUtilsImports(node, context);
      return true;
    },
  }),
);
//#endregion
//#region src/core/rules/lint/react/no-react19-deprecated-apis.ts
const noReact19DeprecatedApis = defineRule(
  createDeprecatedReactImportRule({
    recommendation:
      "Replace APIs deprecated or removed in React 19 with their supported alternatives before upgrading.",
    examples: [
      {
        before: `import { forwardRef } from "react";`,
        after: `function Input({ ref, ...props }) { return <input ref={ref} {...props} />; }`,
      },
    ],
    source: "react",
    messages: REACT_19_DEPRECATED_MESSAGES,
  }),
);
//#endregion
//#region src/core/rules/lint/react/no-random-key.ts
const getDirectUnstableKeySource = (node) => {
  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "Identifier") &&
    (node.callee.name === "Date" ||
      node.callee.name === "randomUUID" ||
      node.callee.name === "uuid" ||
      node.callee.name === "nanoid")
  )
    return `${node.callee.name}()`;
  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.object, "Identifier") &&
    isNodeOfType(node.callee.property, "Identifier")
  ) {
    const receiverName = node.callee.object.name;
    const methodName = node.callee.property.name;
    if (receiverName === "Math" && methodName === "random") return "Math.random()";
    if (receiverName === "Date" && methodName === "now") return "Date.now()";
    if (receiverName === "crypto" && methodName === "randomUUID") return "crypto.randomUUID()";
  }
  if (
    isNodeOfType(node, "NewExpression") &&
    isNodeOfType(node.callee, "Identifier") &&
    node.callee.name === "Date"
  )
    return "new Date()";
  return null;
};
const getUnstableKeySource = (node) => {
  if (!node) return null;
  let source = null;
  walkAst(node, (child) => {
    if (source) return false;
    source = getDirectUnstableKeySource(child);
    if (source) return false;
  });
  return source;
};
const noRandomKey = defineRule({
  recommendation:
    "Use a stable identifier from the data model for React keys; random or time-based keys force remounts and hide the state bug instead of fixing identity.",
  examples: [
    {
      before: `{items.map((item) => <Row key={Math.random()} item={item} />)}`,
      after: `{items.map((item) => <Row key={item.id} item={item} />)}`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "key") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const source = getUnstableKeySource(node.value.expression);
      if (!source) return;
      context.report({
        node,
        message: `${source} used as a React key - use a stable item id so React can preserve child state`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-render-in-render.ts
const noRenderInRender = defineRule({
  recommendation:
    "Do not call render functions while rendering; return JSX directly or compose components normally.",
  examples: [
    {
      before: `return renderHeader();`,
      after: `return <Header />;`,
    },
  ],
  create: (context) => {
    let didReportForFile = false;
    return {
      JSXExpressionContainer(node) {
        if (didReportForFile) return;
        const expression = node.expression;
        if (!isNodeOfType(expression, "CallExpression")) return;
        let calleeName = null;
        if (isNodeOfType(expression.callee, "Identifier")) calleeName = expression.callee.name;
        else if (
          isNodeOfType(expression.callee, "MemberExpression") &&
          isNodeOfType(expression.callee.property, "Identifier")
        )
          calleeName = expression.callee.property.name;
        if (calleeName && RENDER_FUNCTION_PATTERN.test(calleeName)) {
          didReportForFile = true;
          context.report({
            node: expression,
            message: `Inline render function "${calleeName}()" - extract to a separate component for proper reconciliation`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-render-prop-children.ts
const noRenderPropChildren = defineRule({
  recommendation:
    "Prefer normal children, compound components, or named slot components instead of render-prop children for static composition.",
  examples: [
    {
      before: `<List>{(item) => <Row item={item} />}</List>`,
      after: `<List renderItem={(item) => <Row item={item} />} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const renderPropAttributes = [];
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        const name = attribute.name.name;
        if (!RENDER_PROP_PATTERN.test(name)) continue;
        renderPropAttributes.push({
          name,
          node: attribute,
        });
      }
      if (renderPropAttributes.length < 3) return;
      const propList = renderPropAttributes
        .slice(0, 3)
        .map((entry) => entry.name)
        .join(", ");
      context.report({
        node: renderPropAttributes[0].node,
        message: `${renderPropAttributes.length} render-prop slots on the same element (${propList}…) - collapse into compound subcomponents or \`children\` so consumers don't need to know about every customization point`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-scale-from-zero.ts
const noScaleFromZero = defineRule({
  recommendation:
    "Scale from a small non-zero value or use opacity/clip reveal so layout and rasterization avoid singular transform artifacts.",
  examples: [
    {
      before: `transform: scale(0);`,
      after: `transform: scale(0.95); opacity: 0;`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (node.name.name !== "initial" && node.name.name !== "exit") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      for (const property of expression.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if ((isNodeOfType(property.key, "Identifier") ? property.key.name : null) !== "scale")
          continue;
        if (isNodeOfType(property.value, "Literal") && property.value.value === 0)
          context.report({
            node: property,
            message:
              "scale: 0 makes elements appear from nowhere - use scale: 0.95 with opacity: 0 for natural entrance",
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/security/no-secrets-in-client-code.ts
const noSecretsInClientCode = defineRule({
  recommendation:
    "Move secrets to server-only environment variables and expose only public, intentionally prefixed client configuration.",
  examples: [
    {
      before: `const apiKey = process.env.SECRET_API_KEY;`,
      after: `const apiKey = process.env.NEXT_PUBLIC_ANALYTICS_KEY;`,
    },
  ],
  create: (context) => ({
    VariableDeclarator(node) {
      if (!isNodeOfType(node.id, "Identifier")) return;
      if (!isNodeOfType(node.init, "Literal") || typeof node.init.value !== "string") return;
      const variableName = node.id.name;
      const literalValue = node.init.value;
      const trailingSuffix = variableName.split("_").pop()?.toLowerCase() ?? "";
      const isUiConstant = SECRET_FALSE_POSITIVE_SUFFIXES.has(trailingSuffix);
      if (SECRET_VARIABLE_PATTERN.test(variableName) && !isUiConstant && literalValue.length > 24) {
        context.report({
          node,
          message: `Possible hardcoded secret in "${variableName}" - use environment variables instead`,
        });
        return;
      }
      if (SECRET_PATTERNS.some((pattern) => pattern.test(literalValue)))
        context.report({
          node,
          message: "Hardcoded secret detected - use environment variables instead",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-set-state-in-render.ts
const noSetStateInRender = defineRule({
  recommendation:
    "Move state updates out of render into event handlers, effects, reducers, or lazy initializers so rendering stays pure.",
  examples: [
    {
      before: `if (!ready) setReady(true);`,
      after: `useEffect(() => setReady(true), []);`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const setterNames = new Set(
        collectUseStateBindings(componentBody).map((binding) => binding.setterName),
      );
      if (setterNames.size === 0) return;
      for (const statement of componentBody.body ?? []) {
        const setterCall = isUnconditionalSetterCallStatement(statement, setterNames);
        if (!setterCall) continue;
        const setterIdentifierName = setterCall.callee.name;
        context.report({
          node: setterCall,
          message: `${setterIdentifierName}() called unconditionally at the top of render - causes an infinite re-render loop. Move into a useEffect or an event handler. (To derive state from props, guard the call: \`if (prev !== prop) ${setterIdentifierName}(prop)\`)`,
        });
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/no-settimeout-state-fix.ts
const isZeroDelayTimer = (node) => {
  if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "setTimeout") return false;
  const delay = node.arguments?.[1];
  if (!delay) return true;
  return isNodeOfType(delay, "Literal") && delay.value === 0;
};
const callbackContainsStateSetter = (callback) => {
  if (!callback) return false;
  if (isNodeOfType(callback, "Identifier") && isSetterIdentifier(callback.name)) return true;
  let didFindSetter = false;
  walkAst(callback, (child) => {
    if (didFindSetter) return false;
    if (child !== callback && isNodeOfType(child, "FunctionExpression")) return false;
    if (child !== callback && isNodeOfType(child, "ArrowFunctionExpression")) return false;
    if (isSetterCall(child)) {
      didFindSetter = true;
      return false;
    }
  });
  return didFindSetter;
};
const noSettimeoutStateFix = defineRule({
  recommendation:
    "Do not defer React state with setTimeout(..., 0) to make ordering bugs disappear; move the update to the real event/lifecycle boundary and verify the original race or render loop is gone.",
  examples: [
    {
      before: `setTimeout(() => setOpen(false), 0);`,
      after: `const handleClose = () => setOpen(false);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isZeroDelayTimer(node)) return;
      if (!callbackContainsStateSetter(node.arguments?.[0])) return;
      context.report({
        node,
        message:
          "setTimeout(..., 0) around a React state update hides ordering bugs - update at the actual event or lifecycle boundary instead",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-side-tab-border.ts
const noSideTabBorder = defineRule({
  recommendation:
    "Use background, shadow, or active indicator treatments for side tabs instead of border tricks that shift layout or feel clipped.",
  examples: [
    {
      before: `<Tab className="border-l-4" />`,
      after: `<Tab className="bg-muted shadow-sm" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let hasBorderRadius = false;
      for (const property of expression.properties ?? [])
        if (getStylePropertyKey(property) === "borderRadius") {
          const numValue = getStylePropertyNumberValue(property);
          const strValue = getStylePropertyStringValue(property);
          if (
            (numValue !== null && numValue > 0) ||
            (strValue !== null && parseFloat(strValue) > 0)
          )
            hasBorderRadius = true;
        }
      const threshold = hasBorderRadius ? 1 : 3;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (!key) continue;
        const sideLabel = BORDER_SIDE_KEYS.get(key);
        if (sideLabel !== void 0) {
          const value = getStylePropertyStringValue(property);
          if (!value) continue;
          const widthMatch = value.match(/^(\d+)px\s+solid/);
          if (!widthMatch) continue;
          const borderColor = extractBorderColorFromShorthand(value);
          if (borderColor && isNeutralBorderColor(borderColor)) continue;
          const width = parseInt(widthMatch[1], 10);
          if (width >= threshold)
            context.report({
              node: property,
              message: `Thick one-sided border (${sideLabel}: ${width}px) - the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it`,
            });
        }
        if (BORDER_SIDE_WIDTH_KEYS.has(key)) {
          const numValue = getStylePropertyNumberValue(property);
          const strValue = getStylePropertyStringValue(property);
          const width = numValue ?? (strValue !== null ? parseFloat(strValue) : NaN);
          if (isNaN(width)) continue;
          const colorKey = key.replace("Width", "Color");
          if (
            !expression.properties?.some((colorProperty) => {
              if (getStylePropertyKey(colorProperty) !== colorKey) return false;
              const colorValue = getStylePropertyStringValue(colorProperty);
              return colorValue !== null && !isNeutralBorderColor(colorValue);
            })
          )
            continue;
          if (width >= threshold)
            context.report({
              node: property,
              message: `Thick one-sided border (${width}px) - the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it`,
            });
        }
      }
    },
    JSXOpeningElement(node) {
      const classStr = getStringFromClassNameAttr(node);
      if (!classStr) return;
      const sideMatch = classStr.match(/\bborder-[lrse]-(\d+)\b/);
      if (!sideMatch) return;
      if (
        /\bborder-(?:(?:gray|slate|zinc|neutral|stone)-\d+|white|black|transparent)\b/.test(
          classStr,
        )
      )
        return;
      if (
        parseInt(sideMatch[1], 10) >=
        (/\brounded(?:-(?!none\b)\w+)?\b/.test(classStr) && !/\brounded-none\b/.test(classStr)
          ? 1
          : 4)
      )
        context.report({
          node,
          message: `Thick one-sided border (${sideMatch[0]}) - the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/security/no-swallowed-error.ts
const hasNoErrorParam = (node) => !node.param;
const noSwallowedError = defineRule({
  recommendation:
    "Handle caught errors with recovery, logging, or rethrowing; an empty catch only hides runtime evidence and lets broken states look fixed.",
  examples: [
    {
      before: `try { await save(); } catch (error) {}`,
      after: `try { await save(); } catch (error) { reportError(error); throw error; }`,
    },
  ],
  create: (context) => ({
    CatchClause(node) {
      if ((node.body?.body ?? []).length > 0) return;
      if (hasNoErrorParam(node)) return;
      context.report({
        node,
        message: "empty catch block swallows runtime evidence - log, recover, or rethrow the error",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-tiny-text.ts
const noTinyText = defineRule({
  recommendation:
    "Keep body text and inputs at least 16px on mobile, stepping down only at larger breakpoints when appropriate.",
  examples: [
    {
      before: `<p style={{ fontSize: 12 }}>Details</p>`,
      after: `<p className="text-base sm:text-sm">Details</p>`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        if (getStylePropertyKey(property) !== "fontSize") continue;
        let pxValue = null;
        const numValue = getStylePropertyNumberValue(property);
        const strValue = getStylePropertyStringValue(property);
        if (numValue !== null) pxValue = numValue;
        else if (strValue !== null) {
          const pxMatch = strValue.match(/^([\d.]+)px$/);
          if (pxMatch) pxValue = parseFloat(pxMatch[1]);
          const remMatch = strValue.match(/^([\d.]+)rem$/);
          if (remMatch) pxValue = parseFloat(remMatch[1]) * 16;
        }
        if (pxValue !== null && pxValue > 0 && pxValue < 12)
          context.report({
            node: property,
            message: `Font size ${pxValue}px is too small - body text should be at least 12px for readability, 16px is ideal`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-transition-all.ts
const noTransitionAll = defineRule({
  recommendation:
    "Replace transition: all with an explicit property list such as transform and opacity.",
  examples: [
    {
      before: `transition: all 200ms;`,
      after: `transition: transform 200ms, opacity 200ms;`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      for (const property of expression.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if ((isNodeOfType(property.key, "Identifier") ? property.key.name : null) !== "transition")
          continue;
        if (
          isNodeOfType(property.value, "Literal") &&
          typeof property.value.value === "string" &&
          property.value.value.startsWith("all")
        )
          context.report({
            node: property,
            message:
              'transition: "all" animates every property including layout - list only the properties you animate',
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/no-uncontrolled-input.ts
const noUncontrolledInput = defineRule({
  recommendation:
    "Choose controlled inputs with value/onChange or uncontrolled inputs with defaultValue, but do not mix the two modes.",
  examples: [
    {
      before: `<input value={value} defaultValue="A" />`,
      after: `<input value={value} onChange={setValue} />`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody) return;
      const undefinedInitialStateNames = isNodeOfType(componentBody, "BlockStatement")
        ? collectUndefinedInitialStateNames(componentBody)
        : /* @__PURE__ */ new Set();
      walkAst(componentBody, (child) => {
        if (!isNodeOfType(child, "JSXOpeningElement")) return;
        if (!isNodeOfType(child.name, "JSXIdentifier")) return;
        const tagName = child.name.name;
        if (!UNCONTROLLED_INPUT_TAGS.has(tagName)) return;
        const attributes = child.attributes ?? [];
        if (hasJsxSpreadAttribute(attributes)) return;
        const valueAttribute = findJsxAttribute(attributes, "value");
        if (!valueAttribute) return;
        if (tagName === "input") {
          const inputType = getInputTypeLiteral(attributes);
          if (inputType !== null && VALUE_BYPASS_INPUT_TYPES.has(inputType)) return;
        }
        const hasAllowedPartner = VALUE_PARTNER_ATTRIBUTES.some((partnerAttributeName) =>
          findJsxAttribute(attributes, partnerAttributeName),
        );
        if (
          isNodeOfType(valueAttribute.value, "JSXExpressionContainer") &&
          isNodeOfType(valueAttribute.value.expression, "Identifier") &&
          undefinedInitialStateNames.has(valueAttribute.value.expression.name)
        ) {
          const stateName = valueAttribute.value.expression.name;
          const partnerHint = hasAllowedPartner
            ? "Initialize useState with an explicit value"
            : "Initialize useState with an explicit value AND add onChange (or readOnly)";
          context.report({
            node: child,
            message: `<${tagName} value={${stateName}}> - "${stateName}" is initialized as undefined (uncontrolled), then becomes controlled on first set; React warns about this flip. ${partnerHint} (e.g. \`useState("")\`)`,
          });
          return;
        }
        if (findJsxAttribute(attributes, "defaultValue")) {
          context.report({
            node: child,
            message: `<${tagName}> sets both \`value\` and \`defaultValue\` - defaultValue is ignored on a controlled input; remove one`,
          });
          return;
        }
        if (!hasAllowedPartner)
          context.report({
            node: child,
            message: `<${tagName} value={...}> with no \`onChange\` or \`readOnly\` - React renders this as a silently read-only field`,
          });
      });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/no-undeferred-third-party.ts
const noUndeferredThirdParty = defineRule({
  recommendation:
    "Load analytics, embeds, and other third-party scripts after hydration or user intent using a deferred framework strategy.",
  examples: [
    {
      before: `<script src="https://analytics.example/script.js" />`,
      after: `<Script src="https://analytics.example/script.js" strategy="afterInteractive" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "script") return;
      const attributes = node.attributes ?? [];
      if (!findJsxAttribute(attributes, "src")) return;
      if (!hasJsxAttribute(attributes, "defer") && !hasJsxAttribute(attributes, "async"))
        context.report({
          node,
          message:
            "Synchronous <script> with src - add defer or async to avoid blocking first paint",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/no-usememo-simple-expression.ts
const noUsememoSimpleExpression = defineRule({
  recommendation:
    "Remove useMemo around cheap primitive expressions; memoize only measured expensive work or unstable identities passed to memoized children.",
  examples: [
    {
      before: `const isOpen = useMemo(() => count > 0, [count]);`,
      after: `const isOpen = count > 0;`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, "useMemo")) return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      if (
        !isNodeOfType(callback, "ArrowFunctionExpression") &&
        !isNodeOfType(callback, "FunctionExpression")
      )
        return;
      let returnExpression = null;
      if (!isNodeOfType(callback.body, "BlockStatement")) returnExpression = callback.body;
      else if (
        callback.body.body?.length === 1 &&
        isNodeOfType(callback.body.body[0], "ReturnStatement")
      )
        returnExpression = callback.body.body[0].argument;
      if (returnExpression && isTriviallyCheapExpression(returnExpression))
        context.report({
          node,
          message:
            "useMemo wrapping a trivially cheap expression - memo overhead exceeds the computation",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-wide-letter-spacing.ts
const noWideLetterSpacing = defineRule({
  recommendation:
    "Avoid wide tracking on body and small text; reserve tight or subtle tracking for display headings.",
  examples: [
    {
      before: `<p className="tracking-widest text-xs" />`,
      after: `<p className="tracking-normal text-sm" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      let isUppercase = false;
      let letterSpacingProperty = null;
      let letterSpacingEm = null;
      for (const property of expression.properties ?? []) {
        const key = getStylePropertyKey(property);
        if (!key) continue;
        if (key === "textTransform") {
          if (getStylePropertyStringValue(property) === "uppercase") isUppercase = true;
        }
        if (key === "letterSpacing") {
          letterSpacingProperty = property;
          const strValue = getStylePropertyStringValue(property);
          const numValue = getStylePropertyNumberValue(property);
          if (strValue) {
            const emMatch = strValue.match(/^([\d.]+)em$/);
            if (emMatch) letterSpacingEm = parseFloat(emMatch[1]);
            const pxMatch = strValue.match(/^([\d.]+)px$/);
            if (pxMatch) letterSpacingEm = parseFloat(pxMatch[1]) / 16;
          }
          if (numValue !== null && numValue > 0) letterSpacingEm = numValue / 16;
        }
      }
      if (
        !isUppercase &&
        letterSpacingProperty &&
        letterSpacingEm !== null &&
        letterSpacingEm > 0.05
      )
        context.report({
          node: letterSpacingProperty,
          message: `Letter spacing ${letterSpacingEm.toFixed(2)}em on body text disrupts natural character groupings. Reserve wide tracking for short uppercase labels only`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/design/no-z-index-9999.ts
const noZIndex9999 = defineRule({
  recommendation:
    "Use a small named z-index scale and fix stacking contexts instead of escalating to arbitrary extreme z-index values.",
  examples: [
    {
      before: `style={{ zIndex: 9999 }}`,
      after: `className="z-popover"`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const expression = getInlineStyleExpression(node);
      if (!expression) return;
      for (const property of expression.properties ?? []) {
        if (getStylePropertyKey(property) !== "zIndex") continue;
        const zValue = getStylePropertyNumberValue(property);
        if (zValue !== null && Math.abs(zValue) >= 100)
          context.report({
            node: property,
            message: `z-index: ${zValue} is arbitrarily high - use a deliberate z-index scale (1-50). Extreme values signal a stacking context problem, not a fix`,
          });
      }
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (
        !isNodeOfType(node.callee.property, "Identifier") ||
        node.callee.property.name !== "create"
      )
        return;
      if (
        !isNodeOfType(node.callee.object, "Identifier") ||
        node.callee.object.name !== "StyleSheet"
      )
        return;
      const argument = node.arguments?.[0];
      if (!argument || !isNodeOfType(argument, "ObjectExpression")) return;
      walkAst(argument, (child) => {
        if (!isNodeOfType(child, "Property")) return;
        if (getStylePropertyKey(child) !== "zIndex") return;
        if (isNodeOfType(child.value, "Literal") && typeof child.value.value === "number") {
          const zValue = child.value.value;
          if (Math.abs(zValue) >= 100)
            context.report({
              node: child,
              message: `z-index: ${zValue} is arbitrarily high - use a deliberate z-index scale (1-50). Extreme values signal a stacking context problem, not a fix`,
            });
        }
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/prefer-dynamic-import.ts
const preferDynamicImport = defineRule({
  recommendation:
    "Load heavy libraries with dynamic import at the route, interaction, or feature boundary where they are actually needed.",
  examples: [
    {
      before: `import MonacoEditor from "monaco-editor";`,
      after: `const MonacoEditor = dynamic(() => import("monaco-editor"));`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (typeof source === "string" && HEAVY_LIBRARIES.has(source))
        context.report({
          node,
          message: `"${source}" is a heavy library - use React.lazy() or next/dynamic for code splitting`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/prefer-use-effect-event.ts
const preferUseEffectEvent = defineRule({
  recommendation:
    "Use useEffectEvent for non-reactive logic read from an effect, especially callbacks that need latest props without re-subscribing.",
  examples: [
    {
      before: `useEffect(() => { log(cart.length); }, [cart, log]);`,
      after: `const logEvent = useEffectEvent(log);
useEffect(() => { logEvent(cart.length); }, [cart]);`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const functionTypedLocalBindings = collectFunctionTypedLocalBindings(componentBody);
      for (const statement of componentBody.body ?? []) {
        if (!isNodeOfType(statement, "ExpressionStatement")) continue;
        const effectCall = statement.expression;
        if (!isNodeOfType(effectCall, "CallExpression")) continue;
        if (!isHookCall(effectCall, EFFECT_HOOK_NAMES)) continue;
        if ((effectCall.arguments?.length ?? 0) < 2) continue;
        const depsNode = effectCall.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) continue;
        const depElements = depsNode.elements ?? [];
        if (depElements.length < 2) continue;
        if (!depElements.every((element) => isNodeOfType(element, "Identifier"))) continue;
        const callback = getEffectCallback(effectCall);
        if (!callback) continue;
        for (const depElement of depElements) {
          if (!depElement) continue;
          const depName = depElement.name;
          const isFunctionTypedPropDep =
            propStackTracker.isPropName(depName) && REACT_HANDLER_PROP_PATTERN.test(depName);
          const isFunctionTypedLocalDep = functionTypedLocalBindings.has(depName);
          if (!isFunctionTypedPropDep && !isFunctionTypedLocalDep) continue;
          const classification = classifyCallableReadsInsideEffect(depName, callback);
          if (!classification.hasAnyRead) continue;
          if (!classification.allReadsAreInSubHandlers) continue;
          const subHandlerLabel = classification.firstSubHandlerName
            ? `\`${classification.firstSubHandlerName}\``
            : "an async sub-handler";
          context.report({
            node: depElement,
            message: `"${depName}" is read only inside ${subHandlerLabel} - wrap it with useEffectEvent and remove it from the dep array so the effect doesn't re-synchronize on every parent render`,
          });
        }
      }
    };
    const propStackTracker = createComponentPropStackTracker({ onComponentEnter: checkComponent });
    return propStackTracker.visitors;
  },
});
//#endregion
//#region src/core/rules/lint/react/prefer-use-sync-external-store.ts
const preferUseSyncExternalStore = defineRule({
  recommendation:
    "Subscribe to external stores with useSyncExternalStore so concurrent rendering gets consistent snapshots and cleanup.",
  examples: [
    {
      before: `useEffect(() => store.subscribe(forceUpdate), []);`,
      after: `const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const useStateBindings = collectUseStateBindings(componentBody);
      if (useStateBindings.length === 0) return;
      const useStateInitializerByValueName = /* @__PURE__ */ new Map();
      for (const binding of useStateBindings) {
        const initializerArgument = binding.declarator.init?.arguments?.[0];
        if (!initializerArgument) continue;
        if (
          (isNodeOfType(initializerArgument, "ArrowFunctionExpression") ||
            isNodeOfType(initializerArgument, "FunctionExpression")) &&
          !isNodeOfType(initializerArgument.body, "BlockStatement")
        )
          useStateInitializerByValueName.set(binding.valueName, initializerArgument.body);
        else useStateInitializerByValueName.set(binding.valueName, initializerArgument);
      }
      const setterNameToValueName = /* @__PURE__ */ new Map();
      for (const binding of useStateBindings)
        setterNameToValueName.set(binding.setterName, binding.valueName);
      for (const effectCall of findUseEffectsInComponent(componentBody)) {
        if ((effectCall.arguments?.length ?? 0) < 2) continue;
        const depsNode = effectCall.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) continue;
        if ((depsNode.elements?.length ?? 0) !== 0) continue;
        const callback = getEffectCallback(effectCall);
        if (!callback || !isNodeOfType(callback.body, "BlockStatement")) continue;
        const effectBodyStatements = callback.body.body ?? [];
        if (effectBodyStatements.length < 2) continue;
        const subscription = findSubscriptionCall(effectBodyStatements);
        if (!subscription) continue;
        const handler = getSubscriptionHandlerArgument(subscription.call, effectBodyStatements);
        if (!handler) continue;
        const setterPayload = getSingleSetterCallFromHandler(handler);
        if (!setterPayload) continue;
        const valueName = setterNameToValueName.get(setterPayload.setterName);
        if (!valueName) continue;
        const useStateInitializer = useStateInitializerByValueName.get(valueName);
        if (!useStateInitializer) continue;
        if (!areExpressionsStructurallyEqual(useStateInitializer, setterPayload.setterArgument))
          continue;
        if (!cleanupReleasesSubscription(effectBodyStatements, subscription.boundUnsubscribeName))
          continue;
        const matchingBinding = useStateBindings.find((binding) => binding.valueName === valueName);
        context.report({
          node: matchingBinding?.declarator ?? effectCall,
          message: `useState "${valueName}" is synchronized with an external store via useEffect - replace this useState + useEffect pair with useSyncExternalStore(subscribe, getSnapshot) to avoid tearing during concurrent renders`,
        });
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/prefer-usereducer.ts
const preferUseReducer = defineRule({
  recommendation:
    "Replace clusters of related useState setters with a reducer so transitions are explicit and multi-field updates happen together.",
  examples: [
    {
      before: `setFirstName(first);
setLastName(last);
setDirty(true);`,
      after: `dispatch({ type: "profileChanged", first, last });`,
    },
  ],
  create: (context) => {
    const reportExcessiveUseState = (body, componentName) => {
      if (!isNodeOfType(body, "BlockStatement")) return;
      let useStateCount = 0;
      for (const statement of body.body ?? []) {
        if (!isNodeOfType(statement, "VariableDeclaration")) continue;
        for (const declarator of statement.declarations ?? [])
          if (isHookCall(declarator.init, "useState")) useStateCount++;
      }
      if (useStateCount >= 5)
        context.report({
          node: body,
          message: `Component "${componentName}" has ${useStateCount} useState calls - consider useReducer for related state`,
        });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        reportExcessiveUseState(node.body, node.id.name);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        reportExcessiveUseState(node.init.body, node.id.name);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-query/utils/query-key-property-names.ts
const QUERY_KEY_PROPERTY_NAMES = new Set(["queryKey", "mutationKey"]);
//#endregion
//#region src/core/rules/lint/tanstack-query/utils/contains-unstable-query-key-value.ts
const containsUnstableQueryKeyValue = (node) => {
  if (!node) return null;
  let unstableSource = null;
  walkAst(node, (child) => {
    if (unstableSource) return false;
    if (
      isNodeOfType(child, "FunctionExpression") ||
      isNodeOfType(child, "ArrowFunctionExpression")
    ) {
      unstableSource = "function value";
      return false;
    }
    if (
      isNodeOfType(child, "NewExpression") &&
      isNodeOfType(child.callee, "Identifier") &&
      child.callee.name === "Date"
    ) {
      unstableSource = "new Date()";
      return false;
    }
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      isNodeOfType(child.callee.property, "Identifier")
    ) {
      const receiverName = child.callee.object.name;
      const methodName = child.callee.property.name;
      if (receiverName === "Date" && methodName === "now") unstableSource = "Date.now()";
      if (receiverName === "Math" && methodName === "random") unstableSource = "Math.random()";
      if (receiverName === "crypto" && methodName === "randomUUID")
        unstableSource = "crypto.randomUUID()";
      if (unstableSource) return false;
    }
  });
  return unstableSource;
};
//#endregion
//#region src/core/rules/lint/tanstack-query/query-mutation-missing-invalidation.ts
const queryMutationMissingInvalidation = defineRule({
  recommendation:
    "Invalidate, update, or remove affected queries after mutations so cached data stays correct.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !TANSTACK_MUTATION_HOOKS.has(calleeName)) return;
      const optionsArgument = node.arguments?.[0];
      if (!isNodeOfType(optionsArgument, "ObjectExpression")) return;
      if (
        !optionsArgument.properties?.some(
          (property) =>
            isNodeOfType(property, "Property") &&
            isNodeOfType(property.key, "Identifier") &&
            property.key.name === "mutationFn",
        )
      )
        return;
      let hasCacheUpdate = false;
      walkAst(optionsArgument, (child) => {
        if (hasCacheUpdate) return false;
        if (
          isNodeOfType(child, "CallExpression") &&
          isNodeOfType(child.callee, "MemberExpression") &&
          isNodeOfType(child.callee.property, "Identifier") &&
          QUERY_CACHE_UPDATE_METHODS.has(child.callee.property.name)
        ) {
          hasCacheUpdate = true;
          return false;
        }
      });
      if (!hasCacheUpdate)
        context.report({
          node,
          message:
            "useMutation without a cache update - stale data may remain after the mutation. Call queryClient.invalidateQueries / setQueryData / resetQueries / refetchQueries inside onSuccess (or trigger a router refresh)",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-unstable-deps.ts
const queryNoUnstableDeps = defineRule({
  recommendation:
    "Do not put the whole TanStack Query result object in React dependency arrays; destructure the stable fields you need and depend on those fields.",
  examples: [
    {
      before: `const query = useQuery(options);\nuseEffect(() => sync(query.data), [query]);`,
      after: `const { data } = useQuery(options);\nuseEffect(() => sync(data), [data]);`,
    },
  ],
  create: (context) => {
    const queryResultBindings = /* @__PURE__ */ new Set();
    return {
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        if (!isNodeOfType(node.init, "CallExpression")) return;
        const calleeName = isNodeOfType(node.init.callee, "Identifier")
          ? node.init.callee.name
          : null;
        if (!calleeName || !TANSTACK_QUERY_HOOKS.has(calleeName)) return;
        queryResultBindings.add(node.id.name);
      },
      ArrayExpression(node) {
        for (const element of node.elements ?? []) {
          if (!isNodeOfType(element, "Identifier") || !queryResultBindings.has(element.name))
            continue;
          context.report({
            node: element,
            message: `TanStack Query result "${element.name}" is unstable in dependency arrays - destructure the specific field such as data or status`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-unstable-query-key.ts
const queryNoUnstableQueryKey = defineRule({
  recommendation:
    "Keep TanStack Query keys deterministic and serializable; put changing inputs in stable primitives and never use time, random values, or functions in queryKey.",
  examples: [
    {
      before: `useQuery({ queryKey: ["todos", Date.now()], queryFn });`,
      after: `useQuery({ queryKey: ["todos", userId], queryFn });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !TANSTACK_QUERY_HOOKS.has(calleeName)) return;
      const optionsArgument = node.arguments?.[0];
      if (!isNodeOfType(optionsArgument, "ObjectExpression")) return;
      for (const propertyName of QUERY_KEY_PROPERTY_NAMES) {
        const keyProperty = getObjectProperty(optionsArgument, propertyName);
        if (!keyProperty) continue;
        const unstableSource = containsUnstableQueryKeyValue(keyProperty?.value);
        if (!unstableSource) continue;
        context.report({
          node: keyProperty,
          message: `${propertyName} contains ${unstableSource} - query keys must be deterministic so cache identity stays stable`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-query-in-effect.ts
const queryNoQueryInEffect = defineRule({
  recommendation:
    "Call query hooks during render and use enabled or dependent queries instead of starting queries inside effects.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      walkAst(callback, (child) => {
        if (!isNodeOfType(child, "CallExpression")) return;
        if ((isNodeOfType(child.callee, "Identifier") ? child.callee.name : null) === "refetch")
          context.report({
            node: child,
            message:
              "refetch() inside useEffect - React Query manages refetching automatically. Use queryKey dependencies or the enabled option instead",
          });
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-rest-destructuring.ts
const queryNoRestDestructuring = defineRule({
  recommendation:
    "Destructure only the query result fields you need so tracked properties and memoization remain precise.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => ({
    VariableDeclarator(node) {
      if (!isNodeOfType(node.id, "ObjectPattern")) return;
      if (!isNodeOfType(node.init, "CallExpression")) return;
      const calleeName = isNodeOfType(node.init.callee, "Identifier")
        ? node.init.callee.name
        : null;
      if (!calleeName || !TANSTACK_QUERY_HOOKS.has(calleeName)) return;
      if (node.id.properties?.some((property) => isNodeOfType(property, "RestElement")))
        context.report({
          node: node.id,
          message: `Rest destructuring on ${calleeName}() result - subscribes to all fields and causes unnecessary re-renders. Destructure only the fields you need`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-usequery-for-mutation.ts
const queryNoUseQueryForMutation = defineRule({
  recommendation: "Use useMutation for writes and useQuery only for idempotent reads.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !TANSTACK_QUERY_HOOKS.has(calleeName)) return;
      const optionsArgument = node.arguments?.[0];
      if (!isNodeOfType(optionsArgument, "ObjectExpression")) return;
      const queryFnProperty = optionsArgument.properties?.find(
        (property) =>
          isNodeOfType(property, "Property") &&
          isNodeOfType(property.key, "Identifier") &&
          property.key.name === "queryFn",
      );
      if (!queryFnProperty?.value) return;
      let hasMutatingFetch = false;
      walkAst(queryFnProperty.value, (child) => {
        if (hasMutatingFetch) return;
        if (!isNodeOfType(child, "CallExpression")) return;
        if (!isNodeOfType(child.callee, "Identifier") || child.callee.name !== "fetch") return;
        const optionsArg = child.arguments?.[1];
        if (!isNodeOfType(optionsArg, "ObjectExpression")) return;
        if (
          optionsArg.properties?.find(
            (property) =>
              isNodeOfType(property, "Property") &&
              isNodeOfType(property.key, "Identifier") &&
              property.key.name === "method" &&
              isNodeOfType(property.value, "Literal") &&
              typeof property.value.value === "string" &&
              MUTATING_HTTP_METHODS.has(property.value.value.toUpperCase()),
          )
        )
          hasMutatingFetch = true;
      });
      if (hasMutatingFetch)
        context.report({
          node,
          message: `${calleeName}() with a mutating fetch (POST/PUT/DELETE) - use useMutation() instead, which provides onSuccess/onError callbacks and doesn't auto-refetch`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-no-void-query-fn.ts
const queryNoVoidQueryFn = defineRule({
  recommendation:
    "Return the fetched value from queryFn and move side effects to mutations or callbacks.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !TANSTACK_QUERY_HOOKS.has(calleeName)) return;
      const optionsArgument = node.arguments?.[0];
      if (!isNodeOfType(optionsArgument, "ObjectExpression")) return;
      const queryFnProperty = optionsArgument.properties?.find(
        (property) =>
          isNodeOfType(property, "Property") &&
          isNodeOfType(property.key, "Identifier") &&
          property.key.name === "queryFn",
      );
      if (!queryFnProperty?.value) return;
      const queryFnValue = queryFnProperty.value;
      if (
        isNodeOfType(queryFnValue, "ArrowFunctionExpression") &&
        !isNodeOfType(queryFnValue.body, "BlockStatement")
      )
        return;
      if (
        isNodeOfType(queryFnValue, "ArrowFunctionExpression") ||
        isNodeOfType(queryFnValue, "FunctionExpression")
      ) {
        const body = queryFnValue.body;
        if (!isNodeOfType(body, "BlockStatement")) return;
        if ((body.body ?? []).length === 0)
          context.report({
            node: queryFnProperty,
            message:
              "Empty queryFn - query functions must return a value. Use the enabled option to conditionally disable the query instead",
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-query/query-stable-query-client.ts
const queryStableQueryClient = defineRule({
  recommendation:
    "Create QueryClient once at module scope, lazy state initialization, or a provider boundary instead of recreating it on every render.",
  examples: [
    {
      before: `const result = useQuery({ queryKey: ["items"], queryFn: saveItem });`,
      after: `const mutation = useMutation({ mutationFn: saveItem, onSuccess: invalidateItems });`,
    },
  ],
  create: (context) => {
    let componentDepth = 0;
    let stableHookDepth = 0;
    return {
      FunctionDeclaration(node) {
        if (node.id?.name && UPPERCASE_PATTERN$1.test(node.id.name)) componentDepth++;
      },
      "FunctionDeclaration:exit"(node) {
        if (node.id?.name && UPPERCASE_PATTERN$1.test(node.id.name)) componentDepth--;
      },
      VariableDeclarator(node) {
        if (
          isNodeOfType(node.id, "Identifier") &&
          UPPERCASE_PATTERN$1.test(node.id.name) &&
          (isNodeOfType(node.init, "ArrowFunctionExpression") ||
            isNodeOfType(node.init, "FunctionExpression"))
        )
          componentDepth++;
      },
      "VariableDeclarator:exit"(node) {
        if (
          isNodeOfType(node.id, "Identifier") &&
          UPPERCASE_PATTERN$1.test(node.id.name) &&
          (isNodeOfType(node.init, "ArrowFunctionExpression") ||
            isNodeOfType(node.init, "FunctionExpression"))
        )
          componentDepth--;
      },
      CallExpression(node) {
        if (isHookCall(node, STABLE_HOOK_WRAPPERS)) stableHookDepth++;
      },
      "CallExpression:exit"(node) {
        if (isHookCall(node, STABLE_HOOK_WRAPPERS))
          stableHookDepth = Math.max(0, stableHookDepth - 1);
      },
      NewExpression(node) {
        if (componentDepth <= 0) return;
        if (stableHookDepth > 0) return;
        if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "QueryClient") return;
        context.report({
          node,
          message:
            "new QueryClient() inside a component - creates a new cache on every render. Move to module scope or wrap in useState(() => new QueryClient())",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-three-fiber/utils/three-allocating-constructors.ts
const THREE_ALLOCATING_CONSTRUCTORS = new Set([
  "Box3",
  "BufferGeometry",
  "Color",
  "Euler",
  "Group",
  "Matrix4",
  "Mesh",
  "Object3D",
  "Quaternion",
  "Raycaster",
  "Vector2",
  "Vector3",
]);
//#endregion
//#region src/core/rules/lint/react-three-fiber/utils/is-use-frame-call.ts
const isUseFrameCall = (node) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "Identifier") &&
  node.callee.name === "useFrame";
//#endregion
//#region src/core/rules/lint/react-three-fiber/r3f-no-clone-in-frame.ts
const r3fNoCloneInFrame = defineRule({
  recommendation:
    "Do not call .clone() inside useFrame; clone allocates every frame, so copy into a reused object instead.",
  examples: [
    {
      before: `useFrame(() => { target.current = position.clone(); });`,
      after: `useFrame(() => { target.current.copy(position); });`,
    },
  ],
  create: (context) => {
    let frameDepth = 0;
    return {
      CallExpression(node) {
        if (isUseFrameCall(node)) {
          frameDepth++;
          return;
        }
        if (frameDepth === 0) return;
        if (!isNodeOfType(node.callee, "MemberExpression")) return;
        if (
          !isNodeOfType(node.callee.property, "Identifier") ||
          node.callee.property.name !== "clone"
        )
          return;
        context.report({
          node,
          message:
            ".clone() inside useFrame allocates every frame - copy into a reused vector/object instead",
        });
      },
      "CallExpression:exit"(node) {
        if (isUseFrameCall(node)) frameDepth = Math.max(0, frameDepth - 1);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-three-fiber/r3f-no-new-in-frame.ts
const r3fNoNewInFrame = defineRule({
  recommendation:
    "Do not allocate Three.js objects inside useFrame; reuse refs or module-scope scratch objects so the render loop does not create garbage every frame.",
  examples: [
    {
      before: `useFrame(() => { mesh.position.copy(new Vector3(x, y, z)); });`,
      after: `const scratch = new Vector3();\nuseFrame(() => { mesh.position.copy(scratch.set(x, y, z)); });`,
    },
  ],
  create: (context) => {
    let frameDepth = 0;
    return {
      CallExpression(node) {
        if (isUseFrameCall(node)) frameDepth++;
      },
      "CallExpression:exit"(node) {
        if (isUseFrameCall(node)) frameDepth = Math.max(0, frameDepth - 1);
      },
      NewExpression(node) {
        if (frameDepth === 0) return;
        if (!isNodeOfType(node.callee, "Identifier")) return;
        if (!THREE_ALLOCATING_CONSTRUCTORS.has(node.callee.name)) return;
        context.report({
          node,
          message: `new ${node.callee.name}() inside useFrame allocates every frame - reuse a scratch object or ref`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-three-fiber/r3f-no-set-state-in-frame.ts
const r3fNoSetStateInFrame = defineRule({
  recommendation:
    "Do not call React state setters inside useFrame; put per-frame values in refs or external stores so the render loop does not force React renders.",
  examples: [
    {
      before: `useFrame(() => setRotation(mesh.current.rotation.y));`,
      after: `useFrame(() => { rotationRef.current = mesh.current.rotation.y; });`,
    },
  ],
  create: (context) => {
    let frameDepth = 0;
    return {
      CallExpression(node) {
        if (isUseFrameCall(node)) {
          frameDepth++;
          return;
        }
        if (frameDepth === 0 || !isSetterCall(node)) return;
        context.report({
          node,
          message:
            "React state update inside useFrame forces React work at frame rate - use a ref or external store for frame data",
        });
      },
      "CallExpression:exit"(node) {
        if (isUseFrameCall(node)) frameDepth = Math.max(0, frameDepth - 1);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/shadcn/utils/radix-primitive-import-pattern.ts
const RADIX_PRIMITIVE_IMPORT_PATTERN = /^@radix-ui\/react-/;
//#endregion
//#region src/core/rules/lint/shadcn/utils/has-truthy-as-child.ts
const hasTruthyAsChild = (openingElement) => {
  const asChild = findJsxAttribute(openingElement.attributes ?? [], "asChild");
  if (!asChild) return false;
  if (!asChild.value) return true;
  if (isNodeOfType(asChild.value, "Literal")) return asChild.value.value !== false;
  const expression = asChild.value.expression;
  if (isNodeOfType(expression, "Literal")) return expression.value !== false;
  return Boolean(expression);
};
//#endregion
//#region src/core/rules/lint/shadcn/utils/get-meaningful-jsx-children.ts
const isJsxComment = (node) =>
  isNodeOfType(node, "JSXExpressionContainer") &&
  isNodeOfType(node.expression, "JSXEmptyExpression");
const getMeaningfulJsxChildren = (node) =>
  (node.children ?? []).filter((child) => {
    if (isNodeOfType(child, "JSXText")) return child.value.trim().length > 0;
    if (isJsxComment(child)) return false;
    return true;
  });
//#endregion
//#region src/core/rules/lint/shadcn/radix-aschild-single-child.ts
const radixAschildSingleChild = defineRule({
  recommendation:
    "Radix asChild must receive exactly one element child that can accept props and refs; wrap multiple children in a single component that forwards props.",
  examples: [
    {
      before: `<Button asChild><Link href="/a">A</Link><span>New</span></Button>`,
      after: `<Button asChild><Link href="/a">A <span>New</span></Link></Button>`,
    },
  ],
  create: (context) => ({
    JSXElement(node) {
      const openingElement = node.openingElement;
      if (!hasTruthyAsChild(openingElement)) return;
      const meaningfulChildren = getMeaningfulJsxChildren(node);
      if (meaningfulChildren.length === 1) {
        const onlyChild = meaningfulChildren[0];
        if (
          isNodeOfType(onlyChild, "JSXElement") ||
          isNodeOfType(onlyChild, "JSXExpressionContainer")
        )
          return;
      }
      const elementName = getJsxName$2(openingElement.name) ?? "component";
      context.report({
        node: openingElement,
        message: `${elementName} uses asChild but does not have exactly one element child - Radix can only clone a single prop-forwarding child`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/react-compiler-destructure-method.ts
const reactCompilerDestructureMethod = defineRule({
  recommendation:
    "Destructure only the methods needed from hook return objects so React Compiler and dependency analysis can see the stable values.",
  examples: [
    {
      before: `const router = useRouter();
router.push("/");`,
      after: `const { push } = useRouter();
push("/");`,
    },
  ],
  create: (context) => {
    const hookBindingMapStack = [];
    const isComponent = (node) => {
      if (isNodeOfType(node, "FunctionDeclaration"))
        return Boolean(node.id?.name && isUppercaseName(node.id.name));
      if (isNodeOfType(node, "VariableDeclarator")) return isComponentAssignment(node);
      return false;
    };
    const enter = (node) => {
      if (!isComponent(node)) return;
      const body = isNodeOfType(node, "FunctionDeclaration") ? node.body : node.init?.body;
      hookBindingMapStack.push(buildHookBindingMap(body));
    };
    const exit = (node) => {
      if (isComponent(node)) hookBindingMapStack.pop();
    };
    return {
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      VariableDeclarator: enter,
      "VariableDeclarator:exit": exit,
      MemberExpression(node) {
        if (hookBindingMapStack.length === 0) return;
        if (node.computed) return;
        if (!isNodeOfType(node.object, "Identifier")) return;
        if (!isNodeOfType(node.property, "Identifier")) return;
        const bindingName = node.object.name;
        const methodName = node.property.name;
        const hookSource = hookBindingMapStack[hookBindingMapStack.length - 1].get(bindingName);
        if (!hookSource) return;
        const allowedMethods = HOOK_OBJECTS_WITH_METHODS.get(hookSource);
        if (!allowedMethods || !allowedMethods.has(methodName)) return;
        if (!isNodeOfType(node.parent, "CallExpression") || node.parent.callee !== node) return;
        context.report({
          node,
          message: `Destructure for clarity: \`const { ${methodName} } = ${hookSource}()\` then call \`${methodName}(...)\` directly - easier for React Compiler to memoize and clearer about which methods this component depends on`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-hook-form/rhf-no-nested-object-setvalue.ts
const rhfNoNestedObjectSetvalue = defineRule({
  recommendation:
    "Call setValue with the exact field path you changed; passing nested objects bypasses React Hook Form's focused dirty/touched tracking.",
  examples: [
    {
      before: `setValue("user", { firstName: "Ada" });`,
      after: `setValue("user.firstName", "Ada");`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "setValue") return;
      const fieldName = node.arguments?.[0];
      const valueArgument = node.arguments?.[1];
      if (!isNodeOfType(fieldName, "Literal") || typeof fieldName.value !== "string") return;
      if (fieldName.value.includes(".")) return;
      if (!isNodeOfType(valueArgument, "ObjectExpression")) return;
      context.report({
        node,
        message: `setValue("${fieldName.value}", object) updates a nested object at once - target the exact field path instead`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-hook-form/rhf-no-watch-render.ts
const rhfNoWatchRender = defineRule({
  recommendation:
    "Use useWatch for render-time React Hook Form subscriptions; watch() in render subscribes broadly and can rerender the whole form.",
  examples: [
    {
      before: `const value = watch("email");`,
      after: `const value = useWatch({ control, name: "email" });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "watch") return;
      context.report({
        node,
        message:
          "watch() called during render - use useWatch({ control, name }) for a focused subscription",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/utils/js-bottom-sheet-packages.ts
const JS_BOTTOM_SHEET_PACKAGES = new Set([
  "@gorhom/bottom-sheet",
  "react-native-bottom-sheet",
  "react-native-modal-bottom-sheet",
  "react-native-raw-bottom-sheet",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/legacy-shadow-keys.ts
const LEGACY_SHADOW_KEYS = new Set([
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "elevation",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/list-row-press-handler-props.ts
const LIST_ROW_PRESS_HANDLER_PROPS = new Set([
  "onPress",
  "onLongPress",
  "onPressIn",
  "onPressOut",
  "onSelect",
  "onClick",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/resolve-jsx-element-name.ts
const resolveJsxElementName = (openingElement) => {
  const elementName = openingElement?.name;
  if (!elementName) return null;
  if (isNodeOfType(elementName, "JSXIdentifier")) return elementName.name;
  if (isNodeOfType(elementName, "JSXMemberExpression")) return elementName.property?.name ?? null;
  return null;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/non-native-navigator-packages.ts
const NON_NATIVE_NAVIGATOR_PACKAGES = new Set([
  "@react-navigation/stack",
  "@react-navigation/drawer",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/press-handler-prop-names.ts
const PRESS_HANDLER_PROP_NAMES = new Set(["onPressIn", "onPressOut"]);
//#endregion
//#region src/core/rules/lint/react-native/utils/react-native-web-dom-elements.ts
const REACT_NATIVE_WEB_DOM_ELEMENTS = new Set([
  "a",
  "aside",
  "article",
  "audio",
  "blockquote",
  "br",
  "button",
  "canvas",
  "code",
  "div",
  "em",
  "footer",
  "fieldset",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "iframe",
  "img",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "select",
  "small",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "textarea",
  "th",
  "thead",
  "tr",
  "ul",
  "video",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/scrollview-style-padding-keys.ts
const SCROLLVIEW_STYLE_PADDING_KEYS = new Set([
  "columnGap",
  "gap",
  "padding",
  "paddingBottom",
  "paddingHorizontal",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingVertical",
  "rowGap",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/reanimated-layout-keys.ts
const REANIMATED_LAYOUT_KEYS = new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "flex",
  "flexBasis",
  "flexGrow",
  "flexShrink",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/recyclable-list-names.ts
const RECYCLABLE_LIST_NAMES = new Set(["FlashList", "LegendList"]);
//#endregion
//#region src/core/rules/lint/react-native/utils/render-item-prop-names.ts
const RENDER_ITEM_PROP_NAMES = new Set([
  "renderItem",
  "renderSectionHeader",
  "renderSectionFooter",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/scrollview-names.ts
const SCROLLVIEW_NAMES = new Set(["ScrollView"]);
//#endregion
//#region src/core/rules/lint/react-native/utils/touchable-components.ts
const TOUCHABLE_COMPONENTS = new Set([
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
  "TouchableNativeFeedback",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/virtualized-list-names.ts
const VIRTUALIZED_LIST_NAMES = new Set([
  "FlatList",
  "FlashList",
  "LegendList",
  "SectionList",
  "VirtualizedList",
]);
//#endregion
//#region src/core/rules/lint/react-native/utils/detect-inline-row-handlers.ts
const detectInlineRowHandlers = (renderItemFn) => {
  const inlineHandlers = [];
  walkAst(renderItemFn.body, (child) => {
    if (!isNodeOfType(child, "JSXAttribute")) return;
    if (!isNodeOfType(child.name, "JSXIdentifier")) return;
    if (!LIST_ROW_PRESS_HANDLER_PROPS.has(child.name.name)) return;
    if (!isNodeOfType(child.value, "JSXExpressionContainer")) return;
    const expression = child.value.expression;
    if (
      isNodeOfType(expression, "ArrowFunctionExpression") ||
      isNodeOfType(expression, "FunctionExpression")
    )
      inlineHandlers.push(child);
  });
  return inlineHandlers;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/find-legacy-shadow-property.ts
const findLegacyShadowProperty = (objectExpression) => {
  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    if (!isNodeOfType(property.key, "Identifier")) continue;
    if (LEGACY_SHADOW_KEYS.has(property.key.name))
      return {
        keyName: property.key.name,
        node: property,
      };
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/find-returned-object.ts
const findReturnedObject = (callback) => {
  if (
    !isNodeOfType(callback, "ArrowFunctionExpression") &&
    !isNodeOfType(callback, "FunctionExpression")
  )
    return null;
  const body = callback.body;
  if (isNodeOfType(body, "ObjectExpression")) return body;
  if (!isNodeOfType(body, "BlockStatement")) return null;
  for (const stmt of body.body ?? [])
    if (isNodeOfType(stmt, "ReturnStatement") && isNodeOfType(stmt.argument, "ObjectExpression"))
      return stmt.argument;
  return null;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/truncate-text.ts
const truncateText = (text) => (text.length > 30 ? `${text.slice(0, 30)}...` : text);
//#endregion
//#region src/core/rules/lint/react-native/utils/get-raw-text-description.ts
const getRawTextDescription = (child) => {
  if (isNodeOfType(child, "JSXText")) return `"${truncateText(child.value.trim())}"`;
  if (isNodeOfType(child, "JSXExpressionContainer") && child.expression) {
    const expression = child.expression;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "string")
      return `"${truncateText(expression.value)}"`;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "number")
      return `{${expression.value}}`;
    if (isNodeOfType(expression, "TemplateLiteral")) return "template literal";
  }
  return "text content";
};
//#endregion
//#region src/core/rules/lint/react-native/utils/handler-mutates-identifier.ts
const handlerMutatesIdentifier = (handler, sharedValueBindings) => {
  if (
    !isNodeOfType(handler, "ArrowFunctionExpression") &&
    !isNodeOfType(handler, "FunctionExpression")
  )
    return false;
  if (sharedValueBindings.size === 0) return false;
  let didMutate = false;
  walkAst(handler.body, (child) => {
    if (didMutate) return;
    if (
      isNodeOfType(child, "AssignmentExpression") &&
      isNodeOfType(child.left, "MemberExpression") &&
      isNodeOfType(child.left.object, "Identifier") &&
      sharedValueBindings.has(child.left.object.name) &&
      isNodeOfType(child.left.property, "Identifier") &&
      child.left.property.name === "value"
    )
      didMutate = true;
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      sharedValueBindings.has(child.callee.object.name) &&
      isNodeOfType(child.callee.property, "Identifier") &&
      (child.callee.property.name === "set" || child.callee.property.name === "value")
    )
      didMutate = true;
  });
  return didMutate;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/is-inside-web-platform-branch.ts
const WEB_PLATFORM_NAME = "web";
const getStaticStringValue = (node) =>
  (node?.type === "Literal" || node?.type === "StringLiteral") && typeof node.value === "string"
    ? node.value
    : null;
const isPlatformOsExpression = (node) =>
  isNodeOfType(node, "MemberExpression") &&
  isNodeOfType(node.object, "Identifier") &&
  node.object.name === "Platform" &&
  isNodeOfType(node.property, "Identifier") &&
  node.property.name === "OS";
const isWebPlatformComparison = (node, expectedResult) => {
  if (!isNodeOfType(node, "BinaryExpression")) return false;
  if (
    node.operator !== "===" &&
    node.operator !== "==" &&
    node.operator !== "!==" &&
    node.operator !== "!="
  )
    return false;
  if (
    !(
      (isPlatformOsExpression(node.left) &&
        getStaticStringValue(node.right) === WEB_PLATFORM_NAME) ||
      (isPlatformOsExpression(node.right) && getStaticStringValue(node.left) === WEB_PLATFORM_NAME)
    )
  )
    return false;
  return (node.operator === "===" || node.operator === "==") === expectedResult;
};
const isSameOrDescendant = (node, ancestor) => {
  let currentNode = node;
  while (currentNode) {
    if (currentNode === ancestor) return true;
    currentNode = currentNode.parent;
  }
  return false;
};
const isInsideWebPlatformBranch = (node) => {
  let currentNode = node.parent;
  while (currentNode) {
    if (isNodeOfType(currentNode, "IfStatement")) {
      if (
        isSameOrDescendant(node, currentNode.consequent) &&
        isWebPlatformComparison(currentNode.test, true)
      )
        return true;
      if (
        isSameOrDescendant(node, currentNode.alternate) &&
        isWebPlatformComparison(currentNode.test, false)
      )
        return true;
    }
    if (isNodeOfType(currentNode, "ConditionalExpression")) {
      if (
        isSameOrDescendant(node, currentNode.consequent) &&
        isWebPlatformComparison(currentNode.test, true)
      )
        return true;
      if (
        isSameOrDescendant(node, currentNode.alternate) &&
        isWebPlatformComparison(currentNode.test, false)
      )
        return true;
    }
    if (isNodeOfType(currentNode, "LogicalExpression")) {
      if (
        currentNode.operator === "&&" &&
        isSameOrDescendant(node, currentNode.right) &&
        isWebPlatformComparison(currentNode.left, true)
      )
        return true;
      if (
        currentNode.operator === "||" &&
        isSameOrDescendant(node, currentNode.right) &&
        isWebPlatformComparison(currentNode.left, false)
      )
        return true;
    }
    currentNode = currentNode.parent;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/react-native/utils/is-web-only-path.ts
const WEB_FILE_EXTENSION_PATTERN = /\.web\.[jt]sx?$/;
const WEB_WORKSPACE_PATTERN = /\/(?:apps|packages|clients|services)\/web(?:-[a-z]+)?\//;
const WEB_ONLY_DIRECTORY_PATTERN =
  /\/(?:docusaurus|docs|documentation|website|storybook|\.storybook|stories|__docs__)\//;
const isWebOnlyPath = (filename) =>
  WEB_FILE_EXTENSION_PATTERN.test(filename) ||
  WEB_WORKSPACE_PATTERN.test(filename) ||
  WEB_ONLY_DIRECTORY_PATTERN.test(filename);
//#endregion
//#region src/core/rules/lint/react-native/utils/is-raw-text-content.ts
const isRawTextContent = (child) => {
  if (isNodeOfType(child, "JSXText")) return Boolean(child.value?.trim());
  if (!isNodeOfType(child, "JSXExpressionContainer") || !child.expression) return false;
  const expression = child.expression;
  return (
    (isNodeOfType(expression, "Literal") &&
      (typeof expression.value === "string" || typeof expression.value === "number")) ||
    isNodeOfType(expression, "TemplateLiteral")
  );
};
//#endregion
//#region src/core/rules/lint/react-native/utils/is-render-item-jsx-attribute.ts
const isRenderItemJsxAttribute = (parent) => {
  if (!isNodeOfType(parent, "JSXAttribute")) return false;
  return (isNodeOfType(parent.name, "JSXIdentifier") ? parent.name.name : null) === "renderItem";
};
//#endregion
//#region src/core/rules/lint/react-native/utils/is-render-item-function.ts
const isRenderItemFunction = (node) => {
  const parent = node.parent;
  if (!isNodeOfType(parent, "JSXExpressionContainer")) return false;
  return isRenderItemJsxAttribute(parent.parent);
};
//#endregion
//#region src/core/rules/lint/react-native/utils/is-text-handling-component.ts
const isTextHandlingComponent = (elementName) => {
  if (REACT_NATIVE_TEXT_COMPONENTS.has(elementName)) return true;
  return [...REACT_NATIVE_TEXT_COMPONENT_KEYWORDS].some((keyword) => elementName.includes(keyword));
};
//#endregion
//#region src/core/rules/lint/react-native/utils/report-legacy-shadow-properties.ts
const reportLegacyShadowProperties = (objectExpression, context) => {
  const legacyShadowPropertyNames = [];
  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    const propertyName = isNodeOfType(property.key, "Identifier") ? property.key.name : null;
    if (propertyName && LEGACY_SHADOW_STYLE_PROPERTIES.has(propertyName))
      legacyShadowPropertyNames.push(propertyName);
  }
  if (legacyShadowPropertyNames.length === 0) return;
  const quotedPropertyNames = legacyShadowPropertyNames.map((name) => `"${name}"`).join(", ");
  context.report({
    node: objectExpression,
    message: `Legacy shadow style${legacyShadowPropertyNames.length > 1 ? "s" : ""} ${quotedPropertyNames} - use boxShadow for cross-platform shadows on the new architecture`,
  });
};
//#endregion
//#region src/core/rules/lint/react-native/expo-no-axios.ts
const expoNoAxios = defineRule({
  recommendation:
    "Use the platform fetch API in Expo apps instead of axios so networking stays aligned with Expo runtime behavior, AbortController, and standard Request/Response handling.",
  examples: [
    {
      before: `import axios from "axios";`,
      after: `const response = await fetch(url);`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "axios") return;
      context.report({
        node,
        message:
          "axios imported in Expo networking code - prefer fetch with explicit response.ok handling",
      });
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "require") return;
      const source = node.arguments?.[0];
      if (!isNodeOfType(source, "Literal") || source.value !== "axios") return;
      context.report({
        node,
        message:
          "axios required in Expo networking code - prefer fetch with explicit response.ok handling",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-animate-svg-wrapper.ts
const renderingAnimateSvgWrapper = defineRule({
  recommendation:
    "Animate a wrapper element or SVG group with transform-box and transform-origin instead of transforming the bare SVG element.",
  examples: [
    {
      before: `<svg className="animate-spin" />`,
      after: `<div className="animate-spin"><svg /></div>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "svg") return;
      if (
        node.attributes?.some(
          (attribute) =>
            isNodeOfType(attribute, "JSXAttribute") &&
            isNodeOfType(attribute.name, "JSXIdentifier") &&
            MOTION_ANIMATE_PROPS.has(attribute.name.name),
        )
      )
        context.report({
          node,
          message:
            "Animation props directly on <svg> - wrap in a <div> or <motion.div> for better rendering performance",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rendering-conditional-render.ts
const renderingConditionalRender = defineRule({
  recommendation:
    "Use ternaries or explicit null branches for JSX conditionals so falsy values like 0 do not accidentally render.",
  examples: [
    {
      before: `{items.length && <List items={items} />}`,
      after: `{items.length > 0 ? <List items={items} /> : null}`,
    },
  ],
  create: (context) => ({
    LogicalExpression(node) {
      if (node.operator !== "&&") return;
      if (!(isNodeOfType(node.right, "JSXElement") || isNodeOfType(node.right, "JSXFragment")))
        return;
      const left = node.left;
      if (!left) return;
      const isLengthMemberAccess =
        isNodeOfType(left, "MemberExpression") &&
        isNodeOfType(left.property, "Identifier") &&
        left.property.name === "length";
      const isNumericIdentifier = isNodeOfType(left, "Identifier") && isNumericName(left.name);
      if (isLengthMemberAccess || isNumericIdentifier)
        context.report({
          node,
          message:
            "Conditional rendering with a numeric value can render '0' - use `value > 0`, `Boolean(value)`, or a ternary",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-hoist-jsx.ts
const renderingHoistJsx = defineRule({
  recommendation:
    "Hoist static JSX out of components or memoize it only when it does not capture render-local values.",
  examples: [
    {
      before: `function App() { return <Icon />; }`,
      after: `const icon = <Icon />;
function App() { return icon; }`,
    },
  ],
  create: (context) => {
    let componentDepth = 0;
    const isComponentLike = (node) => {
      if (
        isNodeOfType(node, "FunctionDeclaration") &&
        node.id?.name &&
        isUppercaseName(node.id.name)
      )
        return true;
      if (isNodeOfType(node, "VariableDeclarator") && isComponentAssignment(node)) return true;
      return false;
    };
    const enter = (node) => {
      if (isComponentLike(node)) componentDepth++;
    };
    const exit = (node) => {
      if (isComponentLike(node)) componentDepth = Math.max(0, componentDepth - 1);
    };
    return {
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      VariableDeclarator: enter,
      "VariableDeclarator:exit": exit,
      VariableDeclaration(node) {
        if (componentDepth === 0) return;
        if (node.kind !== "const") return;
        for (const declarator of node.declarations ?? []) {
          const init = declarator.init;
          if (!init) continue;
          if (!isNodeOfType(init, "JSXElement") && !isNodeOfType(init, "JSXFragment")) continue;
          if (jsxReferencesLocalScope(init)) continue;
          const name = isNodeOfType(declarator.id, "Identifier") ? declarator.id.name : "<unnamed>";
          context.report({
            node: declarator,
            message: `Static JSX "${name}" inside a component - hoist to module scope so it isn't recreated each render`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/rendering-hydration-mismatch-time.ts
const renderingHydrationMismatchTime = defineRule({
  recommendation:
    "Move time, random, locale, and browser-only values to client-only state or render a stable server placeholder; do not silence real mismatches with suppressHydrationWarning.",
  examples: [
    {
      before: `<span>{new Date().toLocaleString()}</span>`,
      after: `<ClientTime />`,
    },
  ],
  create: (context) => ({
    JSXExpressionContainer(node) {
      if (!node.expression) return;
      const matched = NONDETERMINISTIC_RENDER_PATTERNS.find((pattern) =>
        pattern.matches(node.expression),
      );
      if (matched) {
        if (hasSuppressHydrationWarningAttribute(findOpeningElementOfChild(node))) return;
        context.report({
          node,
          message: `${matched.display} in JSX renders differently on server vs client - move it to client-only state or render a stable server placeholder instead of silencing the mismatch`,
        });
        return;
      }
      walkAst(node.expression, (child) => {
        for (const pattern of NONDETERMINISTIC_RENDER_PATTERNS)
          if (pattern.matches(child)) {
            if (hasSuppressHydrationWarningAttribute(findOpeningElementOfChild(node))) return;
            context.report({
              node: child,
              message: `${pattern.display} reachable from JSX renders differently on server vs client - move it to client-only state or render a stable server placeholder instead of silencing the mismatch`,
            });
            return;
          }
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-hydration-no-flicker.ts
const renderingHydrationNoFlicker = defineRule({
  recommendation:
    "Read client-only values before hydration with an inline script or server-provided value; do not mask the flash with suppressHydrationWarning or a mount-only effect.",
  examples: [
    {
      before: `useEffect(() => setTheme(localStorage.theme), []);`,
      after: `<script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.theme=localStorage.theme" }} />`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES) || (node.arguments?.length ?? 0) < 2) return;
      const depsNode = node.arguments[1];
      if (!isNodeOfType(depsNode, "ArrayExpression") || depsNode.elements?.length !== 0) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      const bodyStatements = isNodeOfType(callback.body, "BlockStatement")
        ? callback.body.body
        : [callback.body];
      if (!bodyStatements || bodyStatements.length !== 1) return;
      const soleStatement = bodyStatements[0];
      if (
        isNodeOfType(soleStatement, "ExpressionStatement") &&
        isSetterCall(soleStatement.expression)
      )
        context.report({
          node,
          message:
            "useEffect(setState, []) on mount causes a flash - read the value before hydration or provide a stable server value instead of masking the mismatch",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-script-defer-async.ts
const renderingScriptDeferAsync = defineRule({
  recommendation:
    "Add defer, async, type=module, or a framework Script strategy to non-critical scripts so parsing is not blocked.",
  examples: [
    {
      before: `<script src="/analytics.js"><\/script>`,
      after: `<script src="/analytics.js" async><\/script>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "script") return;
      const attributes = node.attributes ?? [];
      if (
        !attributes.some(
          (attribute) =>
            isNodeOfType(attribute, "JSXAttribute") &&
            isNodeOfType(attribute.name, "JSXIdentifier") &&
            attribute.name.name === "src",
        )
      )
        return;
      const typeAttribute = attributes.find(
        (attribute) =>
          isNodeOfType(attribute, "JSXAttribute") &&
          isNodeOfType(attribute.name, "JSXIdentifier") &&
          attribute.name.name === "type",
      );
      const typeValue = isNodeOfType(typeAttribute?.value, "Literal")
        ? typeAttribute.value.value
        : null;
      if (typeof typeValue === "string" && !EXECUTABLE_SCRIPT_TYPES.has(typeValue)) return;
      if (typeValue === "module") return;
      if (
        !attributes.some(
          (attribute) =>
            isNodeOfType(attribute, "JSXAttribute") &&
            isNodeOfType(attribute.name, "JSXIdentifier") &&
            SCRIPT_LOADING_ATTRIBUTES.has(attribute.name.name),
        )
      )
        context.report({
          node,
          message:
            "<script src> without defer or async - blocks HTML parsing and delays First Contentful Paint. Add defer for DOM-dependent scripts or async for independent ones",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rendering-svg-precision.ts
const renderingSvgPrecision = defineRule({
  recommendation:
    "Round excessive SVG numeric precision to the smallest value that preserves visual quality and reduces markup size.",
  examples: [
    {
      before: `<path d="M 0.1234567 1.9876543" />`,
      after: `<path d="M 0.12 1.99" />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (!SVG_PATH_ATTRIBUTES.has(node.name.name)) return;
      if (!isNodeOfType(node.value, "Literal")) return;
      const value = node.value.value;
      if (typeof value !== "string") return;
      if (!SVG_PATH_HIGH_PRECISION_PATTERN.test(value)) return;
      context.report({
        node,
        message: `SVG ${node.name.name} attribute uses 4+ decimal precision - truncate to 1-2 decimals to shrink markup with no visible difference`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-usetransition-loading.ts
const renderingUsetransitionLoading = defineRule({
  recommendation:
    "Use useTransition for non-urgent UI state and loading indicators so the current screen stays interactive during the transition.",
  examples: [
    {
      before: `const [loading, setLoading] = useState(false);`,
      after: `const [isPending, startTransition] = useTransition();`,
    },
  ],
  create: (context) => ({
    VariableDeclarator(node) {
      if (!isNodeOfType(node.id, "ArrayPattern") || !node.id.elements?.length) return;
      if (!node.init || !isHookCall(node.init, "useState")) return;
      if (!node.init.arguments?.length) return;
      const initializer = node.init.arguments[0];
      if (!isNodeOfType(initializer, "Literal") || initializer.value !== false) return;
      const stateVariableName = node.id.elements[0]?.name;
      if (!stateVariableName || !LOADING_STATE_PATTERN.test(stateVariableName)) return;
      context.report({
        node: node.init,
        message: `useState for "${stateVariableName}" - if this guards a state transition (not an async fetch), consider useTransition instead`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rerender-defer-reads-hook.ts
const rerenderDeferReadsHook = defineRule({
  recommendation:
    "Defer dynamic reads such as search params or storage until the callback that needs them so the component does not subscribe to every change.",
  examples: [
    {
      before: `const params = useSearchParams();
const onClick = () => track(params.get("ref"));`,
      after: `const onClick = () => track(new URLSearchParams(window.location.search).get("ref"));`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const bindings = findHookCallBindings(componentBody);
      if (bindings.length === 0) return;
      const handlerBindingNames = collectHandlerBindingNames(componentBody);
      for (const binding of bindings) {
        const referenceLocations = [];
        walkAst(componentBody, (child) => {
          if (child === binding.declarator.id) return;
          if (isNodeOfType(child, "Identifier") && child.name === binding.valueName)
            referenceLocations.push(child);
        });
        if (referenceLocations.length === 0) continue;
        if (!referenceLocations.every((ref) => isInsideEventHandler(ref, handlerBindingNames)))
          continue;
        context.report({
          node: binding.declarator,
          message: `${binding.hookName}() return is only read inside event handlers - defer the read into the handler (e.g. \`new URL(window.location.href).searchParams\`) so the component doesn't re-render on every URL change`,
        });
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/rerender-dependencies.ts
const rerenderDependencies = defineRule({
  recommendation:
    "Depend on primitives or stable memoized values instead of fresh objects, arrays, and functions in hook dependency arrays.",
  examples: [
    {
      before: `useEffect(sync, [user]);`,
      after: `useEffect(sync, [user.id]);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, HOOKS_WITH_DEPS) || node.arguments.length < 2) return;
      const depsNode = node.arguments[1];
      if (!isNodeOfType(depsNode, "ArrayExpression")) return;
      for (const element of depsNode.elements ?? []) {
        if (!element) continue;
        if (isNodeOfType(element, "ObjectExpression"))
          context.report({
            node: element,
            message:
              "Object literal in useEffect deps - creates new reference every render, causing infinite re-runs",
          });
        if (isNodeOfType(element, "ArrayExpression"))
          context.report({
            node: element,
            message:
              "Array literal in useEffect deps - creates new reference every render, causing infinite re-runs",
          });
        if (
          isNodeOfType(element, "ArrowFunctionExpression") ||
          isNodeOfType(element, "FunctionExpression")
        )
          context.report({
            node: element,
            message:
              "Inline function in useEffect deps - creates a new function reference every render, causing infinite re-runs. Hoist it out of the component or wrap it with useCallback",
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rerender-derived-state-from-hook.ts
const rerenderDerivedStateFromHook = defineRule({
  recommendation:
    "Subscribe to the derived boolean or threshold value instead of a continuously changing raw measurement when only the threshold matters.",
  examples: [
    {
      before: `const width = useWindowWidth();
const isMobile = width < 768;`,
      after: `const isMobile = useMediaQuery("(max-width: 767px)");`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const bindings = findThresholdDerivedBindings(componentBody);
      for (const binding of bindings)
        context.report({
          node: binding.declarator,
          message: `${binding.hookName}() returns a continuously-changing value but you only compare it to a threshold - use a media-query / threshold hook (e.g. \`useMediaQuery("(max-width: 767px)")\`) so the component re-renders only when the threshold flips`,
        });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/rerender-functional-setstate.ts
const rerenderFunctionalSetstate = defineRule({
  recommendation:
    "Use functional setState when the next value depends on the previous value so callbacks can stay stable and avoid stale closures.",
  examples: [
    {
      before: `setCount(count + 1);`,
      after: `setCount((previousCount) => previousCount + 1);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isSetterCall(node)) return;
      if (!node.arguments?.length) return;
      const calleeName = node.callee.name;
      const argument = node.arguments[0];
      const expectedStateName = deriveStateVariableName(calleeName);
      if (
        isNodeOfType(argument, "BinaryExpression") &&
        STATE_ARITHMETIC_OPERATORS.has(argument.operator) &&
        expectedStateName
      ) {
        const matchesExpected = (operand) =>
          isNodeOfType(operand, "Identifier") && operand.name === expectedStateName;
        const stateIdentifier = matchesExpected(argument.left)
          ? argument.left
          : matchesExpected(argument.right)
            ? argument.right
            : null;
        if (stateIdentifier) {
          context.report({
            node,
            message: `${calleeName}(${stateIdentifier.name} ${argument.operator} ...) - use functional update to avoid stale closures`,
          });
          return;
        }
      }
      if (
        isNodeOfType(argument, "UpdateExpression") &&
        (argument.operator === "++" || argument.operator === "--") &&
        isNodeOfType(argument.argument, "Identifier") &&
        argument.argument.name === expectedStateName
      ) {
        const display = argument.prefix
          ? `${argument.operator}${argument.argument.name}`
          : `${argument.argument.name}${argument.operator}`;
        context.report({
          node,
          message: `${calleeName}(${display}) - use functional update to avoid stale closures (and reading the post-increment value bug)`,
        });
        return;
      }
      if (expectedStateName && isNodeOfType(argument, "ArrayExpression")) {
        if (
          (argument.elements ?? []).some(
            (element) =>
              isNodeOfType(element, "SpreadElement") &&
              isNodeOfType(element.argument, "Identifier") &&
              element.argument.name === expectedStateName,
          )
        ) {
          context.report({
            node,
            message: `${calleeName}([...${expectedStateName}, ...]) - use functional update \`${calleeName}(prev => [...prev, ...])\` to avoid stale closures`,
          });
          return;
        }
      }
      if (expectedStateName && isNodeOfType(argument, "ObjectExpression")) {
        if (
          (argument.properties ?? []).some(
            (property) =>
              isNodeOfType(property, "SpreadElement") &&
              isNodeOfType(property.argument, "Identifier") &&
              property.argument.name === expectedStateName,
          )
        ) {
          context.report({
            node,
            message: `${calleeName}({ ...${expectedStateName}, ... }) - use functional update \`${calleeName}(prev => ({ ...prev, ... }))\` to avoid stale closures`,
          });
          return;
        }
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rerender-lazy-state-init.ts
const rerenderLazyStateInit = defineRule({
  recommendation:
    "Pass expensive initial state as a function to useState so React computes it only on initial mount.",
  examples: [
    {
      before: `const [index] = useState(buildIndex(items));`,
      after: `const [index] = useState(() => buildIndex(items));`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, "useState") || !node.arguments?.length) return;
      const initializer = node.arguments[0];
      if (!isNodeOfType(initializer, "CallExpression")) return;
      const calleeName = isNodeOfType(initializer.callee, "Identifier")
        ? initializer.callee.name
        : (initializer.callee?.property?.name ?? "fn");
      if (TRIVIAL_INITIALIZER_NAMES.has(calleeName)) return;
      context.report({
        node: initializer,
        message: `useState(${calleeName}()) calls initializer on every render - use useState(() => ${calleeName}()) for lazy initialization`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rerender-memo-before-early-return.ts
const rerenderMemoBeforeEarlyReturn = defineRule({
  recommendation:
    "Move expensive memoized work below early returns by extracting a child component or computing after the bail-out branch.",
  examples: [
    {
      before: `const avatar = useMemo(() => compute(user), [user]);
if (loading) return null;`,
      after: `if (loading) return null;
return <Avatar user={user} />;`,
    },
  ],
  create: (context) => {
    const inspectFunctionBody = (statements) => {
      let memoNode = null;
      for (const stmt of statements) {
        if (!memoNode) {
          if (!isNodeOfType(stmt, "VariableDeclaration")) continue;
          for (const declarator of stmt.declarations ?? []) {
            const init = declarator.init;
            if (
              isNodeOfType(init, "CallExpression") &&
              isHookCall(init, "useMemo") &&
              callbackReturnsJsx(init.arguments?.[0])
            ) {
              memoNode = declarator;
              break;
            }
          }
          continue;
        }
        if (isNodeOfType(stmt, "IfStatement") && containsEarlyReturn(stmt)) {
          context.report({
            node: memoNode,
            message:
              "useMemo returning JSX runs before an early return - extract the JSX into a memoized child component so the parent bails out before the subtree renders",
          });
          return;
        }
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!isUppercaseName(node.id?.name ?? "")) return;
        if (!isNodeOfType(node.body, "BlockStatement")) return;
        inspectFunctionBody(node.body.body ?? []);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        const body = node.init?.body;
        if (!isNodeOfType(body, "BlockStatement")) return;
        inspectFunctionBody(body.body ?? []);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/rerender-memo-with-default-value.ts
const rerenderMemoWithDefaultValue = defineRule({
  recommendation:
    "Hoist default object, array, and function prop values outside the component or use stable module-level constants.",
  examples: [
    {
      before: `function List({ items = [] }) {}`,
      after: `const EMPTY_ITEMS = [];
function List({ items = EMPTY_ITEMS }) {}`,
    },
  ],
  create: (context) => {
    const checkDefaultProps = (params) => {
      for (const param of params) {
        if (!isNodeOfType(param, "ObjectPattern")) continue;
        for (const property of param.properties ?? []) {
          if (
            !isNodeOfType(property, "Property") ||
            !isNodeOfType(property.value, "AssignmentPattern")
          )
            continue;
          const defaultValue = property.value.right;
          if (
            isNodeOfType(defaultValue, "ObjectExpression") &&
            defaultValue.properties?.length === 0
          )
            context.report({
              node: defaultValue,
              message:
                "Default prop value {} creates a new object reference every render - extract to a module-level constant",
            });
          if (isNodeOfType(defaultValue, "ArrayExpression") && defaultValue.elements?.length === 0)
            context.report({
              node: defaultValue,
              message:
                "Default prop value [] creates a new array reference every render - extract to a module-level constant",
            });
        }
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkDefaultProps(node.params ?? []);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkDefaultProps(node.init.params ?? []);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/rerender-state-only-in-handlers.ts
const rerenderStateOnlyInHandlers = defineRule({
  recommendation:
    "Avoid subscribing render to state that is only needed inside callbacks; read it on demand or store the transient value in a ref.",
  examples: [
    {
      before: `const params = useSearchParams();
const share = () => send(params.get("ref"));`,
      after: `const share = () => send(new URLSearchParams(location.search).get("ref"));`,
    },
  ],
  create: (context) => {
    const checkComponent = (componentBody) => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const bindings = collectUseStateBindings(componentBody);
      if (bindings.length === 0) return;
      const returnExpressions = collectReturnExpressions(componentBody);
      if (returnExpressions.length === 0) return;
      const dependencyGraph = buildLocalDependencyGraph(componentBody);
      const renderReachableNames = expandTransitiveDependencies(
        collectRenderReachableNames(returnExpressions),
        dependencyGraph,
      );
      for (const binding of bindings) {
        if (renderReachableNames.has(binding.valueName)) continue;
        let setterCalled = false;
        walkAst(componentBody, (child) => {
          if (setterCalled) return;
          if (
            isNodeOfType(child, "CallExpression") &&
            isNodeOfType(child.callee, "Identifier") &&
            child.callee.name === binding.setterName
          )
            setterCalled = true;
        });
        if (!setterCalled) continue;
        context.report({
          node: binding.declarator,
          message: `useState "${binding.valueName}" is updated but never read in the component's return - use useRef so updates don't trigger re-renders`,
        });
      }
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkComponent(node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/rerender-transitions-scroll.ts
const rerenderTransitionsScroll = defineRule({
  recommendation:
    "Use startTransition, throttling, or refs for high-frequency scroll and pointer updates so urgent input is not blocked.",
  examples: [
    {
      before: `onScroll={(event) => setY(event.currentTarget.scrollTop)}`,
      after: `onScroll={(event) => { yRef.current = event.currentTarget.scrollTop; }}`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isAddEventListenerCall(node)) return;
      const eventArg = node.arguments?.[0];
      if (!isNodeOfType(eventArg, "Literal")) return;
      const eventName = eventArg.value;
      if (typeof eventName !== "string" || !HIGH_FREQUENCY_DOM_EVENTS.has(eventName)) return;
      const handler = node.arguments?.[1];
      if (!handler) return;
      const setStateCall = handlerCallsSetState(handler);
      if (!setStateCall) return;
      let cursor = setStateCall.parent ?? null;
      while (cursor && cursor !== handler) {
        if (
          isNodeOfType(cursor, "CallExpression") &&
          isNodeOfType(cursor.callee, "Identifier") &&
          (cursor.callee.name === "startTransition" ||
            cursor.callee.name === "requestAnimationFrame" ||
            cursor.callee.name === "requestIdleCallback")
        )
          return;
        cursor = cursor.parent ?? null;
      }
      context.report({
        node: setStateCall,
        message: `setState in a "${eventName}" handler triggers re-renders at scroll/pointer frequency - wrap in startTransition (mark as non-urgent), use useDeferredValue, or stash in a ref + rAF throttle`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-animate-layout-property.ts
const rnAnimateLayoutProperty = defineRule({
  recommendation:
    "Animate transforms and opacity with Reanimated instead of layout properties that force repeated layout work.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "useAnimatedStyle")
        return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      const returnedObject = findReturnedObject(callback);
      if (!returnedObject) return;
      for (const property of returnedObject.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if (!isNodeOfType(property.key, "Identifier")) continue;
        if (!REANIMATED_LAYOUT_KEYS.has(property.key.name)) continue;
        context.report({
          node: property,
          message: `useAnimatedStyle animating "${property.key.name}" - layout properties run on the layout thread; use transform: [{ translateX/Y }, { scale }] or opacity for GPU-accelerated animation`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-animation-reaction-as-derived.ts
const rnAnimationReactionAsDerived = defineRule({
  recommendation:
    "Use derived shared values for pure derivations and reserve animated reactions for side effects.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "useAnimatedReaction")
        return;
      const reactionFn = node.arguments?.[1];
      if (!reactionFn) return;
      if (
        !isNodeOfType(reactionFn, "ArrowFunctionExpression") &&
        !isNodeOfType(reactionFn, "FunctionExpression")
      )
        return;
      const body = reactionFn.body;
      let singleAssignment = null;
      if (isNodeOfType(body, "BlockStatement")) {
        const statements = body.body ?? [];
        if (statements.length !== 1) return;
        const onlyStatement = statements[0];
        if (!isNodeOfType(onlyStatement, "ExpressionStatement")) return;
        singleAssignment = onlyStatement.expression;
      } else if (body) singleAssignment = body;
      if (!singleAssignment) return;
      if (!isNodeOfType(singleAssignment, "AssignmentExpression")) return;
      if (!isNodeOfType(singleAssignment.left, "MemberExpression")) return;
      if (!isNodeOfType(singleAssignment.left.property, "Identifier")) return;
      if (singleAssignment.left.property.name !== "value") return;
      context.report({
        node,
        message:
          "useAnimatedReaction body is a single shared-value assignment - useDerivedValue is shorter and tracks dependencies natively",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-bottom-sheet-prefer-native.ts
const rnBottomSheetPreferNative = defineRule({
  recommendation:
    "Use a native-backed bottom sheet implementation for gesture-heavy sheets instead of JS-only modal patterns.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (typeof source !== "string" || !JS_BOTTOM_SHEET_PACKAGES.has(source)) return;
      context.report({
        node,
        message: `${source} is a JS-implemented bottom sheet - for v7+ RN, prefer <Modal presentationStyle="formSheet"> for native gesture handling and snap points`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-list-callback-per-row.ts
const rnListCallbackPerRow = defineRule({
  recommendation:
    "Use stable row callbacks or pass item ids into a shared handler so each list row does not receive a new function every render.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => {
    const inspect = (node) => {
      if (!isRenderItemFunction(node)) return;
      const inlineHandlers = detectInlineRowHandlers(node);
      for (const handler of inlineHandlers) {
        const handlerName = isNodeOfType(handler.name, "JSXIdentifier")
          ? handler.name.name
          : "<handler>";
        context.report({
          node: handler,
          message: `Inline ${handlerName} arrow inside renderItem creates a fresh closure per row - hoist with useCallback at list scope and pass the row id as a primitive prop`,
        });
      }
    };
    return {
      ArrowFunctionExpression: inspect,
      FunctionExpression: inspect,
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-native/rn-list-data-mapped.ts
const rnListDataMapped = defineRule({
  recommendation:
    "Pass raw data to virtualized lists and transform items in renderItem or memoized selectors instead of mapping data inline.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = resolveJsxElementName(node);
      if (!elementName || !VIRTUALIZED_LIST_NAMES.has(elementName)) return;
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier") || attribute.name.name !== "data")
          continue;
        if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
        const expression = attribute.value.expression;
        if (!isNodeOfType(expression, "CallExpression")) continue;
        if (!isNodeOfType(expression.callee, "MemberExpression")) continue;
        if (!isNodeOfType(expression.callee.property, "Identifier")) continue;
        const methodName = expression.callee.property.name;
        if (methodName !== "map" && methodName !== "filter") continue;
        context.report({
          node: attribute,
          message: `<${elementName} data={items.${methodName}(...)}> allocates a fresh array per render - wrap in useMemo at list scope so the data reference stays stable across parent renders`,
        });
        return;
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-list-recyclable-without-types.ts
const rnListRecyclableWithoutTypes = defineRule({
  recommendation:
    "Provide stable item types or getItemType for recyclable lists so cells can be reused correctly.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = resolveJsxElementName(node);
      if (!elementName || !RECYCLABLE_LIST_NAMES.has(elementName)) return;
      let hasRecycleItemsEnabled = false;
      let hasGetItemType = false;
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        if (attribute.name.name === "recycleItems")
          if (!attribute.value) hasRecycleItemsEnabled = true;
          else if (
            isNodeOfType(attribute.value, "JSXExpressionContainer") &&
            isNodeOfType(attribute.value.expression, "Literal")
          )
            hasRecycleItemsEnabled = attribute.value.expression.value === true;
          else hasRecycleItemsEnabled = true;
        if (attribute.name.name === "getItemType") hasGetItemType = true;
      }
      if (hasRecycleItemsEnabled && !hasGetItemType)
        context.report({
          node,
          message: `<${elementName} recycleItems> without \`getItemType\` - heterogeneous rows mount into the wrong recycled cells. Add \`getItemType={item => item.kind}\` so FlashList keeps separate recycle pools per type`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-deprecated-modules.ts
const rnNoDeprecatedModules = defineRule({
  recommendation:
    "Replace deprecated React Native modules with their current community or platform-supported packages.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "react-native") return;
      for (const specifier of node.specifiers ?? []) {
        if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
        const importedName = specifier.imported?.name;
        if (!importedName) continue;
        const replacement = DEPRECATED_RN_MODULE_REPLACEMENTS.get(importedName);
        if (!replacement) continue;
        context.report({
          node: specifier,
          message: `"${importedName}" was removed from react-native - use ${replacement} instead`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-dimensions-get.ts
const rnNoDimensionsGet = defineRule({
  recommendation:
    "Use useWindowDimensions or a subscribed dimensions hook so layout updates when screen size changes.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (
        !isNodeOfType(node.callee.object, "Identifier") ||
        node.callee.object.name !== "Dimensions"
      )
        return;
      if (isMemberProperty(node.callee, "get"))
        context.report({
          node,
          message:
            "Dimensions.get() does not update on screen rotation or resize - use useWindowDimensions() for reactive layout",
        });
      if (isMemberProperty(node.callee, "addEventListener"))
        context.report({
          node,
          message:
            "Dimensions.addEventListener() was removed in React Native 0.72 - use useWindowDimensions() instead",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-inline-flatlist-renderitem.ts
const rnNoInlineFlatlistRenderitem = defineRule({
  recommendation:
    "Hoist FlatList renderItem callbacks or memoize them so list rows do not receive a new renderer each render.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "renderItem") return;
      if (!node.value || !isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const openingElement = node.parent;
      if (!openingElement || !isNodeOfType(openingElement, "JSXOpeningElement")) return;
      const listComponentName = resolveJsxElementName(openingElement);
      if (!listComponentName || !REACT_NATIVE_LIST_COMPONENTS.has(listComponentName)) return;
      const expression = node.value.expression;
      if (
        !isNodeOfType(expression, "ArrowFunctionExpression") &&
        !isNodeOfType(expression, "FunctionExpression")
      )
        return;
      context.report({
        node: expression,
        message: `Inline renderItem on <${listComponentName}> creates a new function reference every render - extract to a named function or wrap in useCallback`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-inline-object-in-list-item.ts
const rnNoInlineObjectInListItem = defineRule({
  recommendation:
    "Hoist or memoize object props passed to list rows so recycled cells do not re-render from fresh identities.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => {
    let renderItemDepth = 0;
    const isRenderItemAttribute = (parent) => {
      if (!isNodeOfType(parent, "JSXAttribute")) return false;
      const attrName = isNodeOfType(parent.name, "JSXIdentifier") ? parent.name.name : null;
      return attrName ? RENDER_ITEM_PROP_NAMES.has(attrName) : false;
    };
    const isRenderItemFunction = (node) => {
      if (
        !isNodeOfType(node, "ArrowFunctionExpression") &&
        !isNodeOfType(node, "FunctionExpression")
      )
        return false;
      const expressionContainer = node.parent;
      if (!isNodeOfType(expressionContainer, "JSXExpressionContainer")) return false;
      return isRenderItemAttribute(expressionContainer.parent);
    };
    const enter = (node) => {
      if (isRenderItemFunction(node)) renderItemDepth++;
    };
    const exit = (node) => {
      if (isRenderItemFunction(node)) renderItemDepth = Math.max(0, renderItemDepth - 1);
    };
    return {
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": exit,
      FunctionExpression: enter,
      "FunctionExpression:exit": exit,
      JSXAttribute(node) {
        if (renderItemDepth === 0) return;
        if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
        if (!isNodeOfType(node.value.expression, "ObjectExpression")) return;
        const propName = isNodeOfType(node.name, "JSXIdentifier") ? node.name.name : "<unknown>";
        context.report({
          node,
          message: `Inline object literal on "${propName}" inside renderItem - allocates a fresh reference per row and breaks memo() on the row component. Hoist outside renderItem or pass primitives`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-legacy-expo-packages.ts
const rnNoLegacyExpoPackages = defineRule({
  recommendation:
    "Use the current Expo package names and APIs instead of legacy package entry points.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (typeof source !== "string") return;
      for (const [packageName, replacement] of LEGACY_EXPO_PACKAGE_REPLACEMENTS)
        if (source === packageName || source.startsWith(`${packageName}/`)) {
          context.report({
            node,
            message: `"${packageName}" is deprecated - use ${replacement}`,
          });
          return;
        }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-legacy-shadow-styles.ts
const rnNoLegacyShadowStyles = defineRule({
  recommendation:
    "Use boxShadow or platform-appropriate modern shadow APIs instead of legacy iOS-only shadow props.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (isNodeOfType(expression, "ObjectExpression"))
        reportLegacyShadowProperties(expression, context);
      else if (isNodeOfType(expression, "ArrayExpression")) {
        for (const element of expression.elements ?? [])
          if (isNodeOfType(element, "ObjectExpression"))
            reportLegacyShadowProperties(element, context);
      }
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (
        !isNodeOfType(node.callee.object, "Identifier") ||
        node.callee.object.name !== "StyleSheet"
      )
        return;
      if (!isMemberProperty(node.callee, "create")) return;
      const stylesArgument = node.arguments?.[0];
      if (!isNodeOfType(stylesArgument, "ObjectExpression")) return;
      for (const styleDefinition of stylesArgument.properties ?? []) {
        if (!isNodeOfType(styleDefinition, "Property")) continue;
        if (!isNodeOfType(styleDefinition.value, "ObjectExpression")) continue;
        reportLegacyShadowProperties(styleDefinition.value, context);
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-non-native-navigator.ts
const rnNoNonNativeNavigator = defineRule({
  recommendation:
    "Use native-stack or platform-native navigation primitives for mobile screens when possible.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (typeof source !== "string" || !NON_NATIVE_NAVIGATOR_PACKAGES.has(source)) return;
      const replacement = source.replace("@react-navigation/", "@react-navigation/native-");
      context.report({
        node,
        message: `${source} uses a JS-implemented navigator - use ${replacement} for native iOS/Android transitions and gestures`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-raw-text.ts
const NATIVE_PLATFORM_FILE_PATTERN = /\.(?:android|ios|native)\.[jt]sx?$/;
const isReactNativeImportSource = (sourceValue) =>
  typeof sourceValue === "string" &&
  (sourceValue === "react-native" || sourceValue.startsWith("react-native/"));
const hasReactNativeImport = (programNode) =>
  Boolean(
    programNode.body?.some(
      (statementNode) =>
        isNodeOfType(statementNode, "ImportDeclaration") &&
        isReactNativeImportSource(statementNode.source?.value),
    ),
  );
const rnNoRawText = defineRule({
  recommendation:
    "Wrap raw strings in React Native Text components so text layout and accessibility are valid.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => {
    let isNativePlatformFile = false;
    let isWebOnlyFile = false;
    let isDomComponentFile = false;
    return {
      Program(programNode) {
        isDomComponentFile = hasDirective(programNode, "use dom");
        isWebOnlyFile = isWebOnlyPath(context.getFilename?.() ?? "");
        isNativePlatformFile =
          NATIVE_PLATFORM_FILE_PATTERN.test(context.getFilename?.() ?? "") ||
          hasReactNativeImport(programNode);
      },
      JSXElement(node) {
        if (!isNativePlatformFile) return;
        if (isDomComponentFile || isWebOnlyFile || isInsideWebPlatformBranch(node)) return;
        const elementName = resolveJsxElementName(node.openingElement);
        if (elementName && isTextHandlingComponent(elementName)) return;
        for (const child of node.children ?? []) {
          if (!isRawTextContent(child)) continue;
          context.report({
            node: child,
            message: `Raw ${getRawTextDescription(child)} outside a <Text> component - this will crash on React Native`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-scroll-state.ts
const rnNoScrollState = defineRule({
  recommendation:
    "Keep scroll position and high-frequency scroll data in refs or Reanimated shared values instead of React state.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (node.name.name !== "onScroll") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (
        !isNodeOfType(expression, "ArrowFunctionExpression") &&
        !isNodeOfType(expression, "FunctionExpression")
      )
        return;
      let setStateCallNode = null;
      walkAst(expression.body, (child) => {
        if (setStateCallNode) return;
        if (
          isNodeOfType(child, "CallExpression") &&
          isNodeOfType(child.callee, "Identifier") &&
          /^set[A-Z]/.test(child.callee.name)
        )
          setStateCallNode = child;
      });
      if (setStateCallNode)
        context.report({
          node: setStateCallNode,
          message:
            "setState in onScroll triggers re-renders on every scroll event - use a Reanimated shared value (useAnimatedScrollHandler) or a ref to track scroll position",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-scrollview-mapped-list.ts
const rnNoScrollviewMappedList = defineRule({
  recommendation:
    "Use FlatList, SectionList, or another virtualized list instead of mapping large lists inside ScrollView.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXElement(node) {
      const elementName = resolveJsxElementName(node.openingElement);
      if (!elementName || !SCROLLVIEW_NAMES.has(elementName)) return;
      for (const child of node.children ?? []) {
        if (!isNodeOfType(child, "JSXExpressionContainer")) continue;
        const expression = child.expression;
        if (
          isNodeOfType(expression, "CallExpression") &&
          isNodeOfType(expression.callee, "MemberExpression") &&
          isNodeOfType(expression.callee.property, "Identifier") &&
          expression.callee.property.name === "map"
        ) {
          context.report({
            node: child,
            message: `<${elementName}> rendering items.map(...) - use FlashList, LegendList, or FlatList so only visible rows mount`,
          });
          return;
        }
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-single-element-style-array.ts
const rnNoSingleElementStyleArray = defineRule({
  recommendation: "Pass a single style object directly instead of wrapping one style in an array.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      const propName = isNodeOfType(node.name, "JSXIdentifier") ? node.name.name : null;
      if (!propName) return;
      if (propName !== "style" && !propName.endsWith("Style")) return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ArrayExpression")) return;
      if (expression.elements?.length !== 1) return;
      context.report({
        node: expression,
        message: `Single-element style array on "${propName}" - use ${propName}={value} instead of ${propName}={[value]} to avoid unnecessary array allocation`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-no-web-dom-elements.ts
const rnNoWebDomElements = defineRule({
  recommendation:
    "Use React Native primitives such as View, Text, TextInput, Pressable, and expo-image instead of DOM tags unless the code is inside an Expo DOM component or WebView.",
  examples: [
    {
      before: `<div><img src={avatarUrl} /></div>`,
      after: `<View><Image source={avatarUrl} /></View>`,
    },
  ],
  create: (context) => {
    let isDomComponentFile = false;
    let isWebOnlyFile = false;
    return {
      Program(programNode) {
        isDomComponentFile = hasDirective(programNode, "use dom");
        isWebOnlyFile = isWebOnlyPath(context.getFilename?.() ?? "");
      },
      JSXOpeningElement(node) {
        if (isDomComponentFile || isWebOnlyFile || isInsideWebPlatformBranch(node)) return;
        const elementName = resolveJsxElementName(node);
        if (!elementName || !REACT_NATIVE_WEB_DOM_ELEMENTS.has(elementName)) return;
        context.report({
          node,
          message: `<${elementName}> is a web DOM element - use React Native primitives or isolate web code in an Expo DOM component / WebView`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-native/rn-prefer-content-inset-adjustment.ts
const rnPreferContentInsetAdjustment = defineRule({
  recommendation:
    "Use contentInsetAdjustmentBehavior or SafeArea-aware containers instead of manually padding scroll content for device insets.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXElement(node) {
      if (resolveJsxElementName(node.openingElement) !== "SafeAreaView") return;
      for (const child of node.children ?? []) {
        if (!isNodeOfType(child, "JSXElement")) continue;
        const childName = resolveJsxElementName(child.openingElement);
        if (!childName || !SCROLLVIEW_NAMES.has(childName)) continue;
        context.report({
          node,
          message:
            '<SafeAreaView> wrapping <ScrollView> - set `contentInsetAdjustmentBehavior="automatic"` on the ScrollView and drop the SafeAreaView wrapper for native safe-area handling',
        });
        return;
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-prefer-expo-image.ts
const rnPreferExpoImage = defineRule({
  recommendation:
    "Use expo-image for production image rendering in Expo apps to get better caching and performance.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "react-native") return;
      for (const specifier of node.specifiers ?? []) {
        if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
        if (specifier.imported?.name !== "Image") continue;
        context.report({
          node: specifier,
          message:
            "Importing Image from react-native - prefer expo-image for caching, placeholders, and progressive loading (drop-in API)",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-prefer-pressable.ts
const rnPreferPressable = defineRule({
  recommendation: "Use Pressable for touch interactions instead of legacy touchable components.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "react-native") return;
      for (const specifier of node.specifiers ?? []) {
        if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
        const importedName = specifier.imported?.name;
        if (!importedName || !TOUCHABLE_COMPONENTS.has(importedName)) continue;
        context.report({
          node: specifier,
          message: `${importedName} is legacy - use <Pressable> from react-native (or react-native-gesture-handler) for modern press handling`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-prefer-reanimated.ts
const rnPreferReanimated = defineRule({
  recommendation:
    "Use Reanimated for gesture-driven or high-frequency animations that need to run on the UI thread.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (node.source?.value !== "react-native") return;
      for (const specifier of node.specifiers ?? []) {
        if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
        if (specifier.imported?.name !== "Animated") continue;
        context.report({
          node: specifier,
          message:
            "Animated from react-native runs animations on the JS thread - use react-native-reanimated for performant UI-thread animations",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-pressable-shared-value-mutation.ts
const rnPressableSharedValueMutation = defineRule({
  recommendation:
    "Mutate Reanimated shared values from worklets or UI-thread handlers instead of React render or normal JS event paths.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => {
    const sharedValueBindingsByComponent = [];
    const enterScope = () => {
      sharedValueBindingsByComponent.push(/* @__PURE__ */ new Set());
    };
    const exitScope = () => {
      sharedValueBindingsByComponent.pop();
    };
    const trackSharedValueBinding = (declarator) => {
      if (sharedValueBindingsByComponent.length === 0) return;
      if (!isNodeOfType(declarator.id, "Identifier")) return;
      if (!isNodeOfType(declarator.init, "CallExpression")) return;
      const callee = declarator.init.callee;
      if (!isNodeOfType(callee, "Identifier")) return;
      if (callee.name !== "useSharedValue") return;
      sharedValueBindingsByComponent[sharedValueBindingsByComponent.length - 1].add(
        declarator.id.name,
      );
    };
    return {
      FunctionDeclaration: enterScope,
      "FunctionDeclaration:exit": exitScope,
      FunctionExpression: enterScope,
      "FunctionExpression:exit": exitScope,
      ArrowFunctionExpression: enterScope,
      "ArrowFunctionExpression:exit": exitScope,
      VariableDeclarator(node) {
        trackSharedValueBinding(node);
      },
      JSXOpeningElement(node) {
        if (resolveJsxElementName(node) !== "Pressable") return;
        if (sharedValueBindingsByComponent.length === 0) return;
        const activeBindings = /* @__PURE__ */ new Set();
        for (const frame of sharedValueBindingsByComponent)
          for (const binding of frame) activeBindings.add(binding);
        if (activeBindings.size === 0) return;
        for (const attribute of node.attributes ?? []) {
          if (!isNodeOfType(attribute, "JSXAttribute")) continue;
          if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
          if (!PRESS_HANDLER_PROP_NAMES.has(attribute.name.name)) continue;
          if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
          const handler = attribute.value.expression;
          if (!handler) continue;
          if (!handlerMutatesIdentifier(handler, activeBindings)) continue;
          context.report({
            node: attribute,
            message: `<Pressable> ${attribute.name.name} mutates a Reanimated shared value - use a Gesture.Tap() inside <GestureDetector> for press animations that stay on the UI thread`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react-native/rn-scrollview-content-container-padding.ts
const reportPaddingProperty = (property, scrollViewName, context) => {
  const key = property.key;
  const propertyName = isNodeOfType(key, "Identifier")
    ? key.name
    : isNodeOfType(key, "Literal")
      ? String(key.value)
      : null;
  if (!propertyName || !SCROLLVIEW_STYLE_PADDING_KEYS.has(propertyName)) return;
  context.report({
    node: property,
    message: `${scrollViewName} style uses ${propertyName} - put scroll content spacing in contentContainerStyle so padding does not clip or offset the native scroll container`,
  });
};
const inspectStyleExpression = (expression, scrollViewName, context) => {
  if (isNodeOfType(expression, "ObjectExpression")) {
    for (const property of expression.properties ?? [])
      if (isNodeOfType(property, "Property"))
        reportPaddingProperty(property, scrollViewName, context);
    return;
  }
  if (!isNodeOfType(expression, "ArrayExpression")) return;
  for (const element of expression.elements ?? []) {
    if (!isNodeOfType(element, "ObjectExpression")) continue;
    inspectStyleExpression(element, scrollViewName, context);
  }
};
const rnScrollviewContentContainerPadding = defineRule({
  recommendation:
    "Put ScrollView spacing on contentContainerStyle, not style, so padding applies to the scroll content instead of the native scroll viewport.",
  examples: [
    {
      before: `<ScrollView style={{ padding: 16 }}>`,
      after: `<ScrollView contentContainerStyle={{ padding: 16 }}>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = resolveJsxElementName(node);
      if (!elementName || !SCROLLVIEW_NAMES.has(elementName)) return;
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier") || attribute.name.name !== "style")
          continue;
        if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
        inspectStyleExpression(attribute.value.expression, elementName, context);
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-scrollview-dynamic-padding.ts
const rnScrollviewDynamicPadding = defineRule({
  recommendation:
    "Keep ScrollView padding stable or express inset changes with contentContainerStyle and safe-area APIs to avoid layout jumps.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const elementName = resolveJsxElementName(node);
      if (!elementName) return;
      if (
        !SCROLLVIEW_NAMES.has(elementName) &&
        elementName !== "FlatList" &&
        elementName !== "FlashList"
      )
        return;
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (
          !isNodeOfType(attribute.name, "JSXIdentifier") ||
          attribute.name.name !== "contentContainerStyle"
        )
          continue;
        if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
        const expression = attribute.value.expression;
        if (!isNodeOfType(expression, "ObjectExpression")) continue;
        for (const property of expression.properties ?? []) {
          if (!isNodeOfType(property, "Property")) continue;
          if (!isNodeOfType(property.key, "Identifier")) continue;
          const key = property.key.name;
          if (key !== "paddingBottom" && key !== "paddingTop") continue;
          const value = property.value;
          if (!value) continue;
          if (isNodeOfType(value, "Literal")) continue;
          context.report({
            node: property,
            message: `Dynamic ${key} on contentContainerStyle reflows the scroll content - use \`contentInset\` (OS-level offset, no relayout) instead`,
          });
          return;
        }
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react-native/rn-style-prefer-boxshadow.ts
const rnStylePreferBoxShadow = defineRule({
  recommendation:
    "Prefer the modern boxShadow style where supported and keep platform-specific shadow fallbacks isolated.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const attributeName = node.name.name;
      if (attributeName !== "style" && !attributeName.endsWith("Style")) return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;
      const match = findLegacyShadowProperty(expression);
      if (!match) return;
      context.report({
        node: match.node,
        message: `${match.keyName} is iOS/Android-platform-specific - use the cross-platform CSS \`boxShadow\` string (e.g. \`boxShadow: "0 2px 8px rgba(0,0,0,0.1)"\`) on RN v7+`,
      });
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.object, "Identifier")) return;
      if (node.callee.object.name !== "StyleSheet") return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (node.callee.property.name !== "create") return;
      const argument = node.arguments?.[0];
      if (!isNodeOfType(argument, "ObjectExpression")) return;
      for (const property of argument.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if (!isNodeOfType(property.value, "ObjectExpression")) continue;
        const match = findLegacyShadowProperty(property.value);
        if (!match) continue;
        context.report({
          node: match.node,
          message: `${match.keyName} is iOS/Android-platform-specific - use the cross-platform CSS \`boxShadow\` string on RN v7+`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/server/utils/analytics-deferrable-methods.ts
const ANALYTICS_DEFERRABLE_METHODS = new Set([
  "track",
  "identify",
  "page",
  "capture",
  "captureMessage",
  "captureException",
  "log",
]);
//#endregion
//#region src/core/rules/lint/server/utils/analytics-deferrable-objects.ts
const ANALYTICS_DEFERRABLE_OBJECTS = new Set([
  "analytics",
  "posthog",
  "mixpanel",
  "segment",
  "amplitude",
  "datadog",
  "sentry",
]);
//#endregion
//#region src/core/rules/lint/server/utils/app-router-file-pattern.ts
const APP_ROUTER_FILE_PATTERN =
  /\/app\/(?:[^/]+\/)*(?:route|page|layout|template|loading|error|default)\.(?:tsx?|jsx?)$/;
//#endregion
//#region src/core/rules/lint/server/utils/console-deferrable-methods.ts
const CONSOLE_DEFERRABLE_METHODS = new Set(["log", "info", "warn"]);
//#endregion
//#region src/core/rules/lint/server/utils/deriving-array-methods.ts
const DERIVING_ARRAY_METHODS = new Set(["toSorted", "toReversed", "filter", "map", "slice"]);
//#endregion
//#region src/core/rules/lint/server/utils/mutable-container-constructors.ts
const MUTABLE_CONTAINER_CONSTRUCTORS = new Set(["Map", "Set", "WeakMap", "WeakSet"]);
//#endregion
//#region src/core/rules/lint/server/utils/non-project-path-pattern.ts
const NON_PROJECT_PATH_PATTERN = /\/(?:node_modules|dist|build|\.next)\//;
//#endregion
//#region src/core/rules/lint/server/utils/pages-router-api-path-pattern.ts
const PAGES_ROUTER_API_PATH_PATTERN = /\/pages\/api\//;
//#endregion
//#region src/core/rules/lint/server/utils/route-handler-http-methods.ts
const ROUTE_HANDLER_HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);
//#endregion
//#region src/core/rules/lint/server/utils/static-io-functions.ts
const STATIC_IO_FUNCTIONS = new Set([
  "readFileSync",
  "readFile",
  "readdir",
  "readdirSync",
  "stat",
  "statSync",
  "access",
  "accessSync",
]);
//#endregion
//#region src/core/rules/lint/server/utils/call-reads-handler-args.ts
const callReadsHandlerArgs = (call, handlerParamNames) => {
  if (handlerParamNames.size === 0) return false;
  let referencesArg = false;
  walkAst(call, (child) => {
    if (referencesArg) return;
    if (isNodeOfType(child, "Identifier") && handlerParamNames.has(child.name))
      referencesArg = true;
  });
  return referencesArg;
};
//#endregion
//#region src/core/rules/lint/server/utils/collect-declared-names.ts
const collectDeclaredNames = (declaration) => {
  const names = /* @__PURE__ */ new Set();
  for (const declarator of declaration.declarations ?? [])
    if (isNodeOfType(declarator.id, "Identifier")) names.add(declarator.id.name);
    else if (isNodeOfType(declarator.id, "ObjectPattern")) {
      for (const property of declarator.id.properties ?? [])
        if (isNodeOfType(property, "Property") && isNodeOfType(property.value, "Identifier"))
          names.add(property.value.name);
        else if (
          isNodeOfType(property, "RestElement") &&
          isNodeOfType(property.argument, "Identifier")
        )
          names.add(property.argument.name);
    } else if (isNodeOfType(declarator.id, "ArrayPattern")) {
      for (const element of declarator.id.elements ?? [])
        if (isNodeOfType(element, "Identifier")) names.add(element.name);
    }
  return names;
};
//#endregion
//#region src/core/rules/lint/server/utils/collect-identifier-params.ts
const collectIdentifierParams = (params) => {
  const names = /* @__PURE__ */ new Set();
  for (const param of params) if (isNodeOfType(param, "Identifier")) names.add(param.name);
  return names;
};
//#endregion
//#region src/core/rules/lint/server/utils/contains-auth-check.ts
const containsAuthCheck = (statements) => {
  let foundAuthCall = false;
  for (const statement of statements)
    walkAst(statement, (child) => {
      if (foundAuthCall) return;
      let callNode = null;
      if (isNodeOfType(child, "CallExpression")) callNode = child;
      else if (
        isNodeOfType(child, "AwaitExpression") &&
        isNodeOfType(child.argument, "CallExpression")
      )
        callNode = child.argument;
      if (isNodeOfType(callNode?.callee, "Identifier")) {
        const calleeName = callNode.callee.name;
        if (
          AUTH_FUNCTION_NAMES.has(calleeName) ||
          /^(?:check|require|ensure|assert|verify|guard|protect|validate).*(?:auth|access|session|admin|permission|role)/i.test(
            calleeName,
          )
        )
          foundAuthCall = true;
      }
    });
  return foundAuthCall;
};
//#endregion
//#region src/core/rules/lint/server/utils/declaration-reads-any-name.ts
const declarationReadsAnyName = (declaration, names) => {
  if (names.size === 0) return false;
  let didRead = false;
  walkAst(declaration, (child) => {
    if (didRead) return;
    if (isNodeOfType(child, "Identifier") && names.has(child.name)) didRead = true;
  });
  return didRead;
};
//#endregion
//#region src/core/rules/lint/server/utils/declaration-starts-with-await.ts
const declarationStartsWithAwait = (declaration) => {
  for (const declarator of declaration.declarations ?? [])
    if (isNodeOfType(declarator.init, "AwaitExpression")) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/server/utils/get-deriving-method-name.ts
const getDerivingMethodName = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  if (!isNodeOfType(node.callee, "MemberExpression")) return null;
  if (!isNodeOfType(node.callee.property, "Identifier")) return null;
  return node.callee.property.name;
};
//#endregion
//#region src/core/rules/lint/server/utils/is-fetch-of-import-meta-url.ts
const isFetchOfImportMetaUrl = (call) => {
  if (!isNodeOfType(call, "CallExpression")) return false;
  if (!isNodeOfType(call.callee, "Identifier") || call.callee.name !== "fetch") return false;
  const firstArgument = call.arguments?.[0];
  if (!isNodeOfType(firstArgument, "NewExpression")) return false;
  if (!isNodeOfType(firstArgument.callee, "Identifier") || firstArgument.callee.name !== "URL")
    return false;
  const secondArgument = firstArgument.arguments?.[1];
  return (
    isNodeOfType(secondArgument, "MemberExpression") &&
    isNodeOfType(secondArgument.object, "MetaProperty") &&
    isNodeOfType(secondArgument.property, "Identifier") &&
    secondArgument.property.name === "url"
  );
};
//#endregion
//#region src/core/rules/lint/server/utils/is-static-io-call.ts
const isStaticIoCall = (call) => {
  if (!isNodeOfType(call, "CallExpression")) return false;
  const callee = call.callee;
  if (isNodeOfType(callee, "Identifier") && STATIC_IO_FUNCTIONS.has(callee.name)) return true;
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  const propertyName = isNodeOfType(callee.property, "Identifier") ? callee.property.name : null;
  if (!propertyName || !STATIC_IO_FUNCTIONS.has(propertyName)) return false;
  return true;
};
//#endregion
//#region src/core/rules/lint/server/utils/inspect-handler-body.ts
const inspectHandlerBody = (context, handlerBody, handlerLabel, handlerParamNames) => {
  walkAst(handlerBody, (child) => {
    let staticCall = null;
    if (isStaticIoCall(child)) staticCall = child;
    else if (isFetchOfImportMetaUrl(child)) staticCall = child;
    else if (
      isNodeOfType(child, "AwaitExpression") &&
      child.argument &&
      (isStaticIoCall(child.argument) || isFetchOfImportMetaUrl(child.argument))
    )
      staticCall = child.argument;
    if (!staticCall) return;
    if (callReadsHandlerArgs(staticCall, handlerParamNames)) return;
    const calleeText =
      isNodeOfType(staticCall.callee, "MemberExpression") &&
      isNodeOfType(staticCall.callee.property, "Identifier")
        ? `${isNodeOfType(staticCall.callee.object, "Identifier") ? staticCall.callee.object.name : "?"}.${staticCall.callee.property.name}`
        : isNodeOfType(staticCall.callee, "Identifier")
          ? staticCall.callee.name
          : "io";
    context.report({
      node: staticCall,
      message: `${calleeText}() in ${handlerLabel} reads the same static asset every request - hoist to module scope so the read happens once at module load`,
    });
  });
};
//#endregion
//#region src/core/rules/lint/server/utils/is-deferrable-side-effect-call.ts
const isDeferrableSideEffectCall = (objectName, methodName) => {
  if (objectName === "console") return CONSOLE_DEFERRABLE_METHODS.has(methodName);
  if (ANALYTICS_DEFERRABLE_OBJECTS.has(objectName))
    return ANALYTICS_DEFERRABLE_METHODS.has(methodName);
  return false;
};
//#endregion
//#region src/core/rules/lint/server/utils/is-fetch-call.ts
const isFetchCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  return isNodeOfType(node.callee, "Identifier") && node.callee.name === "fetch";
};
//#endregion
//#region src/core/rules/lint/server/utils/is-mutable-const-initializer.ts
const isMutableConstInitializer = (init) => {
  if (!init) return null;
  if (isNodeOfType(init, "ArrayExpression")) return "[]";
  if (isNodeOfType(init, "ObjectExpression")) return "{}";
  if (
    isNodeOfType(init, "NewExpression") &&
    isNodeOfType(init.callee, "Identifier") &&
    MUTABLE_CONTAINER_CONSTRUCTORS.has(init.callee.name)
  )
    return `new ${init.callee.name}()`;
  return null;
};
//#endregion
//#region src/core/rules/lint/server/utils/object-expression-has-next-revalidate.ts
const objectExpressionHasNextRevalidate = (objectExpression) => {
  if (!isNodeOfType(objectExpression, "ObjectExpression")) return false;
  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    if (!isNodeOfType(property.key, "Identifier")) continue;
    if (property.key.name === "cache") return true;
    if (property.key.name !== "next") continue;
    if (!isNodeOfType(property.value, "ObjectExpression")) return true;
    for (const innerProperty of property.value.properties ?? []) {
      if (!isNodeOfType(innerProperty, "Property")) continue;
      if (!isNodeOfType(innerProperty.key, "Identifier")) continue;
      if (innerProperty.key.name === "revalidate" || innerProperty.key.name === "tags") return true;
    }
    return true;
  }
  return false;
};
//#endregion
//#region src/core/rules/lint/server/server-after-nonblocking.ts
const serverAfterNonblocking = defineRule({
  recommendation:
    "Move non-blocking work such as analytics, revalidation, and logging into after() so the response can finish first.",
  examples: [
    {
      before: `await analytics.track("signup");
return Response.json({ ok: true });`,
      after: `after(() => analytics.track("signup"));
return Response.json({ ok: true });`,
    },
  ],
  create: (context) => {
    let fileHasUseServerDirective = false;
    let serverFunctionDepth = 0;
    const enterIfServerFunction = (node) => {
      if (hasUseServerDirective(node)) serverFunctionDepth++;
    };
    const leaveIfServerFunction = (node) => {
      if (hasUseServerDirective(node)) serverFunctionDepth = Math.max(0, serverFunctionDepth - 1);
    };
    return {
      Program(programNode) {
        fileHasUseServerDirective = hasDirective(programNode, "use server");
      },
      FunctionDeclaration: enterIfServerFunction,
      "FunctionDeclaration:exit": leaveIfServerFunction,
      FunctionExpression: enterIfServerFunction,
      "FunctionExpression:exit": leaveIfServerFunction,
      ArrowFunctionExpression: enterIfServerFunction,
      "ArrowFunctionExpression:exit": leaveIfServerFunction,
      CallExpression(node) {
        if (!fileHasUseServerDirective && serverFunctionDepth === 0) return;
        if (!isNodeOfType(node.callee, "MemberExpression")) return;
        if (!isNodeOfType(node.callee.property, "Identifier")) return;
        const objectName = isNodeOfType(node.callee.object, "Identifier")
          ? node.callee.object.name
          : null;
        if (!objectName) return;
        const methodName = node.callee.property.name;
        if (!isDeferrableSideEffectCall(objectName, methodName)) return;
        context.report({
          node,
          message: `${objectName}.${methodName}() in server action - wrap in \`after(() => ${objectName}.${methodName}(...))\` so it doesn't delay the user-visible response`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-auth-actions.ts
const serverAuthActions = defineRule({
  recommendation:
    "Authenticate and authorize every server action or mutating route handler before reading user input or performing writes.",
  examples: [
    {
      before: `export async function save(data) { await db.save(data); }`,
      after: `export async function save(data) { const user = await auth(); await db.save({ userId: user.id, data }); }`,
    },
  ],
  create: (context) => {
    let fileHasUseServerDirective = false;
    return {
      Program(programNode) {
        fileHasUseServerDirective = hasDirective(programNode, "use server");
      },
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (!isNodeOfType(declaration, "FunctionDeclaration") || !declaration.async) return;
        if (!(fileHasUseServerDirective || hasUseServerDirective(declaration))) return;
        if (!containsAuthCheck((declaration.body?.body ?? []).slice(0, 10))) {
          const functionName = declaration.id?.name ?? "anonymous";
          context.report({
            node: declaration.id ?? node,
            message: `Server action "${functionName}" - add auth check (auth(), getSession(), etc.) at the top`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-cache-with-object-literal.ts
const serverCacheWithObjectLiteral = defineRule({
  recommendation:
    "Use stable primitive cache keys or explicit key builders instead of object literals that miss cache hits by identity.",
  examples: [
    {
      before: `cache.get({ id });`,
      after: `cache.get(\`user:\${id}\`);`,
    },
  ],
  create: (context) => {
    const cachedFunctionNames = /* @__PURE__ */ new Set();
    return {
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        const init = node.init;
        if (!isNodeOfType(init, "CallExpression")) return;
        const callee = init.callee;
        if (
          !(
            (isNodeOfType(callee, "Identifier") && callee.name === "cache") ||
            (isNodeOfType(callee, "MemberExpression") &&
              isNodeOfType(callee.object, "Identifier") &&
              callee.object.name === "React" &&
              isNodeOfType(callee.property, "Identifier") &&
              callee.property.name === "cache")
          )
        )
          return;
        cachedFunctionNames.add(node.id.name);
      },
      CallExpression(node) {
        if (!isNodeOfType(node.callee, "Identifier")) return;
        if (!cachedFunctionNames.has(node.callee.name)) return;
        const firstArg = node.arguments?.[0];
        if (!isNodeOfType(firstArg, "ObjectExpression")) return;
        context.report({
          node,
          message: `${node.callee.name} is React.cache()-wrapped, but you're passing an object literal - the cache keys on argument identity, so a fresh {} per render bypasses dedup. Pass primitives or hoist the object`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-dedup-props.ts
const serverDedupProps = defineRule({
  recommendation:
    "Pass one source collection through the RSC boundary and derive sorted or filtered variants on the client when possible.",
  examples: [
    {
      before: `<Client items={items} sorted={items.toSorted(sortByName)} />`,
      after: `<Client items={items} />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const identifierAttributes = /* @__PURE__ */ new Map();
      const derivedAttributes = [];
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
        const expression = attribute.value.expression;
        if (!expression) continue;
        if (isNodeOfType(expression, "Identifier"))
          identifierAttributes.set(expression.name, attribute.name.name);
        else if (isNodeOfType(expression, "CallExpression")) {
          const derivingMethod = getDerivingMethodName(expression);
          if (!derivingMethod || !DERIVING_ARRAY_METHODS.has(derivingMethod)) continue;
          const root = getRootIdentifierName$1(expression, { followCallChains: true });
          if (!root) continue;
          derivedAttributes.push({
            propName: attribute.name.name,
            rootName: root,
            node: attribute,
          });
        }
      }
      for (const derivedAttribute of derivedAttributes) {
        const sourcePropName = identifierAttributes.get(derivedAttribute.rootName);
        if (sourcePropName)
          context.report({
            node: derivedAttribute.node,
            message: `"${derivedAttribute.propName}" is derived from "${sourcePropName}" (same source: ${derivedAttribute.rootName}) - passing both doubles RSC serialization. Pass the source once and derive on the client`,
          });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/server/server-fetch-without-revalidate.ts
const serverFetchWithoutRevalidate = defineRule({
  recommendation:
    "Add an explicit cache, revalidate, or no-store policy to server fetch calls so data freshness is intentional.",
  examples: [
    {
      before: `await fetch("https://api.example.com/posts");`,
      after: `await fetch("https://api.example.com/posts", { next: { revalidate: 60 } });`,
    },
  ],
  create: (context) => {
    let isServerSideFile = false;
    return {
      Program(node) {
        const filename = context.getFilename?.() ?? "";
        if (!APP_ROUTER_FILE_PATTERN.test(filename)) {
          isServerSideFile = false;
          return;
        }
        if (NON_PROJECT_PATH_PATTERN.test(filename) || ROUTE_HANDLER_FILE_PATTERN.test(filename)) {
          isServerSideFile = false;
          return;
        }
        isServerSideFile = !hasDirective(node, "use client");
      },
      CallExpression(node) {
        if (!isServerSideFile) return;
        if (!isFetchCall(node)) return;
        const optionsArg = node.arguments?.[1];
        if (optionsArg && objectExpressionHasNextRevalidate(optionsArg)) return;
        const urlArg = node.arguments?.[0];
        const urlText =
          isNodeOfType(urlArg, "Literal") && typeof urlArg.value === "string"
            ? `"${urlArg.value}"`
            : "url";
        context.report({
          node,
          message: `fetch(${urlText}) in a Server Component / route handler defaults to forever-caching - pass { next: { revalidate: <seconds> } } / { next: { tags: [...] } } / { cache: "no-store" } so stale data doesn't quietly persist`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-hoist-static-io.ts
const serverHoistStaticIo = defineRule({
  recommendation:
    "Hoist static file and asset reads to module scope so route handlers do not repeat the same I/O on every request.",
  examples: [
    {
      before: `export async function GET() { return readFileSync("logo.svg"); }`,
      after: `const logo = readFileSync("logo.svg");
export async function GET() { return logo; }`,
    },
  ],
  create: (context) => ({
    ExportNamedDeclaration(node) {
      const declaration = node.declaration;
      if (!isNodeOfType(declaration, "FunctionDeclaration")) return;
      const handlerName = declaration.id?.name;
      if (!handlerName || !ROUTE_HANDLER_HTTP_METHODS.has(handlerName)) return;
      if (!isNodeOfType(declaration.body, "BlockStatement")) return;
      inspectHandlerBody(
        context,
        declaration.body,
        `${handlerName} route handler`,
        collectIdentifierParams(declaration.params ?? []),
      );
    },
    ExportDefaultDeclaration(node) {
      const filename = context.getFilename?.() ?? "";
      if (!PAGES_ROUTER_API_PATH_PATTERN.test(filename)) return;
      const declaration = node.declaration;
      if (
        !isNodeOfType(declaration, "FunctionDeclaration") &&
        !isNodeOfType(declaration, "FunctionExpression") &&
        !isNodeOfType(declaration, "ArrowFunctionExpression")
      )
        return;
      if (!declaration.async) return;
      const body = declaration.body;
      if (!isNodeOfType(body, "BlockStatement")) return;
      inspectHandlerBody(
        context,
        body,
        "pages/api handler",
        collectIdentifierParams(declaration.params ?? []),
      );
    },
  }),
});
//#endregion
//#region src/core/rules/lint/server/server-no-mutable-module-state.ts
const serverNoMutableModuleState = defineRule({
  recommendation:
    "Avoid mutable module-level state on the server; use request scope, durable storage, or a bounded cache with invalidation.",
  examples: [
    {
      before: `let currentUser;`,
      after: `const currentUser = await getCurrentUser(request);`,
    },
  ],
  create: (context) => {
    let fileHasUseServerDirective = false;
    return {
      Program(programNode) {
        fileHasUseServerDirective = hasDirective(programNode, "use server");
      },
      VariableDeclaration(node) {
        if (!fileHasUseServerDirective) return;
        if (!isNodeOfType(node.parent, "Program")) return;
        for (const declarator of node.declarations ?? []) {
          const variableName = isNodeOfType(declarator.id, "Identifier")
            ? declarator.id.name
            : "<unnamed>";
          if (node.kind === "let" || node.kind === "var") {
            context.report({
              node: declarator,
              message: `Module-scoped ${node.kind} "${variableName}" in a "use server" file - this is shared across requests; move per-request data into the action body`,
            });
            continue;
          }
          const containerKind = isMutableConstInitializer(declarator.init);
          if (containerKind)
            context.report({
              node: declarator,
              message: `Module-scoped const "${variableName} = ${containerKind}" in a "use server" file - the container itself is shared across requests; move per-request data into the action body`,
            });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-sequential-independent-await.ts
const serverSequentialIndependentAwait = defineRule({
  recommendation:
    "Start independent server awaits before awaiting either result, then resolve them with Promise.all.",
  examples: [
    {
      before: `const user = await getUser();
const products = await getProducts();`,
      after: `const [user, products] = await Promise.all([getUser(), getProducts()]);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile =
      /(?:\.(?:test|spec|stories|e2e|integration)\.[tj]sx?$|\/(?:__tests__|tests?|__mocks__|__fixtures__|fixtures)\/)/.test(
        filename,
      );
    const inspectStatements = (statements) => {
      if (isTestOrInfraFile) return;
      for (let statementIndex = 0; statementIndex < statements.length - 1; statementIndex++) {
        const currentStatement = statements[statementIndex];
        if (!isNodeOfType(currentStatement, "VariableDeclaration")) continue;
        if (!declarationStartsWithAwait(currentStatement)) continue;
        const declaredNames = collectDeclaredNames(currentStatement);
        const nextStatement = statements[statementIndex + 1];
        if (!isNodeOfType(nextStatement, "VariableDeclaration")) continue;
        if (!declarationStartsWithAwait(nextStatement)) continue;
        if (declarationReadsAnyName(nextStatement, declaredNames)) continue;
        context.report({
          node: nextStatement,
          message:
            "Sequential `await` without a data dependency on the previous result - wrap the independent calls in `Promise.all([...])` so they race instead of waterfalling",
        });
        statementIndex++;
      }
    };
    const visitFunctionBody = (node) => {
      if (!node.async) return;
      if (!isNodeOfType(node.body, "BlockStatement")) return;
      inspectStatements(node.body.body ?? []);
    };
    return {
      FunctionDeclaration: visitFunctionBody,
      FunctionExpression: visitFunctionBody,
      ArrowFunctionExpression: visitFunctionBody,
    };
  },
});
//#endregion
//#region src/core/rules/lint/shadcn/shadcn-no-direct-radix-import.ts
const SHADCN_WRAPPER_PATH_PATTERN = /(?:^|[/\\])components[/\\]ui[/\\][^/\\]+\.[cm]?[jt]sx?$/;
const shadcnNoDirectRadixImport = defineRule({
  recommendation:
    "In shadcn/ui apps, import the local component wrapper from components/ui instead of importing Radix primitives directly in product code.",
  examples: [
    {
      before: `import * as Dialog from "@radix-ui/react-dialog";`,
      after: `import { Dialog, DialogContent } from "@/components/ui/dialog";`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (SHADCN_WRAPPER_PATH_PATTERN.test(context.getFilename?.() ?? "")) return;
      const source = getImportSourceValue(node);
      if (!source || !RADIX_PRIMITIVE_IMPORT_PATTERN.test(source)) return;
      context.report({
        node,
        message: `${source} imported directly - use the project's shadcn/ui wrapper so styling, tokens, and accessibility conventions stay centralized`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/storybook/utils/story-file-pattern.ts
const STORY_FILE_PATTERN = /\.(?:stories|story)\.[jt]sx?$/;
//#endregion
//#region src/core/rules/lint/storybook/utils/is-user-event-call.ts
const isUserEventCall = (node) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  node.callee.object.name === "userEvent" &&
  Boolean(getMemberPropertyName(node.callee));
//#endregion
//#region src/core/rules/lint/storybook/storybook-await-play-interactions.ts
const isAwaited$1 = (node) => isNodeOfType(node.parent, "AwaitExpression");
const storybookAwaitPlayInteractions = defineRule({
  recommendation:
    "Await userEvent calls inside Storybook play functions so interaction tests and snapshots observe the settled UI.",
  examples: [
    {
      before: `export const Filled = { play: async () => { userEvent.click(button); } };`,
      after: `export const Filled = { play: async () => { await userEvent.click(button); } };`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isStoryFile = STORY_FILE_PATTERN.test(filename);
    let playFunctionDepth = 0;
    return {
      Property(node) {
        if (!isStoryFile) return;
        if ((isNodeOfType(node.key, "Identifier") ? node.key.name : null) !== "play") return;
        const value = node.value;
        if (
          !isNodeOfType(value, "ArrowFunctionExpression") &&
          !isNodeOfType(value, "FunctionExpression")
        )
          return;
        playFunctionDepth++;
      },
      "Property:exit"(node) {
        if (!isStoryFile) return;
        if (
          (isNodeOfType(node.key, "Identifier") ? node.key.name : null) === "play" &&
          playFunctionDepth > 0
        )
          playFunctionDepth--;
      },
      CallExpression(node) {
        if (!isStoryFile || playFunctionDepth === 0) return;
        if (!isUserEventCall(node) || isAwaited$1(node)) return;
        context.report({
          node,
          message:
            "Storybook play userEvent call is not awaited - await the interaction before assertions or snapshots",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/swr/utils/swr-hook-names.ts
const SWR_HOOK_NAMES = new Set(["useSWR", "useSWRImmutable", "useSWRInfinite"]);
//#endregion
//#region src/core/rules/lint/swr/utils/contains-unstable-swr-key-value.ts
const containsUnstableSWRKeyValue = (node) => {
  if (!node) return null;
  let unstableSource = null;
  walkAst(node, (child) => {
    if (unstableSource) return false;
    if (
      isNodeOfType(child, "NewExpression") &&
      isNodeOfType(child.callee, "Identifier") &&
      child.callee.name === "Date"
    ) {
      unstableSource = "new Date()";
      return false;
    }
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      isNodeOfType(child.callee.property, "Identifier")
    ) {
      const receiverName = child.callee.object.name;
      const methodName = child.callee.property.name;
      if (receiverName === "Date" && methodName === "now") unstableSource = "Date.now()";
      if (receiverName === "Math" && methodName === "random") unstableSource = "Math.random()";
      if (unstableSource) return false;
    }
  });
  return unstableSource;
};
//#endregion
//#region src/core/rules/lint/swr/swr-no-empty-key.ts
const isEmptyString = (node) => isNodeOfType(node, "Literal") && node.value === "";
const swrNoEmptyKey = defineRule({
  recommendation:
    "Use null to disable SWR requests; an empty string key is an ambiguous cache key and hides the condition that controls fetching.",
  examples: [
    {
      before: `useSWR(userId ? ["/api/user", userId] : "", fetcher);`,
      after: `useSWR(userId ? ["/api/user", userId] : null, fetcher);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !SWR_HOOK_NAMES.has(calleeName)) return;
      const keyArgument = node.arguments?.[0];
      if (
        !(
          isEmptyString(keyArgument) ||
          (isNodeOfType(keyArgument, "ConditionalExpression") &&
            (isEmptyString(keyArgument.consequent) || isEmptyString(keyArgument.alternate)))
        )
      )
        return;
      context.report({
        node: keyArgument,
        message:
          "SWR key uses an empty string to disable fetching - use null so the disabled state is explicit",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/swr/swr-no-unstable-key.ts
const swrNoUnstableKey = defineRule({
  recommendation:
    "Keep SWR keys deterministic; include stable request inputs and never use time or random values in cache keys.",
  examples: [
    {
      before: `useSWR(["/api/items", Date.now()], fetcher);`,
      after: `useSWR(["/api/items", filters], fetcher);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const calleeName = isNodeOfType(node.callee, "Identifier") ? node.callee.name : null;
      if (!calleeName || !SWR_HOOK_NAMES.has(calleeName)) return;
      const unstableSource = containsUnstableSWRKeyValue(node.arguments?.[0]);
      if (!unstableSource) return;
      context.report({
        node: node.arguments[0],
        message: `SWR key contains ${unstableSource} - use stable key parts so deduping and cache identity work`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-ai/utils/tanstack-ai-import-pattern.ts
const TANSTACK_AI_IMPORT_PATTERN = /^@tanstack\/ai(?:$|[-/])/;
//#endregion
//#region src/core/rules/lint/tanstack-ai/utils/vercel-ai-sdk-imports.ts
const VERCEL_AI_SDK_IMPORTS = new Map([
  ["ai", new Set(["generateText", "streamObject", "streamText"])],
  ["@ai-sdk/openai", new Set(["createOpenAI"])],
]);
//#endregion
//#region src/core/rules/lint/tanstack-ai/utils/chat-lifecycle-callbacks.ts
const CHAT_LIFECYCLE_CALLBACKS = new Set([
  "onAbort",
  "onAfterToolCall",
  "onBeforeToolCall",
  "onChunk",
  "onEnd",
  "onError",
  "onFinish",
  "onStart",
  "onUsage",
]);
//#endregion
//#region src/core/rules/lint/tanstack-ai/utils/get-namespace-import-name.ts
const getNamespaceImportName = (specifier) => {
  if (!isNodeOfType(specifier, "ImportNamespaceSpecifier")) return null;
  return isNodeOfType(specifier.local, "Identifier") ? specifier.local.name : null;
};
//#endregion
//#region src/core/rules/lint/tanstack-ai/utils/is-namespace-call.ts
const isNamespaceCall = (node, namespaceNames, importedName) =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  namespaceNames.has(node.callee.object.name) &&
  isNodeOfType(node.callee.property, "Identifier") &&
  node.callee.property.name === importedName;
//#endregion
//#region src/core/rules/lint/tanstack-ai/tanstack-ai-chat-lifecycle-middleware.ts
const tanstackAiChatLifecycleMiddleware = defineRule({
  recommendation:
    "Put TanStack AI chat lifecycle hooks inside the middleware array so terminal events, tool hooks, usage, and errors run through the supported middleware pipeline.",
  examples: [
    {
      before: `chat({ adapter, messages, onFinish: () => track() });`,
      after: `chat({ adapter, messages, middleware: [{ onFinish: () => track() }] });`,
    },
  ],
  create: (context) => {
    const chatNames = /* @__PURE__ */ new Set();
    const tanstackAiNamespaces = /* @__PURE__ */ new Set();
    return {
      ImportDeclaration(node) {
        if (getImportSourceValue(node) !== "@tanstack/ai") return;
        for (const specifier of node.specifiers ?? []) {
          const namespaceName = getNamespaceImportName(specifier);
          if (namespaceName) tanstackAiNamespaces.add(namespaceName);
          if (getImportedName(specifier) !== "chat") continue;
          const localName = getLocalName(specifier);
          if (localName) chatNames.add(localName);
        }
      },
      CallExpression(node) {
        if (
          !isIdentifierCall(node, chatNames) &&
          !isNamespaceCall(node, tanstackAiNamespaces, "chat")
        )
          return;
        const options = node.arguments?.[0];
        if (!isNodeOfType(options, "ObjectExpression")) return;
        for (const property of options.properties ?? []) {
          const propertyName = getPropertyName(property);
          if (!propertyName || !CHAT_LIFECYCLE_CALLBACKS.has(propertyName)) continue;
          context.report({
            node: property,
            message: `chat() lifecycle callback "${propertyName}" should be inside middleware: [{ ${propertyName}: ... }]`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-ai/tanstack-ai-no-direct-client-import.ts
const tanstackAiNoDirectClientImport = defineRule({
  recommendation:
    "Import client hooks from the framework package such as @tanstack/ai-react; only vanilla JavaScript should import @tanstack/ai-client directly.",
  examples: [
    {
      before: `import { useChat } from "@tanstack/ai-client";`,
      after: `import { useChat } from "@tanstack/ai-react";`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      if (getImportSourceValue(node) !== "@tanstack/ai-client") return;
      context.report({
        node,
        message:
          "direct @tanstack/ai-client import bypasses framework integration - use @tanstack/ai-react, @tanstack/ai-solid, or the matching framework package",
      });
    },
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "require") return;
      const source = node.arguments?.[0];
      if (!isNodeOfType(source, "Literal") || source.value !== "@tanstack/ai-client") return;
      context.report({
        node,
        message:
          "direct @tanstack/ai-client require bypasses framework integration - use the matching TanStack AI framework package",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-ai/tanstack-ai-no-manual-sse-response.ts
const tanstackAiNoManualSseResponse = defineRule({
  recommendation:
    "Return toServerSentEventsResponse(stream) for TanStack AI SSE endpoints so headers, done markers, abort behavior, and error events stay consistent.",
  examples: [
    {
      before: `return new Response(toServerSentEventsStream(stream), { headers: { "Content-Type": "text/event-stream" } });`,
      after: `return toServerSentEventsResponse(stream);`,
    },
  ],
  create: (context) => {
    const sseStreamNames = /* @__PURE__ */ new Set();
    const sseStreamBindings = /* @__PURE__ */ new Set();
    const tanstackAiNamespaces = /* @__PURE__ */ new Set();
    return {
      ImportDeclaration(node) {
        if (getImportSourceValue(node) !== "@tanstack/ai") return;
        for (const specifier of node.specifiers ?? []) {
          const namespaceName = getNamespaceImportName(specifier);
          if (namespaceName) tanstackAiNamespaces.add(namespaceName);
          if (getImportedName(specifier) !== "toServerSentEventsStream") continue;
          const localName = getLocalName(specifier);
          if (localName) sseStreamNames.add(localName);
        }
      },
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        if (
          !isIdentifierCall(node.init, sseStreamNames) &&
          !isNamespaceCall(node.init, tanstackAiNamespaces, "toServerSentEventsStream")
        )
          return;
        sseStreamBindings.add(node.id.name);
      },
      NewExpression(node) {
        if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "Response") return;
        const body = node.arguments?.[0];
        const wrapsSseStreamCall =
          isIdentifierCall(body, sseStreamNames) ||
          isNamespaceCall(body, tanstackAiNamespaces, "toServerSentEventsStream");
        const wrapsSseStreamBinding =
          isNodeOfType(body, "Identifier") && sseStreamBindings.has(body.name);
        if (!wrapsSseStreamCall && !wrapsSseStreamBinding) return;
        context.report({
          node,
          message:
            "manual Response around toServerSentEventsStream - return toServerSentEventsResponse(stream) so TanStack AI owns SSE headers, completion, and errors",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-ai/tanstack-ai-no-vercel-sdk-patterns.ts
const tanstackAiNoVercelSdkPatterns = defineRule({
  recommendation:
    "In TanStack AI code, use chat() from @tanstack/ai and provider adapters such as openaiText(); do not mix in Vercel AI SDK helpers like streamText() or createOpenAI().",
  examples: [
    {
      before: `import { streamText } from "ai";`,
      after: `import { chat } from "@tanstack/ai";`,
    },
  ],
  create: (context) => {
    let hasTanstackAiImport = false;
    const incompatibleImports = [];
    return {
      ImportDeclaration(node) {
        const source = getImportSourceValue(node);
        if (!source) return;
        if (TANSTACK_AI_IMPORT_PATTERN.test(source)) {
          hasTanstackAiImport = true;
          return;
        }
        const forbiddenNames = VERCEL_AI_SDK_IMPORTS.get(source);
        if (!forbiddenNames) return;
        for (const specifier of node.specifiers ?? []) {
          const namespaceName = getNamespaceImportName(specifier);
          if (namespaceName) {
            incompatibleImports.push({
              node: specifier,
              importedName: `${namespaceName}.*`,
              source,
            });
            continue;
          }
          const importedName = getImportedName(specifier);
          if (importedName && forbiddenNames.has(importedName))
            incompatibleImports.push({
              node: specifier,
              importedName,
              source,
            });
        }
      },
      "Program:exit"() {
        if (!hasTanstackAiImport) return;
        for (const incompatibleImport of incompatibleImports)
          context.report({
            node: incompatibleImport.node,
            message: `${incompatibleImport.importedName} from ${incompatibleImport.source} is a Vercel AI SDK pattern - use TanStack AI chat() and provider adapters instead`,
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-ai/tanstack-ai-output-schema.ts
const tanstackAiOutputSchema = defineRule({
  recommendation:
    "Use chat({ outputSchema }) with the project's schema library; do not hand-wire provider-specific responseFormat or pass raw JSON Schema objects.",
  examples: [
    {
      before: `chat({ adapter, messages, modelOptions: { responseFormat: { type: "json_schema" } } });`,
      after: `chat({ adapter, messages, outputSchema: z.object({ name: z.string() }) });`,
    },
  ],
  create: (context) => {
    const chatNames = /* @__PURE__ */ new Set();
    const tanstackAiNamespaces = /* @__PURE__ */ new Set();
    return {
      ImportDeclaration(node) {
        if (getImportSourceValue(node) !== "@tanstack/ai") return;
        for (const specifier of node.specifiers ?? []) {
          const namespaceName = getNamespaceImportName(specifier);
          if (namespaceName) tanstackAiNamespaces.add(namespaceName);
          if (getImportedName(specifier) !== "chat") continue;
          const localName = getLocalName(specifier);
          if (localName) chatNames.add(localName);
        }
      },
      CallExpression(node) {
        if (
          !isIdentifierCall(node, chatNames) &&
          !isNamespaceCall(node, tanstackAiNamespaces, "chat")
        )
          return;
        const options = node.arguments?.[0];
        if (!isNodeOfType(options, "ObjectExpression")) return;
        const outputSchema = getObjectProperty(options, "outputSchema");
        if (outputSchema && isNodeOfType(outputSchema.value, "ObjectExpression"))
          context.report({
            node: outputSchema,
            message:
              "raw object passed to outputSchema - use a runtime schema library such as Zod, ArkType, or Valibot for validation and inference",
          });
        const modelOptions = getObjectProperty(options, "modelOptions");
        if (!modelOptions || !isNodeOfType(modelOptions.value, "ObjectExpression")) return;
        for (const property of modelOptions.value.properties ?? []) {
          if (getPropertyName(property) !== "responseFormat") continue;
          context.report({
            node: property,
            message:
              "provider-specific responseFormat in modelOptions bypasses TanStack AI structured output handling - pass outputSchema to chat() instead",
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/safe-build-env-vars.ts
const SAFE_BUILD_ENV_VARS = new Set(["NODE_ENV", "MODE", "DEV", "PROD"]);
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/secret-keyword-pattern.ts
const SECRET_KEYWORD_PATTERN = /(?:secret|token|api[_]?key|password|private)/i;
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/get-property-key-name.ts
const getPropertyKeyName = (property) => {
  if (!isNodeOfType(property, "Property") && !isNodeOfType(property, "MethodDefinition"))
    return null;
  if (isNodeOfType(property.key, "Identifier")) return property.key.name;
  if (isNodeOfType(property.key, "Literal")) return String(property.key.value);
  return null;
};
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/get-route-options-object.ts
const getRouteOptionsObject = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  const routeCallee = node.callee;
  if (
    isNodeOfType(routeCallee, "CallExpression") &&
    isNodeOfType(routeCallee.callee, "Identifier")
  ) {
    if (!TANSTACK_ROUTE_CREATION_FUNCTIONS.has(routeCallee.callee.name)) return null;
    const optionsArgument = node.arguments?.[0];
    if (isNodeOfType(optionsArgument, "ObjectExpression")) return optionsArgument;
    return null;
  }
  if (isNodeOfType(routeCallee, "Identifier")) {
    if (!TANSTACK_ROUTE_CREATION_FUNCTIONS.has(routeCallee.name)) return null;
    const optionsArgument = node.arguments?.[0];
    if (isNodeOfType(optionsArgument, "ObjectExpression")) return optionsArgument;
    return null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/has-top-level-await.ts
const hasTopLevelAwait = (statement) => {
  if (isNodeOfType(statement, "VariableDeclaration"))
    return statement.declarations?.some((declarator) =>
      isNodeOfType(declarator.init, "AwaitExpression"),
    );
  if (isNodeOfType(statement, "ExpressionStatement"))
    return (
      isNodeOfType(statement.expression, "AwaitExpression") ||
      (isNodeOfType(statement.expression, "AssignmentExpression") &&
        isNodeOfType(statement.expression.right, "AwaitExpression"))
    );
  if (isNodeOfType(statement, "ReturnStatement"))
    return isNodeOfType(statement.argument, "AwaitExpression");
  if (isNodeOfType(statement, "ForOfStatement") && statement.await) return true;
  return false;
};
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/is-likely-secret.ts
const isLikelySecret = (envVarName) => {
  if (SAFE_BUILD_ENV_VARS.has(envVarName)) return false;
  return SECRET_KEYWORD_PATTERN.test(envVarName);
};
//#endregion
//#region src/core/rules/lint/tanstack-start/utils/walk-server-fn-chain.ts
const walkServerFnChain = (outerNode) => {
  const chainInfo = {
    isServerFnChain: false,
    specifiedMethod: null,
    hasInputValidator: false,
  };
  let currentNode = outerNode.callee?.object;
  while (isNodeOfType(currentNode, "CallExpression")) {
    const calleeName = getCalleeName(currentNode);
    if (calleeName && TANSTACK_SERVER_FN_NAMES.has(calleeName)) {
      chainInfo.isServerFnChain = true;
      const optionsArgument = currentNode.arguments?.[0];
      if (isNodeOfType(optionsArgument, "ObjectExpression")) {
        for (const property of optionsArgument.properties ?? [])
          if (
            isNodeOfType(property.key, "Identifier") &&
            property.key.name === "method" &&
            isNodeOfType(property.value, "Literal") &&
            typeof property.value.value === "string"
          )
            chainInfo.specifiedMethod = property.value.value;
      }
    }
    if (calleeName === "inputValidator") chainInfo.hasInputValidator = true;
    if (isNodeOfType(currentNode.callee, "MemberExpression"))
      currentNode = currentNode.callee.object;
    else break;
  }
  return chainInfo;
};
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-get-mutation.ts
const tanstackStartGetMutation = defineRule({
  recommendation:
    "Use mutation methods such as POST for writes instead of performing mutations from GET handlers.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (
        !isNodeOfType(node.callee.property, "Identifier") ||
        node.callee.property.name !== "handler"
      )
        return;
      const chainInfo = walkServerFnChain(node);
      if (!chainInfo.isServerFnChain) return;
      if (
        chainInfo.specifiedMethod &&
        MUTATING_HTTP_METHODS.has(chainInfo.specifiedMethod.toUpperCase())
      )
        return;
      const handlerFunction = node.arguments?.[0];
      if (!handlerFunction) return;
      const sideEffect = findSideEffect(handlerFunction);
      if (sideEffect)
        context.report({
          node,
          message: `GET server function has side effects (${sideEffect}) - use createServerFn({ method: 'POST' }) for mutations`,
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-loader-parallel-fetch.ts
const tanstackStartLoaderParallelFetch = defineRule({
  recommendation: "Start independent loader promises together and await them with Promise.all.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const optionsObject = getRouteOptionsObject(node);
      if (!optionsObject) return;
      const properties = optionsObject.properties ?? [];
      for (const property of properties) {
        if (getPropertyKeyName(property) !== "loader") continue;
        const loaderValue = property.value;
        if (
          !loaderValue ||
          (!isNodeOfType(loaderValue, "ArrowFunctionExpression") &&
            !isNodeOfType(loaderValue, "FunctionExpression"))
        )
          continue;
        const functionBody = loaderValue.body;
        if (!functionBody || !isNodeOfType(functionBody, "BlockStatement")) continue;
        let sequentialAwaitCount = 0;
        for (const statement of functionBody.body ?? []) {
          if (hasTopLevelAwait(statement)) sequentialAwaitCount++;
          if (sequentialAwaitCount >= 2) {
            context.report({
              node: property,
              message:
                "Multiple sequential awaits in loader - use Promise.all() to fetch data in parallel and avoid waterfalls",
            });
            break;
          }
        }
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-missing-head-content.ts
const tanstackStartMissingHeadContent = defineRule({
  recommendation:
    "Define head metadata for TanStack Start routes so title, description, and social previews are not omitted.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => {
    let hasHeadContentElement = false;
    return {
      JSXOpeningElement(node) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROOT_ROUTE_FILE_PATTERN.test(filename)) return;
        if (isNodeOfType(node.name, "JSXIdentifier") && node.name.name === "HeadContent")
          hasHeadContentElement = true;
      },
      "Program:exit"(programNode) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROOT_ROUTE_FILE_PATTERN.test(filename)) return;
        if (!hasHeadContentElement)
          context.report({
            node: programNode,
            message:
              "Root route (__root) without <HeadContent /> - route head() meta tags won't render",
          });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-anchor-element.ts
const tanstackStartNoAnchorElement = defineRule({
  recommendation:
    "Use TanStack Link for internal navigation so routing, preloading, and active state work correctly.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const filename = context.getFilename?.() ?? "";
      if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "a") return;
      const hrefAttribute = (node.attributes ?? []).find(
        (attribute) =>
          isNodeOfType(attribute, "JSXAttribute") &&
          isNodeOfType(attribute.name, "JSXIdentifier") &&
          attribute.name.name === "href",
      );
      if (!hrefAttribute?.value) return;
      let hrefValue = null;
      if (isNodeOfType(hrefAttribute.value, "Literal")) hrefValue = hrefAttribute.value.value;
      else if (
        isNodeOfType(hrefAttribute.value, "JSXExpressionContainer") &&
        isNodeOfType(hrefAttribute.value.expression, "Literal")
      )
        hrefValue = hrefAttribute.value.expression.value;
      if (typeof hrefValue === "string" && hrefValue.startsWith("/"))
        context.report({
          node,
          message:
            "Use <Link> from @tanstack/react-router instead of <a> for internal navigation - enables type-safe routing and preloading",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-direct-fetch-in-loader.ts
const tanstackStartNoDirectFetchInLoader = defineRule({
  recommendation:
    "Use typed server functions or shared data helpers from loaders instead of ad hoc fetch calls.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const optionsObject = getRouteOptionsObject(node);
      if (!optionsObject) return;
      const properties = optionsObject.properties ?? [];
      for (const property of properties) {
        if (getPropertyKeyName(property) !== "loader") continue;
        walkAst(property.value ?? property, (child) => {
          if (!isNodeOfType(child, "CallExpression")) return;
          if (isNodeOfType(child.callee, "Identifier") && child.callee.name === "fetch")
            context.report({
              node: child,
              message:
                "Direct fetch() in route loader - use createServerFn() for type-safe server logic with automatic RPC",
            });
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-dynamic-server-fn-import.ts
const tanstackStartNoDynamicServerFnImport = defineRule({
  recommendation:
    "Import server functions statically so bundlers and TanStack can analyze server/client boundaries.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    ImportExpression(node) {
      const source = node.source;
      if (!source) return;
      let importPath = null;
      if (isNodeOfType(source, "Literal") && typeof source.value === "string")
        importPath = source.value;
      else if (isNodeOfType(source, "TemplateLiteral") && source.quasis?.length === 1)
        importPath = source.quasis[0].value?.raw ?? null;
      if (importPath && TANSTACK_SERVER_FN_FILE_PATTERN.test(importPath))
        context.report({
          node,
          message:
            "Dynamic import of server functions file - use static imports so the bundler can replace server code with RPC stubs",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-navigate-in-render.ts
const tanstackStartNoNavigateInRender = defineRule({
  recommendation:
    "Navigate from event handlers, effects, loaders, or redirects instead of triggering navigation during render.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => {
    let deferredCallbackDepth = 0;
    let eventHandlerDepth = 0;
    const isDeferredHookCall = (node) =>
      isHookCall(node, EFFECT_HOOK_NAMES) ||
      isHookCall(node, "useCallback") ||
      isHookCall(node, "useMemo");
    const isEventHandlerAttribute = (node) =>
      isNodeOfType(node.name, "JSXIdentifier") &&
      typeof node.name.name === "string" &&
      node.name.name.startsWith("on") &&
      UPPERCASE_PATTERN$1.test(node.name.name.charAt(2));
    return {
      CallExpression(node) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
        if (isDeferredHookCall(node)) deferredCallbackDepth++;
        if (deferredCallbackDepth > 0 || eventHandlerDepth > 0) return;
        if (
          isNodeOfType(node.callee, "Identifier") &&
          node.callee.name === "navigate" &&
          (node.arguments?.length ?? 0) > 0
        )
          context.report({
            node,
            message:
              "navigate() called during render - use redirect() in beforeLoad/loader for route-level redirects",
          });
      },
      "CallExpression:exit"(node) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
        if (isDeferredHookCall(node))
          deferredCallbackDepth = Math.max(0, deferredCallbackDepth - 1);
      },
      JSXAttribute(node) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
        if (isEventHandlerAttribute(node)) eventHandlerDepth++;
      },
      "JSXAttribute:exit"(node) {
        const filename = context.getFilename?.() ?? "";
        if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
        if (isEventHandlerAttribute(node)) eventHandlerDepth = Math.max(0, eventHandlerDepth - 1);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-secrets-in-loader.ts
const tanstackStartNoSecretsInLoader = defineRule({
  recommendation:
    "Keep secrets in server functions or server-only modules and pass only safe public data through loaders.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const optionsObject = getRouteOptionsObject(node);
      if (!optionsObject) return;
      const properties = optionsObject.properties ?? [];
      for (const property of properties) {
        const keyName = getPropertyKeyName(property);
        if (keyName !== "loader" && keyName !== "beforeLoad") continue;
        walkAst(property.value ?? property, (child) => {
          if (!isNodeOfType(child, "MemberExpression")) return;
          const isProcessEnvAccess =
            isNodeOfType(child.object, "MemberExpression") &&
            isNodeOfType(child.object.object, "Identifier") &&
            child.object.object.name === "process" &&
            isNodeOfType(child.object.property, "Identifier") &&
            child.object.property.name === "env";
          const isImportMetaEnvAccess =
            isNodeOfType(child.object, "MemberExpression") &&
            isNodeOfType(child.object.object, "MetaProperty") &&
            isNodeOfType(child.object.property, "Identifier") &&
            child.object.property.name === "env";
          if (!isProcessEnvAccess && !isImportMetaEnvAccess) return;
          const envVarName = isNodeOfType(child.property, "Identifier")
            ? child.property.name
            : null;
          if (envVarName && isLikelySecret(envVarName)) {
            const envSource = isImportMetaEnvAccess ? "import.meta.env" : "process.env";
            context.report({
              node: child,
              message: `${envSource}.${envVarName} in ${keyName} - loaders are isomorphic and may leak secrets to the client. Move to a createServerFn()`,
            });
          }
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-use-server-in-handler.ts
const tanstackStartNoUseServerInHandler = defineRule({
  recommendation:
    "Keep server functions defined at module scope and call them from handlers instead of creating use server functions inside handlers.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (
        !isNodeOfType(node.callee.property, "Identifier") ||
        node.callee.property.name !== "handler"
      )
        return;
      const handlerFunction = node.arguments?.[0];
      if (
        !handlerFunction ||
        (!isNodeOfType(handlerFunction, "ArrowFunctionExpression") &&
          !isNodeOfType(handlerFunction, "FunctionExpression"))
      )
        return;
      const body = handlerFunction.body;
      if (!isNodeOfType(body, "BlockStatement")) return;
      if (
        body.body?.some(
          (statement) =>
            isNodeOfType(statement, "ExpressionStatement") &&
            (statement.directive === "use server" ||
              (isNodeOfType(statement.expression, "Literal") &&
                statement.expression.value === "use server")),
        )
      )
        context.report({
          node: handlerFunction,
          message:
            '"use server" inside createServerFn handler - TanStack Start handles this automatically, remove the directive',
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-no-useeffect-fetch.ts
const tanstackStartNoUseEffectFetch = defineRule({
  recommendation: "Fetch route data in TanStack loaders or queries instead of useEffect.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const filename = context.getFilename?.() ?? "";
      if (!TANSTACK_ROUTE_FILE_PATTERN.test(filename)) return;
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      let hasFetchCall = false;
      walkAst(callback, (child) => {
        if (hasFetchCall) return;
        if (
          isNodeOfType(child, "CallExpression") &&
          isNodeOfType(child.callee, "Identifier") &&
          child.callee.name === "fetch"
        )
          hasFetchCall = true;
      });
      if (hasFetchCall)
        context.report({
          node,
          message:
            "fetch() inside useEffect in a route file - use the route loader or createServerFn() instead",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-redirect-in-try-catch.ts
const tanstackStartRedirectInTryCatch = defineRule({
  recommendation:
    "Call redirects outside try/catch blocks or rethrow redirect errors so TanStack can handle control flow.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => {
    let tryBlockDepth = 0;
    let catchClauseDepth = 0;
    return {
      TryStatement() {
        tryBlockDepth++;
      },
      "TryStatement:exit"() {
        tryBlockDepth--;
      },
      CatchClause() {
        catchClauseDepth++;
      },
      "CatchClause:exit"() {
        catchClauseDepth--;
      },
      ThrowStatement(node) {
        if (tryBlockDepth === 0) return;
        if (catchClauseDepth > 0) return;
        const argument = node.argument;
        if (!isNodeOfType(argument, "CallExpression")) return;
        if (!isNodeOfType(argument.callee, "Identifier")) return;
        if (!TANSTACK_REDIRECT_FUNCTIONS.has(argument.callee.name)) return;
        context.report({
          node,
          message: `throw ${argument.callee.name}() inside try block - the router catches this internally. Move it outside the try block or re-throw in the catch`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-route-property-order.ts
const tanstackStartRoutePropertyOrder = defineRule({
  recommendation:
    "Order TanStack Start route properties consistently so loaders, validation, head, and component code are easy to scan.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      const optionsObject = getRouteOptionsObject(node);
      if (!optionsObject) return;
      const properties = optionsObject.properties ?? [];
      const orderedPropertyNames = [];
      for (const property of properties) {
        const propertyName = getPropertyKeyName(property);
        if (propertyName !== null) orderedPropertyNames.push(propertyName);
      }
      const sensitiveProperties = orderedPropertyNames.filter((propertyName) =>
        TANSTACK_ROUTE_PROPERTY_ORDER.includes(propertyName),
      );
      let lastIndex = -1;
      for (const propertyName of sensitiveProperties) {
        const currentIndex = TANSTACK_ROUTE_PROPERTY_ORDER.indexOf(propertyName);
        if (currentIndex < lastIndex) {
          const expectedBefore = TANSTACK_ROUTE_PROPERTY_ORDER[lastIndex];
          context.report({
            node: optionsObject,
            message: `Route property "${propertyName}" must come before "${expectedBefore}" - wrong order breaks TypeScript type inference`,
          });
          return;
        }
        lastIndex = currentIndex;
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-server-fn-method-order.ts
const tanstackStartServerFnMethodOrder = defineRule({
  recommendation:
    "Declare TanStack server function method and validation before handler logic so the contract is visible first.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      const methodNames = [];
      let currentNode = node;
      while (
        isNodeOfType(currentNode, "CallExpression") &&
        isNodeOfType(currentNode.callee, "MemberExpression")
      ) {
        const methodName = isNodeOfType(currentNode.callee.property, "Identifier")
          ? currentNode.callee.property.name
          : null;
        if (methodName) methodNames.unshift(methodName);
        currentNode = currentNode.callee.object;
      }
      if (
        isNodeOfType(currentNode, "CallExpression") &&
        isNodeOfType(currentNode.callee, "Identifier")
      ) {
        if (!TANSTACK_SERVER_FN_NAMES.has(currentNode.callee.name)) return;
      } else return;
      const ownMethodName = isNodeOfType(node.callee.property, "Identifier")
        ? node.callee.property.name
        : null;
      if (methodNames[methodNames.length - 1] !== ownMethodName) return;
      const orderSensitiveMethods = methodNames.filter((name) =>
        TANSTACK_MIDDLEWARE_METHOD_ORDER.includes(name),
      );
      let lastIndex = -1;
      for (const methodName of orderSensitiveMethods) {
        const currentIndex = TANSTACK_MIDDLEWARE_METHOD_ORDER.indexOf(methodName);
        if (currentIndex < lastIndex) {
          const expectedBefore = TANSTACK_MIDDLEWARE_METHOD_ORDER[lastIndex];
          context.report({
            node,
            message: `Server function method .${methodName}() must come before .${expectedBefore}() - wrong order breaks type inference`,
          });
          return;
        }
        lastIndex = currentIndex;
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tanstack-start/tanstack-start-server-fn-validate-input.ts
const tanstackStartServerFnValidateInput = defineRule({
  recommendation:
    "Validate server function input before using it so server-side assumptions are explicit and safe.",
  examples: [
    {
      before: `export const Route = createFileRoute("/items")({ component: Items });`,
      after: `export const Route = createFileRoute("/items")({ loader, head, component: Items });`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (node.callee.property.name !== "handler") return;
      const chainInfo = walkServerFnChain(node);
      if (!chainInfo.isServerFnChain) return;
      const handlerFunction = node.arguments?.[0];
      if (!handlerFunction) return;
      let accessesData = false;
      walkAst(handlerFunction, (child) => {
        if (
          isNodeOfType(child, "MemberExpression") &&
          isNodeOfType(child.property, "Identifier") &&
          child.property.name === "data"
        )
          accessesData = true;
        if (
          isNodeOfType(child, "ObjectPattern") &&
          child.properties?.some(
            (property) => isNodeOfType(property.key, "Identifier") && property.key.name === "data",
          )
        )
          accessesData = true;
      });
      if (accessesData && !chainInfo.hasInputValidator)
        context.report({
          node,
          message:
            "Server function handler accesses data without inputValidator() - validate inputs crossing the network boundary",
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tailwind/utils/find-class-name-literal.ts
const findClassNameLiteral = (openingElement) => {
  const classNameAttribute = findJsxAttribute(openingElement.attributes ?? [], "className");
  if (!classNameAttribute?.value) return null;
  if (
    isNodeOfType(classNameAttribute.value, "Literal") &&
    typeof classNameAttribute.value.value === "string"
  )
    return {
      attribute: classNameAttribute,
      value: classNameAttribute.value.value,
    };
  if (!isNodeOfType(classNameAttribute.value, "JSXExpressionContainer")) return null;
  const expression = classNameAttribute.value.expression;
  if (isNodeOfType(expression, "Literal") && typeof expression.value === "string")
    return {
      attribute: classNameAttribute,
      value: expression.value,
    };
  if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1) {
    const value = expression.quasis[0].value?.raw;
    return value
      ? {
          attribute: classNameAttribute,
          value,
        }
      : null;
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/get-literal-string.ts
const getLiteralString = (node) => {
  if (isNodeOfType(node, "Literal") && typeof node.value === "string") return node.value;
  if (isNodeOfType(node, "TemplateLiteral") && node.quasis?.length === 1)
    return node.quasis[0].value?.raw ?? null;
  return null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/tokenize-class-name.ts
const tokenizeClassName = (classNameValue) => classNameValue.split(/\s+/).filter(Boolean);
//#endregion
//#region src/core/rules/lint/tailwind/utils/display-tokens.ts
const DISPLAY_TOKENS = new Set([
  "block",
  "contents",
  "flex",
  "flow-root",
  "grid",
  "hidden",
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
]);
//#endregion
//#region src/core/rules/lint/tailwind/utils/position-tokens.ts
const POSITION_TOKENS = new Set(["absolute", "fixed", "relative", "static", "sticky"]);
//#endregion
//#region src/core/rules/lint/tailwind/utils/text-size-tokens.ts
const TEXT_SIZE_TOKENS = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
]);
//#endregion
//#region src/core/rules/lint/tailwind/utils/get-overflow-group.ts
const getOverflowGroup = (baseToken) => {
  const match = baseToken.match(/^(overflow-x|overflow-y|overflow)-/);
  return match ? match[1] : null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/get-size-group.ts
const getSizeGroup = (baseToken) => {
  const match = baseToken.match(/^(w|h|min-w|min-h|max-w|max-h)-/);
  return match ? match[1] : null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/get-spacing-group.ts
const getSpacingGroup = (baseToken) => {
  const match = baseToken.match(/^-?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-/);
  return match ? match[1] : null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/split-variant.ts
const splitVariant = (token) => {
  const separatorIndex = token.lastIndexOf(":");
  if (separatorIndex === -1)
    return {
      variant: "",
      baseToken: token,
    };
  return {
    variant: token.slice(0, separatorIndex + 1),
    baseToken: token.slice(separatorIndex + 1),
  };
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/get-tailwind-token-group.ts
const getTailwindTokenGroup = (token) => {
  const { variant, baseToken } = splitVariant(token);
  const spacingGroup = getSpacingGroup(baseToken);
  if (spacingGroup)
    return {
      token,
      group: `${variant}${spacingGroup}`,
    };
  const sizeGroup = getSizeGroup(baseToken);
  if (sizeGroup)
    return {
      token,
      group: `${variant}${sizeGroup}`,
    };
  const overflowGroup = getOverflowGroup(baseToken);
  if (overflowGroup)
    return {
      token,
      group: `${variant}${overflowGroup}`,
    };
  if (DISPLAY_TOKENS.has(baseToken))
    return {
      token,
      group: `${variant}display`,
    };
  if (POSITION_TOKENS.has(baseToken))
    return {
      token,
      group: `${variant}position`,
    };
  if (
    TEXT_SIZE_TOKENS.has(baseToken) ||
    /^text-\[\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)\]$/.test(baseToken)
  )
    return {
      token,
      group: `${variant}text-size`,
    };
  if (/^bg-(?!opacity-)/.test(baseToken))
    return {
      token,
      group: `${variant}background`,
    };
  if (/^z-/.test(baseToken))
    return {
      token,
      group: `${variant}z-index`,
    };
  return null;
};
//#endregion
//#region src/core/rules/lint/tailwind/utils/find-tailwind-class-conflict.ts
const findTailwindClassConflict = (classNameValue) => {
  const seenGroups = /* @__PURE__ */ new Map();
  for (const token of tokenizeClassName(classNameValue)) {
    const groupedToken = getTailwindTokenGroup(token);
    if (!groupedToken) continue;
    const previousToken = seenGroups.get(groupedToken.group);
    if (previousToken && previousToken !== groupedToken.token)
      return {
        group: groupedToken.group,
        previousToken,
        token: groupedToken.token,
      };
    seenGroups.set(groupedToken.group, groupedToken.token);
  }
  return null;
};
//#endregion
//#region src/core/rules/lint/tailwind/tailwind-no-conflicting-classes.ts
const tailwindNoConflictingClasses = defineRule({
  recommendation:
    "Remove same-variant Tailwind utilities that fight for the same CSS property; keep the one intended final value instead of relying on class order.",
  examples: [
    {
      before: `<div className="flex grid p-2 p-4" />`,
      after: `<div className="grid p-4" />`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const classNameLiteral = findClassNameLiteral(node);
      if (!classNameLiteral) return;
      const conflict = findTailwindClassConflict(classNameLiteral.value);
      if (!conflict) return;
      context.report({
        node: classNameLiteral.attribute,
        message: `Tailwind class "${conflict.token}" conflicts with earlier "${conflict.previousToken}" ${conflict.group} utility - remove the overridden class`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/tailwind/tailwind-oklch-alpha-syntax.ts
const COMMA_ALPHA_OKLCH_PATTERN = /oklch\([^)]*,\s*(?:0?\.\d+|1(?:\.0+)?)\)/i;
const tailwindOklchAlphaSyntax = defineRule({
  recommendation:
    "Write OKLCH alpha with slash syntax such as oklch(0.7 0.12 240 / 0.5); comma alpha is invalid CSS and will not render reliably.",
  examples: [
    {
      before: `style={{ color: "oklch(0.7 0.12 240, 0.5)" }}`,
      after: `style={{ color: "oklch(0.7 0.12 240 / 0.5)" }}`,
    },
  ],
  create: (context) => ({
    Literal(node) {
      const value = getLiteralString(node);
      if (!value || !COMMA_ALPHA_OKLCH_PATTERN.test(value)) return;
      context.report({
        node,
        message: "OKLCH color uses comma alpha syntax - use slash alpha syntax instead",
      });
    },
    TemplateLiteral(node) {
      const value = getLiteralString(node);
      if (!value || !COMMA_ALPHA_OKLCH_PATTERN.test(value)) return;
      context.report({
        node,
        message: "OKLCH color uses comma alpha syntax - use slash alpha syntax instead",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/testing-library/utils/user-event-methods.ts
const USER_EVENT_METHODS = new Set([
  "click",
  "dblClick",
  "hover",
  "keyboard",
  "selectOptions",
  "type",
  "unhover",
  "upload",
]);
//#endregion
//#region src/core/rules/lint/testing-library/utils/get-root-identifier-name.ts
const getRootIdentifierName = (node) => {
  if (!node) return null;
  if (isNodeOfType(node, "Identifier")) return node.name;
  if (isNodeOfType(node, "MemberExpression")) return getRootIdentifierName(node.object);
  return null;
};
//#endregion
//#region src/core/rules/lint/testing-library/testing-await-user-event.ts
const isAwaited = (node) => isNodeOfType(node.parent, "AwaitExpression");
const testingAwaitUserEvent = defineRule({
  recommendation:
    "Await async userEvent interactions so assertions run after the browser-like event sequence has finished.",
  examples: [
    {
      before: `userEvent.click(screen.getByRole("button"));`,
      after: `await userEvent.click(screen.getByRole("button"));`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (getRootIdentifierName(node.callee) !== "userEvent") return;
      const methodName = getMemberPropertyName(node.callee);
      if (!methodName || !USER_EVENT_METHODS.has(methodName)) return;
      if (isAwaited(node)) return;
      context.report({
        node,
        message: `userEvent.${methodName}() is async - await it before asserting`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/testing-library/testing-no-container-query.ts
const CONTAINER_QUERY_METHODS = new Set(["getElementById", "querySelector", "querySelectorAll"]);
const testingNoContainerQuery = defineRule({
  recommendation:
    "Query tests through screen and accessible roles/text instead of container DOM selectors so tests exercise user-visible behavior.",
  examples: [
    {
      before: `const submit = container.querySelector("button[type=submit]");`,
      after: `const submit = screen.getByRole("button", { name: /submit/i });`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestFile = TEST_FILE_PATTERN.test(filename);
    return {
      CallExpression(node) {
        if (!isTestFile) return;
        if (!isNodeOfType(node.callee, "MemberExpression")) return;
        const rootName = getRootIdentifierName(node.callee);
        const methodName = getMemberPropertyName(node.callee);
        if (rootName !== "container" || !methodName || !CONTAINER_QUERY_METHODS.has(methodName))
          return;
        context.report({
          node,
          message: `container.${methodName}() bypasses Testing Library queries - use screen.getByRole/getByText for user-visible behavior`,
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/use-lazy-motion.ts
const useLazyMotion = defineRule({
  recommendation:
    "Use LazyMotion with a minimal feature bundle for Framer Motion so animation features load only when needed.",
  examples: [
    {
      before: `import { motion } from "framer-motion";`,
      after: `import { LazyMotion, domAnimation } from "framer-motion";`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (source !== "framer-motion" && source !== "motion/react") return;
      if (
        node.specifiers?.some(
          (specifier) =>
            isNodeOfType(specifier, "ImportSpecifier") && specifier.imported?.name === "motion",
        )
      )
        context.report({
          node,
          message: 'Import "m" with LazyMotion instead of "motion" - saves ~30kb in bundle size',
        });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/advanced-init-once.ts
const appInitCallPattern =
  /(?:^init|initialize|setup|configure|loadFromStorage|checkAuth|hydrate|bootstrap)/i;
const advancedInitOnce = defineRule({
  recommendation:
    "Move app-wide initialization to module scope or guard it with a module-level flag so remounts and Strict Mode do not initialize twice.",
  examples: [
    {
      before: `useEffect(() => initializeAnalytics(), []);`,
      after: `let didInitialize = false;
if (!didInitialize) { initializeAnalytics(); didInitialize = true; }`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const deps = node.arguments?.[1];
      if (!isNodeOfType(deps, "ArrayExpression") || (deps.elements?.length ?? 0) !== 0) return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      let initCall = null;
      walkAst(callback, (child) => {
        if (initCall) return false;
        if (!isNodeOfType(child, "CallExpression")) return;
        const callee = child.callee;
        const calleeName = isNodeOfType(callee, "Identifier")
          ? callee.name
          : isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")
            ? callee.property.name
            : null;
        if (calleeName && appInitCallPattern.test(calleeName)) initCall = child;
      });
      if (!initCall) return;
      context.report({
        node: initCall,
        message:
          "app-wide initialization in useEffect([]) can run again on remount or Strict Mode - guard it at module scope or move initialization to the app entry",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/advanced-use-latest.ts
const advancedUseLatest = defineRule({
  recommendation:
    "Wrap callback props with useEffectEvent or a useLatest ref and call the latest value from subscriptions instead of re-subscribing on every render.",
  examples: [
    {
      before: `useEffect(() => socket.on("message", onMessage), [onMessage]);`,
      after: `const onMessageEvent = useEffectEvent(onMessage);
useEffect(() => socket.on("message", onMessageEvent), []);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const deps = node.arguments?.[1];
      if (!isNodeOfType(deps, "ArrayExpression")) return;
      for (const dependency of deps.elements ?? []) {
        if (!isNodeOfType(dependency, "Identifier")) continue;
        if (!/^on[A-Z]/.test(dependency.name) && !/callback|handler/i.test(dependency.name))
          continue;
        context.report({
          node: dependency,
          message: `"${dependency.name}" in effect deps looks like a callback prop - wrap it with useEffectEvent/useLatest and call the latest ref from the subscription instead of re-subscribing`,
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/async-api-routes.ts
const isApiOrRouteFile = (filename) =>
  APP_ROUTER_FILE_PATTERN.test(filename) || PAGES_ROUTER_API_PATH_PATTERN.test(filename);
const asyncApiRoutes = defineRule({
  recommendation:
    "Start independent promises at the top of route handlers or server actions, then await them together once all work has been kicked off.",
  examples: [
    {
      before: `const user = await getUser();
const settings = await getSettings();`,
      after: `const userPromise = getUser();
const settingsPromise = getSettings();
const [user, settings] = await Promise.all([userPromise, settingsPromise]);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    return {
      BlockStatement(node) {
        if (!isApiOrRouteFile(filename)) return;
        const statements = node.body ?? [];
        for (let statementIndex = 0; statementIndex < statements.length - 1; statementIndex++) {
          const currentStatement = statements[statementIndex];
          const nextStatement = statements[statementIndex + 1];
          if (!isNodeOfType(currentStatement, "VariableDeclaration")) continue;
          if (!isNodeOfType(nextStatement, "VariableDeclaration")) continue;
          const currentDeclarator = currentStatement.declarations?.[0];
          const nextDeclarator = nextStatement.declarations?.[0];
          if (!isNodeOfType(currentDeclarator.init, "AwaitExpression")) continue;
          if (!isNodeOfType(nextDeclarator.init, "AwaitExpression")) continue;
          const currentNames = /* @__PURE__ */ new Set();
          const nextReadNames = /* @__PURE__ */ new Set();
          collectIdentifierNames(currentDeclarator.id, currentNames);
          collectIdentifierNames(nextDeclarator.init, nextReadNames);
          if ([...currentNames].some((name) => nextReadNames.has(name))) continue;
          context.report({
            node: nextStatement,
            message:
              "API route/server action starts independent async work after a previous await - create promises first and await later to avoid route-handler waterfalls",
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/async-cheap-condition-before-await.ts
const asyncCheapConditionBeforeAwait = defineRule({
  recommendation:
    "Check cheap synchronous guards before awaiting expensive work so the cold path can return without starting unnecessary async operations.",
  examples: [
    {
      before: `const user = await getUser();
if (enabled && user.active) return user;`,
      after: `if (!enabled) return null;
const user = await getUser();`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    const awaitedBindings = /* @__PURE__ */ new Set();
    return {
      VariableDeclarator(node) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        if (!isNodeOfType(node.init, "AwaitExpression")) return;
        awaitedBindings.add(node.id.name);
      },
      IfStatement(node) {
        if (isTestOrInfraFile) return;
        if (!isNodeOfType(node.test, "LogicalExpression")) return;
        if (node.test.operator !== "&&" && node.test.operator !== "||") return;
        const leftNames = /* @__PURE__ */ new Set();
        const rightNames = /* @__PURE__ */ new Set();
        collectIdentifierNames(node.test.left, leftNames);
        collectIdentifierNames(node.test.right, rightNames);
        const leftUsesAwaited = [...awaitedBindings].some((name) => leftNames.has(name));
        const rightUsesAwaited = [...awaitedBindings].some((name) => rightNames.has(name));
        if (!leftUsesAwaited || rightUsesAwaited) return;
        context.report({
          node,
          message:
            "awaited flag is checked before a cheap synchronous condition - check the local condition first so the async work is skipped on the cold path",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/async-dependencies.ts
const isAwaitedPromiseAll = (node) =>
  isNodeOfType(node, "AwaitExpression") &&
  isNodeOfType(node.argument, "CallExpression") &&
  isNodeOfType(node.argument.callee, "MemberExpression") &&
  isNodeOfType(node.argument.callee.object, "Identifier") &&
  node.argument.callee.object.name === "Promise" &&
  isNodeOfType(node.argument.callee.property, "Identifier") &&
  node.argument.callee.property.name === "all";
const asyncDependencies = defineRule({
  recommendation:
    "Start partially dependent async work as early as possible or use a dependency-aware parallelization helper so only real dependencies wait.",
  examples: [
    {
      before: `const [user] = await Promise.all([getUser()]);
const posts = await getPosts(user.id);`,
      after: `const user = await getUser();
const postsPromise = getPosts(user.id);`,
    },
  ],
  create: (context) => ({
    BlockStatement(node) {
      const statements = node.body ?? [];
      for (let statementIndex = 0; statementIndex < statements.length - 1; statementIndex++) {
        const promiseAllStatement = statements[statementIndex];
        if (!isNodeOfType(promiseAllStatement, "VariableDeclaration")) continue;
        const promiseAllDeclarator = promiseAllStatement.declarations?.[0];
        if (!promiseAllDeclarator || !isAwaitedPromiseAll(promiseAllDeclarator.init)) continue;
        const declaredNames = /* @__PURE__ */ new Set();
        collectIdentifierNames(promiseAllDeclarator.id, declaredNames);
        if (declaredNames.size === 0) continue;
        const nextStatement = statements[statementIndex + 1];
        if (!isNodeOfType(nextStatement, "VariableDeclaration")) continue;
        const nextDeclarator = nextStatement.declarations?.[0];
        if (!isNodeOfType(nextDeclarator.init, "AwaitExpression")) continue;
        const readNames = /* @__PURE__ */ new Set();
        collectIdentifierNames(nextDeclarator.init, readNames);
        if (![...declaredNames].some((name) => readNames.has(name))) continue;
        context.report({
          node: nextStatement,
          message:
            "await after Promise.all depends on only part of the result - start the dependent promise as early as possible, or use dependency-aware parallelization like better-all",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/async-suspense-boundaries.ts
const containsJsxSuspense = (node) => {
  let foundSuspense = false;
  const visit = (child) => {
    if (foundSuspense) return;
    if (isNodeOfType(child, "JSXOpeningElement")) {
      const name = child.name;
      if (isNodeOfType(name, "JSXIdentifier") && name.name === "Suspense") foundSuspense = true;
    }
    for (const key of Object.keys(child)) {
      if (key === "parent") continue;
      const value = child[key];
      if (Array.isArray(value)) {
        for (const item of value) if (item?.type) visit(item);
      } else if (value?.type) visit(value);
    }
  };
  visit(node);
  return foundSuspense;
};
const asyncSuspenseBoundaries = defineRule({
  recommendation:
    "Wrap slow async child regions in Suspense boundaries so React can stream available UI while slower data resolves.",
  examples: [
    {
      before: `<Page>{await SlowPanel()}</Page>`,
      after: `<Suspense fallback={<Spinner />}><SlowPanel /></Suspense>`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isSkippedFile =
      PAGE_OR_LAYOUT_FILE_PATTERN.test(filename) || ROUTE_HANDLER_FILE_PATTERN.test(filename);
    const checkAsyncComponent = (node, body) => {
      if (isSkippedFile) return;
      if (!node.async || !body) return;
      if (containsJsxSuspense(body)) return;
      context.report({
        node,
        message:
          "async component renders without a Suspense boundary - wrap slower child regions in <Suspense> so React can stream available content",
      });
    };
    return {
      FunctionDeclaration(node) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkAsyncComponent(node, node.body);
      },
      VariableDeclarator(node) {
        if (!isComponentAssignment(node)) return;
        checkAsyncComponent(node.init, node.init?.body);
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/bundle-conditional.ts
const bundleConditional = defineRule({
  recommendation:
    "Move optional or feature-gated heavy modules behind conditional dynamic imports so inactive users do not download or execute them.",
  examples: [
    {
      before: `import Fuse from "fuse.js";`,
      after: `if (query) { const Fuse = await import("fuse.js"); }`,
    },
  ],
  create: (context) => ({
    ImportDeclaration(node) {
      const source = node.source?.value;
      if (typeof source !== "string" || !HEAVY_LIBRARIES.has(source)) return;
      context.report({
        node,
        message: `"${source}" is loaded eagerly - if this feature is gated or optional, move it behind a conditional dynamic import so inactive users don't pay for it`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/bundle-preload.ts
const handlerAttributeNames = new Set(["onClick", "onSubmit"]);
const preloadAttributeNames = new Set(["onMouseEnter", "onPointerEnter", "onFocus"]);
const containsDynamicImport = (node) => {
  let foundDynamicImport = false;
  walkAst(node, (child) => {
    if (foundDynamicImport) return false;
    if (isNodeOfType(child, "ImportExpression")) foundDynamicImport = true;
  });
  return foundDynamicImport;
};
const bundlePreload = defineRule({
  recommendation:
    "Preload dynamic imports on hover, focus, or another user-intent signal before the click or submit path needs the bundle.",
  examples: [
    {
      before: `<button onClick={() => import("./Chart")}>Open</button>`,
      after: `<button onMouseEnter={() => import("./Chart")} onClick={open}>Open</button>`,
    },
  ],
  create: (context) => ({
    JSXOpeningElement(node) {
      const attributes = node.attributes ?? [];
      if (
        attributes.some(
          (attribute) =>
            isNodeOfType(attribute, "JSXAttribute") &&
            isNodeOfType(attribute.name, "JSXIdentifier") &&
            preloadAttributeNames.has(attribute.name.name),
        )
      )
        return;
      for (const attribute of attributes) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        if (!handlerAttributeNames.has(attribute.name.name)) continue;
        if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
        const expression = attribute.value.expression;
        if (!expression || !containsDynamicImport(expression)) continue;
        context.report({
          node: attribute,
          message:
            "dynamic import starts only after activation - preload the bundle on hover/focus or another user-intent signal to reduce perceived latency",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/client-event-listeners.ts
const UPPERCASE_PATTERN = /^[A-Z]/;
const isInsideComponentOrHook = (node) => {
  let current = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "FunctionDeclaration") &&
      current.id?.name &&
      (UPPERCASE_PATTERN.test(current.id.name) || current.id.name.startsWith("use"))
    )
      return true;
    if (
      isNodeOfType(current, "VariableDeclarator") &&
      isNodeOfType(current.id, "Identifier") &&
      (UPPERCASE_PATTERN.test(current.id.name) || current.id.name.startsWith("use"))
    )
      return true;
    current = current.parent;
  }
  return false;
};
const clientEventListeners = defineRule({
  recommendation:
    "Share global window/document listeners through one module-level subscription or a shared hook instead of adding one listener per component instance.",
  examples: [
    {
      before: `useEffect(() => window.addEventListener("resize", onResize), []);`,
      after: `subscribeToWindowResize(onResize);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    return {
      CallExpression(node) {
        if (isTestOrInfraFile) return;
        if (!isAddEventListenerCall(node)) return;
        const eventTarget = node.callee?.object;
        if (!isNodeOfType(eventTarget, "Identifier")) return;
        if (eventTarget.name !== "window" && eventTarget.name !== "document") return;
        if (!isInsideComponentOrHook(node)) return;
        context.report({
          node,
          message:
            "global event listener is registered per component instance - share it through a module-level subscription or useSWRSubscription so N components don't add N listeners",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/client-swr-dedup.ts
const clientSwrDedup = defineRule({
  recommendation:
    "Use SWR, TanStack Query, or another shared client data layer for client fetches so duplicate component instances dedupe requests.",
  examples: [
    {
      before: `useEffect(() => { fetch("/api/user").then(setUser); }, []);`,
      after: `const { data: user } = useSWR("/api/user", fetcher);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      const callback = node.arguments?.[0];
      if (!callback) return;
      let hasFetch = false;
      walkAst(callback, (child) => {
        if (hasFetch) return false;
        hasFetch =
          isNodeOfType(child, "CallExpression") &&
          isNodeOfType(child.callee, "Identifier") &&
          child.callee.name === "fetch";
      });
      if (!hasFetch) return;
      context.report({
        node,
        message:
          "fetch inside useEffect creates per-instance requests - use SWR/useSWRMutation or a shared client data layer for deduplication and caching",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/js-cache-function-results.ts
const REACT_HOOK_PATTERN = /^use[A-Z]/;
const FACTORY_FUNCTION_PATTERN = /^(?:create|make|build|new|init|generate|clone)[A-Z]/;
const getSimpleCallKey = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  if (!isNodeOfType(node.callee, "Identifier")) return null;
  if (REACT_HOOK_PATTERN.test(node.callee.name)) return null;
  if (FACTORY_FUNCTION_PATTERN.test(node.callee.name)) return null;
  const argumentKeys = [];
  for (const argument of node.arguments ?? [])
    if (isNodeOfType(argument, "Identifier")) argumentKeys.push(argument.name);
    else if (isNodeOfType(argument, "Literal")) argumentKeys.push(String(argument.value));
    else return null;
  return `${node.callee.name}(${argumentKeys.join(",")})`;
};
const jsCacheFunctionResults = defineRule({
  recommendation:
    "Store repeated pure function results in a local variable or module-level cache when the same inputs are computed multiple times.",
  examples: [
    {
      before: `const a = formatPrice(value);
const b = formatPrice(value);`,
      after: `const formattedPrice = formatPrice(value);`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    return {
      BlockStatement(node) {
        if (isTestOrInfraFile) return;
        const calls = /* @__PURE__ */ new Map();
        for (const statement of node.body ?? []) {
          if (!isNodeOfType(statement, "VariableDeclaration")) continue;
          for (const declarator of statement.declarations ?? []) {
            const key = getSimpleCallKey(declarator.init);
            if (!key) continue;
            const entries = calls.get(key) ?? [];
            entries.push(declarator.init);
            calls.set(key, entries);
          }
        }
        for (const [callKey, entries] of calls) {
          if (entries.length < 2) continue;
          context.report({
            node: entries[1],
            message: `${callKey} is computed repeatedly in the same block - cache the result in one variable or a module-level Map if it is reused across calls`,
          });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/js-request-idle-callback.ts
const SERVER_OR_CLI_FILE_PATTERN =
  /\/(?:server|cli|bin|scripts|workers?|cron|jobs?|commands?|api)\//;
const isDeferrableCall = (node) => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (!isNodeOfType(callee.object, "Identifier")) return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  return (
    ANALYTICS_DEFERRABLE_OBJECTS.has(callee.object.name) &&
    ANALYTICS_DEFERRABLE_METHODS.has(callee.property.name)
  );
};
const jsRequestIdleCallback = defineRule({
  recommendation:
    "Schedule non-critical analytics, logging, and background work with requestIdleCallback or a timeout-backed idle scheduler.",
  examples: [
    {
      before: `analytics.track("view");`,
      after: `requestIdleCallback(() => analytics.track("view"));`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isNonBrowserFile =
      TEST_OR_INFRA_FILE_PATTERN.test(filename) || SERVER_OR_CLI_FILE_PATTERN.test(filename);
    return {
      CallExpression(node) {
        if (isNonBrowserFile) return;
        if (!isDeferrableCall(node)) return;
        context.report({
          node,
          message:
            "non-critical analytics/logging runs immediately - schedule it with requestIdleCallback (with a timeout if required) so input and animation work stay responsive",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/performance/rendering-activity.ts
const expensiveComponentPattern =
  /(?:Editor|Chart|Canvas|Map|Table|Modal|Menu|Panel|Preview|Player)$/;
const renderingActivity = defineRule({
  recommendation:
    "Use React Activity or another preserve-state show/hide primitive for frequently toggled expensive UI instead of remounting it each time.",
  examples: [
    {
      before: `{open ? <HeavyPanel /> : null}`,
      after: `<Activity mode={open ? "visible" : "hidden"}><HeavyPanel /></Activity>`,
    },
  ],
  create: (context) => ({
    ConditionalExpression(node) {
      const consequent = node.consequent;
      if (!isNodeOfType(consequent, "JSXElement")) return;
      const name = consequent.openingElement?.name;
      if (!isNodeOfType(name, "JSXIdentifier")) return;
      if (!expensiveComponentPattern.test(name.name)) return;
      context.report({
        node: consequent,
        message: `<${name.name}> is conditionally mounted/unmounted - use React <Activity> for frequently toggled expensive UI so state and DOM can be preserved`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-content-visibility.ts
const LIST_RENDER_METHODS = new Set(["map", "flatMap"]);
const hasContentVisibilityStyle = (node) => {
  for (const attribute of node.attributes ?? []) {
    if (!isNodeOfType(attribute, "JSXAttribute")) continue;
    if (!isNodeOfType(attribute.name, "JSXIdentifier") || attribute.name.name !== "style") continue;
    if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
    const expression = attribute.value.expression;
    if (!isNodeOfType(expression, "ObjectExpression")) continue;
    for (const property of expression.properties ?? []) {
      if (!isNodeOfType(property, "Property")) continue;
      const key = property.key;
      if (isNodeOfType(key, "Identifier") && key.name === "contentVisibility") return true;
      if (isNodeOfType(key, "Literal") && key.value === "contentVisibility") return true;
    }
  }
  return false;
};
const renderingContentVisibility = defineRule({
  recommendation:
    "Add content-visibility and contain-intrinsic-size to long off-screen sections, or virtualize very large lists.",
  examples: [
    {
      before: `{items.map((item) => <article>{item.title}</article>)}`,
      after: `{items.map((item) => <article style={{ contentVisibility: "auto", containIntrinsicSize: "200px" }}>{item.title}</article>)}`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.property, "Identifier")) return;
      if (!LIST_RENDER_METHODS.has(node.callee.property.name)) return;
      const body = node.arguments?.[0]?.body;
      const jsxElement = isNodeOfType(body, "JSXElement") ? body : null;
      if (!jsxElement) return;
      const openingElement = jsxElement.openingElement;
      if (hasContentVisibilityStyle(openingElement)) return;
      context.report({
        node: openingElement,
        message:
          "large mapped list item lacks content-visibility hints - add contentVisibility: 'auto' / containIntrinsicSize or virtualize the list to defer off-screen work",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-hydration-suppress-warning.ts
const renderingHydrationSuppressWarning = defineRule({
  recommendation:
    "Do not use suppressHydrationWarning to hide real nondeterminism; move time, random, locale, and browser-only values to a client-only boundary or render a stable server placeholder.",
  examples: [
    {
      before: `<span suppressHydrationWarning>{Date.now()}</span>`,
      after: `<ClientTime />`,
    },
  ],
  create: (context) => ({
    JSXElement(node) {
      const openingElement = node.openingElement;
      if (!hasSuppressHydrationWarningAttribute(openingElement)) return;
      let matchedDisplay = null;
      walkAst(node, (child) => {
        if (matchedDisplay) return false;
        for (const pattern of NONDETERMINISTIC_RENDER_PATTERNS)
          if (pattern.matches(child)) {
            matchedDisplay = pattern.display;
            return false;
          }
      });
      if (!matchedDisplay) return;
      context.report({
        node: openingElement,
        message: `suppressHydrationWarning hides ${matchedDisplay}, but the server HTML is still nondeterministic - move the value to a client-only boundary or render a stable placeholder`,
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/performance/rendering-resource-hints.ts
const resourceHintFunctions = new Set([
  "preconnect",
  "prefetchDNS",
  "preload",
  "preloadModule",
  "preinit",
  "preinitModule",
]);
const renderingResourceHints = defineRule({
  recommendation:
    "Use React DOM resource hint APIs such as preconnect, preload, and preinit instead of hand-authored link hints in React markup.",
  examples: [
    {
      before: `<link rel="preload" href="/font.woff2" />`,
      after: `preload("/font.woff2", { as: "font" });`,
    },
  ],
  create: (context) => {
    let hasReactDomResourceHintImport = false;
    return {
      ImportDeclaration(node) {
        if (node.source?.value !== "react-dom") return;
        for (const specifier of node.specifiers ?? []) {
          if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
          const importedName = specifier.imported?.name;
          if (resourceHintFunctions.has(importedName)) hasReactDomResourceHintImport = true;
        }
      },
      JSXOpeningElement(node) {
        if (hasReactDomResourceHintImport) return;
        if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "link") return;
        for (const attribute of node.attributes ?? []) {
          if (!isNodeOfType(attribute, "JSXAttribute")) continue;
          if (!isNodeOfType(attribute.name, "JSXIdentifier") || attribute.name.name !== "rel")
            continue;
          const value = attribute.value;
          if (
            isNodeOfType(value, "Literal") &&
            ["preload", "preconnect", "prefetch", "dns-prefetch"].includes(String(value.value))
          )
            context.report({
              node,
              message:
                "manual <link> resource hint in React code - prefer React DOM resource hint APIs like preload(), preconnect(), or preinit() so hints participate in React rendering",
            });
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/react/rerender-memo.ts
const rerenderMemo = defineRule({
  recommendation:
    "Extract expensive JSX subtrees into memoized child components so parent renders and early returns can skip their work.",
  examples: [
    {
      before: `const rows = useMemo(() => <Rows items={items} />, [items]);`,
      after: `const MemoRows = memo(Rows);
<MemoRows items={items} />`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, "useMemo")) return;
      const callback = node.arguments?.[0];
      if (!callbackReturnsJsx(callback)) return;
      context.report({
        node,
        message:
          "useMemo returns JSX - extract the expensive subtree into a memoized child component so parent early returns and prop equality can skip the work",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rerender-split-combined-hooks.ts
const splitCandidateHookNames = new Set(["useMemo", "useCallback", ...EFFECT_HOOK_NAMES]);
const rerenderSplitCombinedHooks = defineRule({
  recommendation:
    "Split hook callbacks that do unrelated work with different dependencies so one dependency change does not rerun everything.",
  examples: [
    {
      before: `useMemo(() => ({ filtered: filter(items), sorted: sort(other) }), [items, other]);`,
      after: `const filtered = useMemo(() => filter(items), [items]);
const sorted = useMemo(() => sort(other), [other]);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, splitCandidateHookNames)) return;
      const callback = node.arguments?.[0];
      const deps = node.arguments?.[1];
      if (!isNodeOfType(callback.body, "BlockStatement")) return;
      if (!isNodeOfType(deps, "ArrayExpression") || (deps.elements?.length ?? 0) < 4) return;
      if (
        (callback.body.body ?? []).filter((statement) => !isNodeOfType(statement, "EmptyStatement"))
          .length < 4
      )
        return;
      context.report({
        node,
        message:
          "hook callback performs multiple steps with multiple dependencies - split independent work into separate hooks so one dependency change does not rerun unrelated work",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rerender-use-deferred-value.ts
const EXPENSIVE_ARRAY_METHODS = new Set(["filter", "map", "flatMap", "sort", "toSorted", "reduce"]);
const interactiveNamePattern = /(?:query|search|input|filter|term|value)/i;
const rerenderUseDeferredValue = defineRule({
  recommendation:
    "Wrap interactive input used by expensive rendering work with useDeferredValue so typing and pointer input stay responsive.",
  examples: [
    {
      before: `const results = useMemo(() => search(items, query), [items, query]);`,
      after: `const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(items, deferredQuery), [items, deferredQuery]);`,
    },
  ],
  create: (context) => ({
    CallExpression(node) {
      if (!isHookCall(node, "useMemo")) return;
      const deps = node.arguments?.[1];
      if (!isNodeOfType(deps, "ArrayExpression")) return;
      if (
        !(deps.elements ?? []).some(
          (dependency) =>
            isNodeOfType(dependency, "Identifier") && interactiveNamePattern.test(dependency.name),
        )
      )
        return;
      const body = node.arguments?.[0]?.body;
      const expression = isNodeOfType(body, "BlockStatement") ? null : body;
      if (
        !(
          isNodeOfType(expression, "CallExpression") &&
          isNodeOfType(expression.callee, "MemberExpression") &&
          isNodeOfType(expression.callee.property, "Identifier") &&
          EXPENSIVE_ARRAY_METHODS.has(expression.callee.property.name)
        )
      )
        return;
      context.report({
        node,
        message:
          "expensive derived render depends on interactive input - wrap the input with useDeferredValue so typing stays responsive while the list recomputes",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/react/rerender-use-ref-transient-values.ts
const eventNameFromAttribute = (attributeName) => {
  if (!attributeName.startsWith("on")) return null;
  return attributeName.slice(2).toLowerCase();
};
const rerenderUseRefTransientValues = defineRule({
  recommendation:
    "Keep high-frequency transient values in refs or external stores and commit React state only when visible UI must update.",
  examples: [
    {
      before: `const [x, setX] = useState(0);
<div onMouseMove={(event) => setX(event.clientX)} />`,
      after: `const xRef = useRef(0);
<div onMouseMove={(event) => { xRef.current = event.clientX; }} />`,
    },
  ],
  create: (context) => ({
    JSXAttribute(node) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const eventName = eventNameFromAttribute(node.name.name);
      if (!eventName || !HIGH_FREQUENCY_DOM_EVENTS.has(eventName)) return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;
      const handler = node.value.expression;
      if (!handler) return;
      const setStateCall = handlerCallsSetState(handler);
      if (!setStateCall) return;
      context.report({
        node: setStateCall,
        message:
          "high-frequency event stores transient data in React state - keep it in a ref or external store and only commit state when UI actually needs to re-render",
      });
    },
  }),
});
//#endregion
//#region src/core/rules/lint/server/server-cache-lru.ts
const SERVER_FILE_PATTERN = /\/(?:app|server|api)\//;
const serverCacheLru = defineRule({
  recommendation:
    "Use a bounded LRU or TTL cache for cross-request server caching instead of an unbounded module-level Map or Set.",
  examples: [
    {
      before: `const cache = new Map();`,
      after: `const cache = new LRUCache({ max: 500, ttl: 60_000 });`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    const isServerContext = SERVER_FILE_PATTERN.test(filename);
    let hasServerDirective = false;
    return {
      Program(node) {
        hasServerDirective = hasUseServerDirective(node);
      },
      VariableDeclarator(node) {
        if (!isServerContext && !hasServerDirective) return;
        if (!isNodeOfType(node.parent?.parent, "Program")) return;
        if (!isNodeOfType(node.init, "NewExpression")) return;
        if (!isNodeOfType(node.init.callee, "Identifier")) return;
        if (!MUTABLE_CONTAINER_CONSTRUCTORS.has(node.init.callee.name)) return;
        const bindingName = isNodeOfType(node.id, "Identifier") ? node.id.name : "cache";
        if (!/cache|memo|store/i.test(bindingName)) return;
        context.report({
          node,
          message:
            "module-level server cache uses an unbounded mutable container - use an LRU/TTL cache so cross-request caching cannot grow without bounds",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-cache-react.ts
const expensiveServerCallPattern =
  /(?:fetch|query|findMany|findUnique|select|getUser|getSession|getCurrentUser)/;
const serverCacheReact = defineRule({
  recommendation:
    "Wrap shared server reads in React cache() so sibling Server Components dedupe the same request-scoped work.",
  examples: [
    {
      before: `export async function getUser(id) { return db.user.findUnique({ where: { id } }); }`,
      after: `export const getUser = cache(async (id) => db.user.findUnique({ where: { id } }));`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    return {
      FunctionDeclaration(node) {
        if (!APP_ROUTER_FILE_PATTERN.test(filename)) return;
        if (!node.async) return;
        if (!node.id?.name || /^generate(?:Metadata|StaticParams)$/.test(node.id.name)) return;
        const body = node.body;
        if (!body) return;
        for (const statement of body.body ?? []) {
          if (!isNodeOfType(statement, "VariableDeclaration")) continue;
          const init = statement.declarations?.[0]?.init;
          const callee = (isNodeOfType(init, "AwaitExpression") ? init.argument : init)?.callee;
          const calleeName = isNodeOfType(callee, "Identifier")
            ? callee.name
            : isNodeOfType(callee, "MemberExpression") &&
                isNodeOfType(callee.property, "Identifier")
              ? callee.property.name
              : null;
          if (!calleeName || !expensiveServerCallPattern.test(calleeName)) continue;
          context.report({
            node: statement,
            message:
              "server helper performs request-scoped async work without React.cache() - wrap shared reads in cache() so sibling Server Components dedupe the same request",
          });
          return;
        }
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-parallel-fetching.ts
const containsUppercaseJsxChild = (node) => {
  let foundChild = false;
  const visit = (child) => {
    if (foundChild) return;
    if (isNodeOfType(child, "JSXOpeningElement")) {
      const name = child.name;
      if (isNodeOfType(name, "JSXIdentifier") && /^[A-Z]/.test(name.name)) foundChild = true;
    }
    for (const key of Object.keys(child)) {
      if (key === "parent") continue;
      const value = child[key];
      if (Array.isArray(value)) {
        for (const item of value) if (item?.type) visit(item);
      } else if (value?.type) visit(value);
    }
  };
  visit(node);
  return foundChild;
};
const serverParallelFetching = defineRule({
  recommendation:
    "Push data fetching into child Server Components or start promises before awaiting so sibling work can stream in parallel.",
  examples: [
    {
      before: `const user = await getUser();
return <Profile><Posts /></Profile>;`,
      after: `return <><User /><Suspense><Posts /></Suspense></>;`,
    },
  ],
  create: (context) => {
    const filename = context.getFilename?.() ?? "";
    return {
      ReturnStatement(node) {
        if (!APP_ROUTER_FILE_PATTERN.test(filename)) return;
        if (!node.argument || !containsUppercaseJsxChild(node.argument)) return;
        let parent = node.parent;
        while (
          parent &&
          !isNodeOfType(parent, "FunctionDeclaration") &&
          !isNodeOfType(parent, "ArrowFunctionExpression")
        )
          parent = parent.parent;
        if (!parent?.body?.body) return;
        if (
          !parent.body.body.some(
            (statement) =>
              statement !== node &&
              isNodeOfType(statement, "VariableDeclaration") &&
              statement.declarations?.some((declarator) =>
                isNodeOfType(declarator.init, "AwaitExpression"),
              ),
          )
        )
          return;
        context.report({
          node,
          message:
            "Server Component awaits parent data before rendering child components - push data fetching into children or start promises before awaiting so sibling work can stream in parallel",
        });
      },
    };
  },
});
//#endregion
//#region src/core/rules/lint/server/server-parallel-nested-fetching.ts
const isPromiseAllMapAwait = (node) =>
  isNodeOfType(node, "AwaitExpression") &&
  isNodeOfType(node.argument, "CallExpression") &&
  isNodeOfType(node.argument.callee, "MemberExpression") &&
  isNodeOfType(node.argument.callee.object, "Identifier") &&
  node.argument.callee.object.name === "Promise" &&
  isNodeOfType(node.argument.callee.property, "Identifier") &&
  node.argument.callee.property.name === "all" &&
  isNodeOfType(node.argument.arguments?.[0], "CallExpression") &&
  isNodeOfType(node.argument.arguments[0].callee, "MemberExpression") &&
  isNodeOfType(node.argument.arguments[0].callee.property, "Identifier") &&
  node.argument.arguments[0].callee.property.name === "map";
const serverParallelNestedFetching = defineRule({
  recommendation:
    "Flatten nested Promise.all phases or start nested child promises inside the first map so each level does not wait for the previous one to finish.",
  examples: [
    {
      before: `const posts = await Promise.all(users.map(getPosts));
const comments = await Promise.all(posts.map(getComments));`,
      after: `const results = await Promise.all(users.map(async (user) => ({ posts: await getPosts(user) })));`,
    },
  ],
  create: (context) => ({
    BlockStatement(node) {
      const statements = node.body ?? [];
      for (let statementIndex = 0; statementIndex < statements.length - 1; statementIndex++) {
        const current = statements[statementIndex];
        const next = statements[statementIndex + 1];
        if (
          !isNodeOfType(current, "VariableDeclaration") ||
          !isNodeOfType(next, "VariableDeclaration")
        )
          continue;
        const currentDeclarator = current.declarations?.[0];
        const nextDeclarator = next.declarations?.[0];
        if (!isPromiseAllMapAwait(currentDeclarator?.init)) continue;
        if (!isPromiseAllMapAwait(nextDeclarator?.init)) continue;
        context.report({
          node: next,
          message:
            "nested Promise.all(map()) runs in phases - flatten the dependency graph or start child promises inside the first map so nested fetches are not serialized by level",
        });
      }
    },
  }),
});
//#endregion
//#region src/core/rules/lint/server/server-serialization.ts
const isUppercaseJsxElement = (node) => {
  const name = node.name;
  return Boolean(isNodeOfType(name, "JSXIdentifier") && /^[A-Z]/.test(name.name));
};
//#endregion
//#region src/core/rules/lint/rules.ts
const reactDoctorOxlintRules = {
  "no-derived-state-effect": noDerivedStateEffect,
  "no-fetch-in-effect": noFetchInEffect,
  "no-mirror-prop-effect": noMirrorPropEffect,
  "no-aria-expanded-without-controls": noAriaExpandedWithoutControls,
  "no-aria-invalid-without-describedby": noAriaInvalidWithoutDescribedby,
  "no-mutable-in-deps": noMutableInDeps,
  "no-cascading-set-state": noCascadingSetState,
  "no-effect-chain": noEffectChain,
  "no-effect-event-handler": noEffectEventHandler,
  "no-effect-event-in-deps": noEffectEventInDeps,
  "no-event-trigger-state": noEventTriggerState,
  "no-prop-callback-in-effect": noPropCallbackInEffect,
  "no-derived-useState": noDerivedUseState,
  "no-direct-state-mutation": noDirectStateMutation,
  "no-set-state-in-render": noSetStateInRender,
  "no-settimeout-state-fix": noSettimeoutStateFix,
  "prefer-use-effect-event": preferUseEffectEvent,
  "prefer-useReducer": preferUseReducer,
  "prefer-use-sync-external-store": preferUseSyncExternalStore,
  "rerender-lazy-state-init": rerenderLazyStateInit,
  "rerender-functional-setstate": rerenderFunctionalSetstate,
  "rerender-dependencies": rerenderDependencies,
  "rerender-state-only-in-handlers": rerenderStateOnlyInHandlers,
  "rerender-defer-reads-hook": rerenderDeferReadsHook,
  "advanced-event-handler-refs": advancedEventHandlerRefs,
  "advanced-init-once": advancedInitOnce,
  "advanced-use-latest": advancedUseLatest,
  "async-api-routes": asyncApiRoutes,
  "async-cheap-condition-before-await": asyncCheapConditionBeforeAwait,
  "async-dependencies": asyncDependencies,
  "async-suspense-boundaries": asyncSuspenseBoundaries,
  "bundle-conditional": bundleConditional,
  "bundle-preload": bundlePreload,
  "client-event-listeners": clientEventListeners,
  "client-swr-dedup": clientSwrDedup,
  "swr-no-empty-key": swrNoEmptyKey,
  "swr-no-unstable-key": swrNoUnstableKey,
  "js-cache-function-results": jsCacheFunctionResults,
  "js-request-idle-callback": jsRequestIdleCallback,
  "rendering-activity": renderingActivity,
  "rendering-content-visibility": renderingContentVisibility,
  "rendering-hydration-suppress-warning": renderingHydrationSuppressWarning,
  "rendering-resource-hints": renderingResourceHints,
  "rerender-memo": rerenderMemo,
  "rerender-split-combined-hooks": rerenderSplitCombinedHooks,
  "rerender-use-deferred-value": rerenderUseDeferredValue,
  "rerender-use-ref-transient-values": rerenderUseRefTransientValues,
  "server-cache-lru": serverCacheLru,
  "server-cache-react": serverCacheReact,
  "server-parallel-fetching": serverParallelFetching,
  "server-parallel-nested-fetching": serverParallelNestedFetching,
  "server-serialization": defineRule({
    recommendation:
      "Pass only the client props that are needed and derive secondary collections on the client to reduce RSC serialization payload.",
    examples: [
      {
        before: `<Client {...user} />`,
        after: `<Client id={user.id} name={user.name} />`,
      },
    ],
    create: (context) => {
      const filename = context.getFilename?.() ?? "";
      const isAppRouterFile = APP_DIRECTORY_PATTERN.test(filename);
      let isClientComponent = false;
      return {
        Program(programNode) {
          isClientComponent = hasDirective(programNode, "use client");
        },
        JSXOpeningElement(node) {
          if (!isAppRouterFile) return;
          if (isClientComponent) return;
          if (!isUppercaseJsxElement(node)) return;
          for (const attribute of node.attributes ?? []) {
            if (isNodeOfType(attribute, "JSXSpreadAttribute")) {
              context.report({
                node: attribute,
                message:
                  "spreading server data into a client boundary can serialize unused fields - pass only the primitive props the client component needs",
              });
              continue;
            }
            if (!isNodeOfType(attribute, "JSXAttribute")) continue;
            if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) continue;
            const expression = attribute.value.expression;
            if (!isNodeOfType(expression, "CallExpression")) continue;
            if (!isNodeOfType(expression.callee, "MemberExpression")) continue;
            if (!isNodeOfType(expression.callee.property, "Identifier")) continue;
            if (!DERIVING_ARRAY_METHODS.has(expression.callee.property.name)) continue;
            context.report({
              node: attribute,
              message:
                "derived collection is serialized as a separate client prop - pass the source data once and derive on the client to reduce RSC payload size",
            });
          }
        },
      };
    },
  }),
  "effect-needs-cleanup": effectNeedsCleanup,
  "effect-no-derived-state": noDerivedStateEffect,
  "effect-no-chain-state-updates": noEffectChain,
  "effect-no-event-handler": noEffectEventHandler,
  "effect-no-adjust-state-on-prop-change": effectNoAdjustStateOnPropChange,
  "effect-no-reset-all-state-on-prop-change": effectNoResetAllStateOnPropChange,
  "effect-no-pass-live-state-to-parent": effectNoPassLiveStateToParent,
  "effect-no-pass-data-to-parent": effectNoPassDataToParent,
  "effect-no-initialize-state": effectNoInitializeState,
  "no-generic-handler-names": noGenericHandlerNames,
  "no-giant-component": noGiantComponent,
  "no-many-boolean-props": noManyBooleanProps,
  "no-react19-deprecated-apis": noReact19DeprecatedApis,
  "no-blocked-paste": noBlockedPaste,
  "no-button-navigation": noButtonNavigation,
  "no-icon-only-button-without-label": noIconOnlyButtonWithoutLabel,
  "no-random-key": noRandomKey,
  "no-render-prop-children": noRenderPropChildren,
  "no-render-in-render": noRenderInRender,
  "no-nested-component-definition": noNestedComponentDefinition,
  "react-compiler-destructure-method": reactCompilerDestructureMethod,
  "no-legacy-class-lifecycles": noLegacyClassLifecycles,
  "no-legacy-context-api": noLegacyContextApi,
  "no-default-props": noDefaultProps,
  "no-react-dom-deprecated-apis": noReactDomDeprecatedApis,
  "no-usememo-simple-expression": noUsememoSimpleExpression,
  "no-layout-property-animation": noLayoutPropertyAnimation,
  "motion-no-hover-transform-on-target": motionNoHoverTransformOnTarget,
  "motion-no-motion-in-lazymotion-strict": motionNoMotionInLazyMotionStrict,
  "rerender-memo-with-default-value": rerenderMemoWithDefaultValue,
  "rerender-memo-before-early-return": rerenderMemoBeforeEarlyReturn,
  "rerender-transitions-scroll": rerenderTransitionsScroll,
  "rerender-derived-state-from-hook": rerenderDerivedStateFromHook,
  "async-defer-await": asyncDeferAwait,
  "async-await-in-loop": asyncAwaitInLoop,
  "rendering-animate-svg-wrapper": renderingAnimateSvgWrapper,
  "rendering-hoist-jsx": renderingHoistJsx,
  "rendering-hydration-mismatch-time": renderingHydrationMismatchTime,
  "no-inline-prop-on-memo-component": noInlinePropOnMemoComponent,
  "rendering-hydration-no-flicker": renderingHydrationNoFlicker,
  "rendering-script-defer-async": renderingScriptDeferAsync,
  "rendering-usetransition-loading": renderingUsetransitionLoading,
  "no-transition-all": noTransitionAll,
  "no-global-css-variable-animation": noGlobalCssVariableAnimation,
  "no-large-animated-blur": noLargeAnimatedBlur,
  "no-scale-from-zero": noScaleFromZero,
  "no-permanent-will-change": noPermanentWillChange,
  "no-eval": noEval,
  "no-secrets-in-client-code": noSecretsInClientCode,
  "no-swallowed-error": noSwallowedError,
  "no-barrel-import": noBarrelImport,
  "no-dynamic-import-path": noDynamicImportPath,
  "no-full-lodash-import": noFullLodashImport,
  "no-moment": noMoment,
  "prefer-dynamic-import": preferDynamicImport,
  "use-lazy-motion": useLazyMotion,
  "no-undeferred-third-party": noUndeferredThirdParty,
  "no-array-index-as-key": noArrayIndexAsKey,
  "no-polymorphic-children": noPolymorphicChildren,
  "rendering-conditional-render": renderingConditionalRender,
  "rendering-svg-precision": renderingSvgPrecision,
  "no-prevent-default": noPreventDefault,
  "no-uncontrolled-input": noUncontrolledInput,
  "no-document-start-view-transition": noDocumentStartViewTransition,
  "no-flush-sync": noFlushSync,
  "nextjs-no-img-element": nextjsNoImgElement,
  "nextjs-async-client-component": nextjsAsyncClientComponent,
  "nextjs-no-a-element": nextjsNoAElement,
  "nextjs-no-use-search-params-without-suspense": nextjsNoUseSearchParamsWithoutSuspense,
  "nextjs-no-client-fetch-for-server-data": nextjsNoClientFetchForServerData,
  "nextjs-missing-metadata": nextjsMissingMetadata,
  "nextjs-no-client-side-redirect": nextjsNoClientSideRedirect,
  "nextjs-no-redirect-in-try-catch": nextjsNoRedirectInTryCatch,
  "nextjs-image-missing-sizes": nextjsImageMissingSizes,
  "nextjs-no-native-script": nextjsNoNativeScript,
  "nextjs-inline-script-missing-id": nextjsInlineScriptMissingId,
  "nextjs-no-font-link": nextjsNoFontLink,
  "nextjs-no-css-link": nextjsNoCssLink,
  "nextjs-no-polyfill-script": nextjsNoPolyfillScript,
  "nextjs-no-head-import": nextjsNoHeadImport,
  "nextjs-no-side-effect-in-get-handler": nextjsNoSideEffectInGetHandler,
  "server-auth-actions": serverAuthActions,
  "server-after-nonblocking": serverAfterNonblocking,
  "server-no-mutable-module-state": serverNoMutableModuleState,
  "server-cache-with-object-literal": serverCacheWithObjectLiteral,
  "server-hoist-static-io": serverHoistStaticIo,
  "server-dedup-props": serverDedupProps,
  "server-sequential-independent-await": serverSequentialIndependentAwait,
  "server-fetch-without-revalidate": serverFetchWithoutRevalidate,
  "client-passive-event-listeners": clientPassiveEventListeners,
  "client-localstorage-no-version": clientLocalstorageNoVersion,
  "js-combine-iterations": jsCombineIterations,
  "js-tosorted-immutable": jsTosortedImmutable,
  "js-hoist-regexp": jsHoistRegexp,
  "js-hoist-intl": jsHoistIntl,
  "js-cache-property-access": jsCachePropertyAccess,
  "js-length-check-first": jsLengthCheckFirst,
  "js-min-max-loop": jsMinMaxLoop,
  "js-set-map-lookups": jsSetMapLookups,
  "js-batch-dom-css": jsBatchDomCss,
  "js-index-maps": jsIndexMaps,
  "js-cache-storage": jsCacheStorage,
  "js-early-exit": jsEarlyExit,
  "js-flatmap-filter": jsFlatmapFilter,
  "async-parallel": asyncParallel,
  "rn-no-raw-text": rnNoRawText,
  "expo-no-axios": expoNoAxios,
  "rn-no-deprecated-modules": rnNoDeprecatedModules,
  "rn-no-legacy-expo-packages": rnNoLegacyExpoPackages,
  "rn-no-dimensions-get": rnNoDimensionsGet,
  "rn-no-inline-flatlist-renderitem": rnNoInlineFlatlistRenderitem,
  "rn-no-legacy-shadow-styles": rnNoLegacyShadowStyles,
  "rn-prefer-reanimated": rnPreferReanimated,
  "rn-no-single-element-style-array": rnNoSingleElementStyleArray,
  "rn-prefer-pressable": rnPreferPressable,
  "rn-prefer-expo-image": rnPreferExpoImage,
  "rn-no-non-native-navigator": rnNoNonNativeNavigator,
  "rn-no-scroll-state": rnNoScrollState,
  "rn-no-scrollview-mapped-list": rnNoScrollviewMappedList,
  "rn-no-web-dom-elements": rnNoWebDomElements,
  "rn-no-inline-object-in-list-item": rnNoInlineObjectInListItem,
  "rn-animate-layout-property": rnAnimateLayoutProperty,
  "rn-prefer-content-inset-adjustment": rnPreferContentInsetAdjustment,
  "rn-pressable-shared-value-mutation": rnPressableSharedValueMutation,
  "rn-list-data-mapped": rnListDataMapped,
  "rn-list-callback-per-row": rnListCallbackPerRow,
  "rn-list-recyclable-without-types": rnListRecyclableWithoutTypes,
  "rn-animation-reaction-as-derived": rnAnimationReactionAsDerived,
  "rn-bottom-sheet-prefer-native": rnBottomSheetPreferNative,
  "rn-scrollview-content-container-padding": rnScrollviewContentContainerPadding,
  "rn-scrollview-dynamic-padding": rnScrollviewDynamicPadding,
  "rn-style-prefer-boxshadow": rnStylePreferBoxShadow,
  "tanstack-ai-chat-lifecycle-middleware": tanstackAiChatLifecycleMiddleware,
  "tanstack-ai-no-direct-client-import": tanstackAiNoDirectClientImport,
  "tanstack-ai-no-manual-sse-response": tanstackAiNoManualSseResponse,
  "tanstack-ai-no-vercel-sdk-patterns": tanstackAiNoVercelSdkPatterns,
  "tanstack-ai-output-schema": tanstackAiOutputSchema,
  "tanstack-start-route-property-order": tanstackStartRoutePropertyOrder,
  "tanstack-start-no-direct-fetch-in-loader": tanstackStartNoDirectFetchInLoader,
  "tanstack-start-server-fn-validate-input": tanstackStartServerFnValidateInput,
  "tanstack-start-no-useeffect-fetch": tanstackStartNoUseEffectFetch,
  "tanstack-start-missing-head-content": tanstackStartMissingHeadContent,
  "tanstack-start-no-anchor-element": tanstackStartNoAnchorElement,
  "tanstack-start-server-fn-method-order": tanstackStartServerFnMethodOrder,
  "tanstack-start-no-navigate-in-render": tanstackStartNoNavigateInRender,
  "tanstack-start-no-dynamic-server-fn-import": tanstackStartNoDynamicServerFnImport,
  "tanstack-start-no-use-server-in-handler": tanstackStartNoUseServerInHandler,
  "tanstack-start-no-secrets-in-loader": tanstackStartNoSecretsInLoader,
  "tanstack-start-get-mutation": tanstackStartGetMutation,
  "tanstack-start-redirect-in-try-catch": tanstackStartRedirectInTryCatch,
  "tanstack-start-loader-parallel-fetch": tanstackStartLoaderParallelFetch,
  "query-stable-query-client": queryStableQueryClient,
  "query-no-rest-destructuring": queryNoRestDestructuring,
  "query-no-void-query-fn": queryNoVoidQueryFn,
  "query-no-query-in-effect": queryNoQueryInEffect,
  "query-mutation-missing-invalidation": queryMutationMissingInvalidation,
  "query-no-usequery-for-mutation": queryNoUseQueryForMutation,
  "query-no-unstable-deps": queryNoUnstableDeps,
  "query-no-unstable-query-key": queryNoUnstableQueryKey,
  "tailwind-no-conflicting-classes": tailwindNoConflictingClasses,
  "tailwind-oklch-alpha-syntax": tailwindOklchAlphaSyntax,
  "mobx-observer-named-component": mobxObserverNamedComponent,
  "i18n-no-literal-jsx-text": i18nNoLiteralJsxText,
  "i18n-no-dynamic-translation-key": i18nNoDynamicTranslationKey,
  "shadcn-no-direct-radix-import": shadcnNoDirectRadixImport,
  "radix-aschild-single-child": radixAschildSingleChild,
  "rhf-no-watch-render": rhfNoWatchRender,
  "rhf-no-nested-object-setvalue": rhfNoNestedObjectSetvalue,
  "testing-await-user-event": testingAwaitUserEvent,
  "testing-no-container-query": testingNoContainerQuery,
  "storybook-await-play-interactions": storybookAwaitPlayInteractions,
  "r3f-no-new-in-frame": r3fNoNewInFrame,
  "r3f-no-clone-in-frame": r3fNoCloneInFrame,
  "r3f-no-set-state-in-frame": r3fNoSetStateInFrame,
  "no-inline-bounce-easing": noInlineBounceEasing,
  "no-z-index-9999": noZIndex9999,
  "no-inline-exhaustive-style": noInlineExhaustiveStyle,
  "no-side-tab-border": noSideTabBorder,
  "no-pure-black-background": noPureBlackBackground,
  "no-gradient-text": noGradientText,
  "no-dark-mode-glow": noDarkModeGlow,
  "no-justified-text": noJustifiedText,
  "no-tiny-text": noTinyText,
  "no-wide-letter-spacing": noWideLetterSpacing,
  "no-gray-on-colored-background": noGrayOnColoredBackground,
  "no-layout-transition-inline": noLayoutTransitionInline,
  "no-disabled-zoom": noDisabledZoom,
  "no-outline-none": noOutlineNone,
  "no-long-transition-duration": noLongTransitionDuration,
  "design-no-bold-heading": noBoldHeading,
  "tailwind-no-redundant-padding-axes": noRedundantPaddingAxes,
  "tailwind-no-redundant-size-axes": noRedundantSizeAxes,
  "tailwind-no-space-on-flex-children": noSpaceOnFlexChildren,
  "design-no-three-period-ellipsis": noThreePeriodEllipsis,
  "tailwind-no-default-palette": noDefaultTailwindPalette,
  "design-no-vague-button-label": noVagueButtonLabel,
};
//#endregion
//#region src/core/rules/lint/config.ts
const esmRequire$1 = createRequire(import.meta.url);
const REACT_DOCTOR_OXLINT_RULE_KEY_PREFIX = "react-doctor/";
const REACT_HOOKS_JS_NAMESPACE = "react-hooks-js";
const REACT_HOOKS_PLUGIN_SPECIFIER = "eslint-plugin-react-hooks";
const YOU_MIGHT_NOT_NEED_EFFECT_NAMESPACE = "effect";
const YOU_MIGHT_NOT_NEED_EFFECT_PLUGIN_SPECIFIER =
  "eslint-plugin-react-you-might-not-need-an-effect";
const DEFAULT_OXLINT_RULE_SEVERITY = "warn";
const NEXTJS_RULE_NAME_PREFIX = "nextjs-";
const TANSTACK_AI_RULE_NAME_PREFIX = "tanstack-ai-";
const TANSTACK_START_RULE_NAME_PREFIX = "tanstack-start-";
const TANSTACK_QUERY_RULE_NAME_PREFIX = "query-";
const REACT_NATIVE_RULE_NAME_PREFIXES = ["expo-", "rn-"];
const ECOSYSTEM_RULE_NAME_PREFIXES = [
  "tailwind-",
  "motion-",
  "swr-",
  "mobx-",
  "i18n-",
  "shadcn-",
  "radix-",
  "rhf-",
  "testing-",
  "storybook-",
  "r3f-",
];
const REACT_DOCTOR_ERROR_RULE_NAMES = new Set([
  "nextjs-async-client-component",
  "nextjs-no-head-import",
  "nextjs-no-side-effect-in-get-handler",
  "rn-no-raw-text",
  "rn-no-deprecated-modules",
  "rn-no-scroll-state",
  "rn-animate-layout-property",
  "tanstack-start-route-property-order",
  "tanstack-start-server-fn-method-order",
  "tanstack-start-no-dynamic-server-fn-import",
  "tanstack-start-no-use-server-in-handler",
  "tanstack-start-no-secrets-in-loader",
  "query-no-unstable-query-key",
  "tailwind-oklch-alpha-syntax",
  "swr-no-unstable-key",
  "radix-aschild-single-child",
  "testing-await-user-event",
  "storybook-await-play-interactions",
  "r3f-no-new-in-frame",
  "r3f-no-clone-in-frame",
  "no-mutable-in-deps",
  "no-effect-event-in-deps",
  "rerender-dependencies",
  "effect-needs-cleanup",
  "no-random-key",
  "no-nested-component-definition",
  "no-legacy-class-lifecycles",
  "no-legacy-context-api",
  "no-layout-property-animation",
  "no-global-css-variable-animation",
  "no-eval",
  "server-auth-actions",
  "server-no-mutable-module-state",
  "no-disabled-zoom",
]);
const YOU_MIGHT_NOT_NEED_EFFECT_OXLINT_RULES = {
  "effect/no-derived-state": "warn",
  "effect/no-chain-state-updates": "warn",
  "effect/no-event-handler": "warn",
  "effect/no-adjust-state-on-prop-change": "warn",
  "effect/no-reset-all-state-on-prop-change": "warn",
  "effect/no-pass-live-state-to-parent": "warn",
  "effect/no-pass-data-to-parent": "warn",
  "effect/no-initialize-state": "warn",
};
const REACT_COMPILER_OXLINT_RULES = {
  "react-hooks-js/set-state-in-render": "error",
  "react-hooks-js/immutability": "error",
  "react-hooks-js/refs": "error",
  "react-hooks-js/purity": "error",
  "react-hooks-js/hooks": "error",
  "react-hooks-js/set-state-in-effect": "error",
  "react-hooks-js/globals": "error",
  "react-hooks-js/error-boundaries": "error",
  "react-hooks-js/preserve-manual-memoization": "error",
  "react-hooks-js/unsupported-syntax": "error",
  "react-hooks-js/component-hook-factories": "error",
  "react-hooks-js/static-components": "error",
  "react-hooks-js/use-memo": "error",
  "react-hooks-js/void-use-memo": "error",
  "react-hooks-js/incompatible-library": "error",
  "react-hooks-js/todo": "error",
};
const BUILTIN_REACT_OXLINT_RULES = {
  "react/rules-of-hooks": "error",
  "react/exhaustive-deps": "warn",
  "react/no-direct-mutation-state": "error",
  "react/jsx-no-duplicate-props": "error",
  "react/jsx-key": "error",
  "react/no-children-prop": "warn",
  "react/no-danger": "warn",
  "react/jsx-no-script-url": "error",
  "react/no-render-return-value": "warn",
  "react/no-string-refs": "warn",
  "react/no-is-mounted": "warn",
  "react/require-render-return": "error",
  "react/no-unknown-property": "warn",
};
const BUILTIN_A11Y_OXLINT_RULES = {
  "jsx-a11y/alt-text": "error",
  "jsx-a11y/anchor-is-valid": "warn",
  "jsx-a11y/click-events-have-key-events": "warn",
  "jsx-a11y/no-static-element-interactions": "warn",
  "jsx-a11y/role-has-required-aria-props": "error",
  "jsx-a11y/no-autofocus": "warn",
  "jsx-a11y/heading-has-content": "warn",
  "jsx-a11y/html-has-lang": "warn",
  "jsx-a11y/no-redundant-roles": "warn",
  "jsx-a11y/scope": "warn",
  "jsx-a11y/tabindex-no-positive": "warn",
  "jsx-a11y/label-has-associated-control": "warn",
  "jsx-a11y/no-distracting-elements": "error",
  "jsx-a11y/iframe-has-title": "warn",
};
const BUILTIN_OXLINT_RULES = {
  ...BUILTIN_REACT_OXLINT_RULES,
  ...BUILTIN_A11Y_OXLINT_RULES,
};
const startsWithAny = (value, prefixes) => prefixes.some((prefix) => value.startsWith(prefix));
const toReactDoctorOxlintRuleKey = (ruleName) =>
  `${REACT_DOCTOR_OXLINT_RULE_KEY_PREFIX}${ruleName}`;
const getReactDoctorRuleSeverity = (ruleName) =>
  REACT_DOCTOR_ERROR_RULE_NAMES.has(ruleName) ? "error" : DEFAULT_OXLINT_RULE_SEVERITY;
const createReactDoctorRuleMap = (shouldIncludeRule) => {
  const rules = {};
  for (const ruleName of Object.keys(reactDoctorOxlintRules))
    if (shouldIncludeRule(ruleName))
      rules[toReactDoctorOxlintRuleKey(ruleName)] = getReactDoctorRuleSeverity(ruleName);
  return rules;
};
const isNextJsRuleName = (ruleName) => ruleName.startsWith(NEXTJS_RULE_NAME_PREFIX);
const isReactNativeRuleName = (ruleName) =>
  startsWithAny(ruleName, REACT_NATIVE_RULE_NAME_PREFIXES);
const isTanStackAiRuleName = (ruleName) => ruleName.startsWith(TANSTACK_AI_RULE_NAME_PREFIX);
const isTanStackStartRuleName = (ruleName) => ruleName.startsWith(TANSTACK_START_RULE_NAME_PREFIX);
const isTanStackQueryRuleName = (ruleName) => ruleName.startsWith(TANSTACK_QUERY_RULE_NAME_PREFIX);
const isEcosystemRuleName = (ruleName) => startsWithAny(ruleName, ECOSYSTEM_RULE_NAME_PREFIXES);
const isFrameworkRuleName = (ruleName) =>
  isNextJsRuleName(ruleName) ||
  isReactNativeRuleName(ruleName) ||
  isTanStackAiRuleName(ruleName) ||
  isTanStackStartRuleName(ruleName) ||
  isTanStackQueryRuleName(ruleName);
const NEXTJS_OXLINT_RULES = createReactDoctorRuleMap(isNextJsRuleName);
const REACT_NATIVE_OXLINT_RULES = createReactDoctorRuleMap(isReactNativeRuleName);
const TANSTACK_START_OXLINT_RULES = createReactDoctorRuleMap(isTanStackStartRuleName);
const TANSTACK_AI_OXLINT_RULES = createReactDoctorRuleMap(isTanStackAiRuleName);
const TANSTACK_QUERY_OXLINT_RULES = createReactDoctorRuleMap(isTanStackQueryRuleName);
const ECOSYSTEM_OXLINT_RULES = createReactDoctorRuleMap(isEcosystemRuleName);
const GLOBAL_REACT_DOCTOR_OXLINT_RULES = createReactDoctorRuleMap(
  (ruleName) => !isFrameworkRuleName(ruleName) && !isEcosystemRuleName(ruleName),
);
const REACT_DOCTOR_CUSTOM_OXLINT_RULES = {
  ...GLOBAL_REACT_DOCTOR_OXLINT_RULES,
  ...NEXTJS_OXLINT_RULES,
  ...REACT_NATIVE_OXLINT_RULES,
  ...TANSTACK_AI_OXLINT_RULES,
  ...TANSTACK_START_OXLINT_RULES,
  ...TANSTACK_QUERY_OXLINT_RULES,
  ...ECOSYSTEM_OXLINT_RULES,
};
({
  ...BUILTIN_REACT_OXLINT_RULES,
  ...BUILTIN_A11Y_OXLINT_RULES,
  ...REACT_COMPILER_OXLINT_RULES,
  ...REACT_DOCTOR_CUSTOM_OXLINT_RULES,
});
new Set(Object.keys(REACT_DOCTOR_CUSTOM_OXLINT_RULES));
const DISABLED_OXLINT_CATEGORIES = {
  correctness: "off",
  nursery: "off",
  pedantic: "off",
  perf: "off",
  restriction: "off",
  style: "off",
  suspicious: "off",
};
const EMPTY_TAGS = /* @__PURE__ */ new Set();
const DEFAULT_IGNORED_TAGS = new Set(["pedantic"]);
const TEST_NOISE_TAGS = new Set(["test-noise"]);
const PEDANTIC_TAGS = new Set(["pedantic"]);
const DESIGN_AND_TEST_NOISE_TAGS = new Set(["design", "test-noise"]);
const TAILWIND_VERSION_PATTERN = /(?:^|[^\d])(\d+)(?:\.(\d+))?/;
const PEER_COMPARATOR_SEPARATOR = /[\s,|]+/;
const PEER_WILDCARD_COMPARATOR = /^[*xX](?:\.[*xX])*$/;
const withReactDoctorRuleKey = (ruleName, metadata) => [
  toReactDoctorOxlintRuleKey(ruleName),
  metadata,
];
const RULE_METADATA = new Map([
  withReactDoctorRuleKey("no-react19-deprecated-apis", {
    requires: ["react:19"],
    tags: TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("no-default-props", {
    requires: ["react:19"],
    tags: TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("no-react-dom-deprecated-apis", {
    requires: ["react:18"],
    tags: TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("prefer-use-effect-event", {
    requires: ["react:19"],
    tags: TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("no-nested-component-definition", { tags: TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-eval", { tags: TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("design-no-bold-heading", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("tailwind-no-redundant-padding-axes", {
    tags: DESIGN_AND_TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("tailwind-no-redundant-size-axes", {
    requires: ["tailwind:3.4"],
    tags: DESIGN_AND_TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("tailwind-no-space-on-flex-children", {
    tags: DESIGN_AND_TEST_NOISE_TAGS,
  }),
  withReactDoctorRuleKey("design-no-three-period-ellipsis", { tags: PEDANTIC_TAGS }),
  withReactDoctorRuleKey("i18n-no-literal-jsx-text", { tags: PEDANTIC_TAGS }),
  withReactDoctorRuleKey("rendering-content-visibility", { tags: PEDANTIC_TAGS }),
  withReactDoctorRuleKey("tailwind-no-default-palette", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("design-no-vague-button-label", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-side-tab-border", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-pure-black-background", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-gradient-text", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-dark-mode-glow", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-justified-text", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-tiny-text", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-wide-letter-spacing", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-gray-on-colored-background", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-layout-transition-inline", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-outline-none", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-long-transition-duration", { tags: DESIGN_AND_TEST_NOISE_TAGS }),
  withReactDoctorRuleKey("no-render-in-render", { tags: TEST_NOISE_TAGS }),
]);
const EMPTY_TAG_SET = /* @__PURE__ */ new Set();
const getReactDoctorRuleTags = (ruleKey) => RULE_METADATA.get(ruleKey)?.tags ?? EMPTY_TAG_SET;
const REACT_DOCTOR_FRAMEWORK_RULE_GROUPS = [
  {
    rules: NEXTJS_OXLINT_RULES,
    requires: ["nextjs"],
  },
  {
    rules: REACT_NATIVE_OXLINT_RULES,
    requires: ["react-native"],
  },
  {
    rules: TANSTACK_START_OXLINT_RULES,
    requires: ["tanstack-start"],
  },
  {
    rules: TANSTACK_AI_OXLINT_RULES,
    requires: ["tanstack-ai"],
  },
  {
    rules: TANSTACK_QUERY_OXLINT_RULES,
    requires: ["tanstack-query"],
  },
];
const readPluginRuleNames = (pluginSpecifier) => {
  try {
    const pluginModule = esmRequire$1(pluginSpecifier);
    const rules = pluginModule.rules ?? pluginModule.default?.rules;
    return rules ? new Set(Object.keys(rules)) : /* @__PURE__ */ new Set();
  } catch {
    return /* @__PURE__ */ new Set();
  }
};
const resolveOptionalJsPlugin = (namespace, pluginSpecifier) => {
  try {
    const resolvedSpecifier = esmRequire$1.resolve(pluginSpecifier);
    return {
      entry: {
        name: namespace,
        specifier: resolvedSpecifier,
      },
      availableRuleNames: readPluginRuleNames(resolvedSpecifier),
    };
  } catch {
    return null;
  }
};
const filterRulesToAvailable = (rules, pluginNamespace, availableRuleNames) => {
  if (availableRuleNames.size === 0) return rules;
  const ruleKeyPrefix = `${pluginNamespace}/`;
  const filteredRules = {};
  for (const [ruleKey, severity] of Object.entries(rules)) {
    if (!ruleKey.startsWith(ruleKeyPrefix)) {
      filteredRules[ruleKey] = severity;
      continue;
    }
    const ruleName = ruleKey.slice(ruleKeyPrefix.length);
    if (availableRuleNames.has(ruleName)) filteredRules[ruleKey] = severity;
  }
  return filteredRules;
};
const buildOptionalReactCompilerConfig = (customRulesOnly, hasReactCompiler) => {
  if (customRulesOnly || !hasReactCompiler)
    return {
      jsPlugin: null,
      rules: {},
    };
  const plugin = resolveOptionalJsPlugin(REACT_HOOKS_JS_NAMESPACE, REACT_HOOKS_PLUGIN_SPECIFIER);
  if (!plugin)
    return {
      jsPlugin: null,
      rules: {},
    };
  return {
    jsPlugin: plugin.entry,
    rules: filterRulesToAvailable(
      REACT_COMPILER_OXLINT_RULES,
      REACT_HOOKS_JS_NAMESPACE,
      plugin.availableRuleNames,
    ),
  };
};
const buildOptionalYouMightNotNeedEffectConfig = (customRulesOnly) => {
  if (customRulesOnly)
    return {
      jsPlugin: null,
      rules: {},
    };
  const plugin = resolveOptionalJsPlugin(
    YOU_MIGHT_NOT_NEED_EFFECT_NAMESPACE,
    YOU_MIGHT_NOT_NEED_EFFECT_PLUGIN_SPECIFIER,
  );
  if (!plugin)
    return {
      jsPlugin: null,
      rules: {},
    };
  return {
    jsPlugin: plugin.entry,
    rules: filterRulesToAvailable(
      YOU_MIGHT_NOT_NEED_EFFECT_OXLINT_RULES,
      YOU_MIGHT_NOT_NEED_EFFECT_NAMESPACE,
      plugin.availableRuleNames,
    ),
  };
};
const parseMajorMinor = (version) => {
  if (!version) return null;
  const match = version.match(TAILWIND_VERSION_PATTERN);
  if (!match) return null;
  return {
    major: Number.parseInt(match[1], 10),
    minor: match[2] ? Number.parseInt(match[2], 10) : 0,
  };
};
const isTailwindAtLeast = (version, minimum) => {
  if (!version) return true;
  if (version.major > minimum.major) return true;
  if (version.major < minimum.major) return false;
  return version.minor >= minimum.minor;
};
const comparatorMajor = (comparator) => {
  if (PEER_WILDCARD_COMPARATOR.test(comparator)) return null;
  const firstIntegerMatch = comparator.match(/\d+/);
  if (!firstIntegerMatch) return null;
  const major = Number.parseInt(firstIntegerMatch[0], 10);
  return major >= 1 ? major : null;
};
const reactPeerRangeMinMajor = (range) => {
  if (typeof range !== "string") return null;
  let lowestMajor = null;
  for (const comparator of range.trim().split(PEER_COMPARATOR_SEPARATOR).filter(Boolean)) {
    const major = comparatorMajor(comparator);
    if (major !== null && (lowestMajor === null || major < lowestMajor)) lowestMajor = major;
  }
  return lowestMajor;
};
const effectiveReactMajor = (project) => {
  const installedMajor = project.reactMajorVersion ?? null;
  const peerMajor = reactPeerRangeMinMajor(project.reactPeerDependencyRange);
  if (installedMajor !== null && peerMajor !== null) return Math.min(installedMajor, peerMajor);
  return installedMajor ?? peerMajor ?? 99;
};
const buildReactDoctorOxlintCapabilities = (project) => {
  const capabilities = /* @__PURE__ */ new Set();
  const framework = project.framework ?? "unknown";
  capabilities.add(framework);
  if (framework === "expo" || framework === "react-native") capabilities.add("react-native");
  const reactMajor = effectiveReactMajor(project);
  for (let major = 17; major <= reactMajor; major++) capabilities.add(`react:${major}`);
  if (project.tailwindVersion !== null) {
    capabilities.add("tailwind");
    if (
      isTailwindAtLeast(parseMajorMinor(project.tailwindVersion), {
        major: 3,
        minor: 4,
      })
    )
      capabilities.add("tailwind:3.4");
  }
  if (project.hasReactCompiler) capabilities.add("react-compiler");
  if (project.hasTanStackAI) capabilities.add("tanstack-ai");
  if (project.hasTanStackQuery) capabilities.add("tanstack-query");
  if (project.hasTypeScript) capabilities.add("typescript");
  return capabilities;
};
const shouldEnableReactDoctorOxlintRule = (requires, tags, capabilities, ignoredTags) => {
  if (requires) {
    for (const capability of requires) if (!capabilities.has(capability)) return false;
  }
  for (const tag of tags) if (ignoredTags.has(tag)) return false;
  return true;
};
const addEnabledRules = (target, rules, capabilities, ignoredTags, defaultRequires) => {
  for (const [ruleKey, severity] of Object.entries(rules)) {
    const metadata = RULE_METADATA.get(ruleKey);
    if (
      shouldEnableReactDoctorOxlintRule(
        metadata?.requires ?? defaultRequires,
        metadata?.tags ?? EMPTY_TAGS,
        capabilities,
        ignoredTags,
      )
    )
      target[ruleKey] = severity;
  }
};
const createReactDoctorOxlintConfig = ({
  pluginPath,
  project,
  framework = "unknown",
  customRulesOnly = false,
  hasReactCompiler = false,
  hasTanStackAI = false,
  hasTanStackQuery = false,
  includeEcosystemRules = true,
  extendsPaths = [],
  ignoredTags = DEFAULT_IGNORED_TAGS,
}) => {
  const projectInfo = project ?? {
    framework,
    hasReactCompiler,
    hasTanStackAI,
    hasTanStackQuery,
  };
  const capabilities = buildReactDoctorOxlintCapabilities(projectInfo);
  const reactCompilerConfig = buildOptionalReactCompilerConfig(
    customRulesOnly,
    Boolean(projectInfo.hasReactCompiler),
  );
  const youMightNotNeedEffectConfig = buildOptionalYouMightNotNeedEffectConfig(customRulesOnly);
  const jsPlugins = [];
  if (reactCompilerConfig.jsPlugin) jsPlugins.push(reactCompilerConfig.jsPlugin);
  if (youMightNotNeedEffectConfig.jsPlugin) jsPlugins.push(youMightNotNeedEffectConfig.jsPlugin);
  jsPlugins.push(pluginPath);
  const enabledReactDoctorRules = {};
  addEnabledRules(
    enabledReactDoctorRules,
    GLOBAL_REACT_DOCTOR_OXLINT_RULES,
    capabilities,
    ignoredTags,
  );
  for (const ruleGroup of REACT_DOCTOR_FRAMEWORK_RULE_GROUPS)
    addEnabledRules(
      enabledReactDoctorRules,
      ruleGroup.rules,
      capabilities,
      ignoredTags,
      ruleGroup.requires,
    );
  if (includeEcosystemRules)
    addEnabledRules(enabledReactDoctorRules, ECOSYSTEM_OXLINT_RULES, capabilities, ignoredTags);
  return {
    ...(extendsPaths.length > 0 ? { extends: extendsPaths } : {}),
    categories: { ...DISABLED_OXLINT_CATEGORIES },
    plugins: customRulesOnly ? [] : ["react", "jsx-a11y"],
    jsPlugins,
    rules: {
      ...(customRulesOnly ? {} : BUILTIN_OXLINT_RULES),
      ...reactCompilerConfig.rules,
      ...youMightNotNeedEffectConfig.rules,
      ...enabledReactDoctorRules,
    },
  };
};
//#endregion
//#region src/core/diagnostics.ts
const TEST_NOISE_TAG = "test-noise";
const WRAPPED_RULE_ID_PATTERN = /^([a-zA-Z][\w-]*)\(([^)]+)\)$/;
const REACT_BUILTIN_RULE_PREFIX = /^(?:react|jsx-a11y)\//;
const JSX_A11Y_RULE_PREFIX = "jsx-a11y/";
const OG_IMAGE_FILE_PATTERN = /\/(?:opengraph-image|twitter-image|icon|apple-icon)\.[jt]sx?$/;
const NON_REACT_JSX_IMPORT_PATTERN = /(?:^|\n)\s*import\s.*from\s+['"](?:solid-js|preact)/;
const NON_REACT_JSX_SOURCES = new Set(["preact", "solid-js", "vue", "svelte"]);
const toMetadataRuleKey = (issue) => {
  const ruleId = issue.source?.ruleId;
  if (!ruleId) return null;
  const wrapped = WRAPPED_RULE_ID_PATTERN.exec(ruleId);
  if (wrapped) return `${wrapped[1]}/${wrapped[2]}`;
  if (issue.source?.pluginName && !ruleId.includes("/"))
    return `${issue.source.pluginName}/${ruleId}`;
  return ruleId;
};
const isAutoSuppressedTestNoise = (issue, relativeFilePath) => {
  if (!relativeFilePath) return false;
  const ruleKey = toMetadataRuleKey(issue);
  if (!ruleKey) return false;
  if (!getReactDoctorRuleTags(ruleKey).has(TEST_NOISE_TAG)) return false;
  return isTestFilePath(relativeFilePath);
};
const RN_NO_RAW_TEXT_RULE_ID = "rn-no-raw-text";
const normalizePath = (filePath) => filePath.replace(/\\/g, "/");
const normalizeRuleId = (issue) => {
  if (issue.source?.pluginName && issue.source.ruleId)
    return `${issue.source.pluginName}/${issue.source.ruleId}`;
  return issue.source?.ruleId ?? issue.id;
};
const stripRuleNamespace = (ruleId) => ruleId.split("/").at(-1) ?? ruleId;
const escapeRegExp$1 = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const matchesRule = (issue, rulePatterns) => {
  const ruleId = normalizeRuleId(issue);
  return rulePatterns.has(ruleId) || rulePatterns.has(stripRuleNamespace(ruleId));
};
const matchesPathPattern = (filePath, pattern) => {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern).replace(/^\.\//, "");
  if (normalizedPattern.endsWith("/**")) {
    const directoryPattern = normalizedPattern.slice(0, -3);
    return (
      normalizedFilePath === directoryPattern ||
      normalizedFilePath.startsWith(`${directoryPattern}/`)
    );
  }
  if (normalizedPattern.includes("*"))
    return new RegExp(
      `^${normalizedPattern
        .split("*")
        .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    ).test(normalizedFilePath);
  return (
    normalizedFilePath === normalizedPattern ||
    normalizedFilePath.startsWith(`${normalizedPattern}/`)
  );
};
const toRelativeIssuePath = (issue, rootDirectory) => {
  const filePath = issue.location?.filePath;
  if (!filePath) return "";
  if (!path.isAbsolute(filePath)) return normalizePath(filePath);
  return normalizePath(path.relative(rootDirectory, filePath));
};
const compileOverrides = (config) =>
  (config.ignore?.overrides ?? []).map((override) => ({
    files: override.files,
    rules: override.rules ? new Set(override.rules) : null,
  }));
const isIgnoredByOverride = (issue, filePath, overrides) => {
  for (const override of overrides) {
    if (!override.files.some((pattern) => matchesPathPattern(filePath, pattern))) continue;
    if (!override.rules || matchesRule(issue, override.rules)) return true;
  }
  return false;
};
const isDisabledByInlineComment = (issue, sourceLines) => {
  const line = issue.location?.line;
  if (!line || !sourceLines) return false;
  const ruleId = stripRuleNamespace(normalizeRuleId(issue));
  const sameLine = sourceLines[line - 1] ?? "";
  const previousLine = sourceLines[line - 2] ?? "";
  if (
    (sameLine.includes("react-doctor-disable-line") &&
      (sameLine.includes(ruleId) || !sameLine.includes("react-doctor/"))) ||
    (previousLine.includes("react-doctor-disable-next-line") &&
      (previousLine.includes(ruleId) || !previousLine.includes("react-doctor/")))
  )
    return true;
  if (
    previousLine.includes("eslint-disable-next-line") ||
    previousLine.includes("oxlint-disable-next-line")
  ) {
    if (previousLine.includes(ruleId)) return true;
  }
  return false;
};
const toLineStartIndex = (sourceLines, line) => {
  let startIndex = 0;
  for (let lineIndex = 0; lineIndex < line - 1; lineIndex++)
    startIndex += (sourceLines[lineIndex] ?? "").length + 1;
  return startIndex;
};
const findComponentMatches = (sourceText, componentName) => {
  const escapedComponentName = escapeRegExp$1(componentName);
  const componentPattern = new RegExp(
    `<${escapedComponentName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedComponentName}>`,
    "g",
  );
  const matches = [];
  for (const match of sourceText.matchAll(componentPattern)) {
    if (match.index === void 0) continue;
    matches.push({
      innerText: match[1] ?? "",
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  return matches;
};
const isStringOnlyWrapperContent = (innerText) => {
  const trimmedInnerText = innerText.trim();
  return trimmedInnerText.length > 0 && !/[<{]/.test(trimmedInnerText);
};
const isInsideComponentMatch = (issueIndex, match) =>
  issueIndex >= match.startIndex && issueIndex <= match.endIndex;
const isSuppressedRnRawTextIssue = (issue, config, sourceLines) => {
  if (stripRuleNamespace(normalizeRuleId(issue)) !== RN_NO_RAW_TEXT_RULE_ID) return false;
  const line = issue.location?.line;
  if (!line || !sourceLines) return false;
  const sourceText = sourceLines.join("\n");
  const issueIndex = toLineStartIndex(sourceLines, line);
  for (const componentName of config.textComponents ?? [])
    if (
      findComponentMatches(sourceText, componentName).some((match) =>
        isInsideComponentMatch(issueIndex, match),
      )
    )
      return true;
  for (const componentName of config.rawTextWrapperComponents ?? [])
    if (
      findComponentMatches(sourceText, componentName).some(
        (match) =>
          isInsideComponentMatch(issueIndex, match) && isStringOnlyWrapperContent(match.innerText),
      )
    )
      return true;
  return false;
};
const filterReactDoctorIssues = (issues, config, rootDirectory, readSourceLines, options) => {
  const ignoredRules = new Set(config.ignore?.rules ?? []);
  const ignoredFiles = config.ignore?.files ?? [];
  const overrides = compileOverrides(config);
  const isNonReactJsxProject =
    options?.jsxImportSource !== void 0 && NON_REACT_JSX_SOURCES.has(options.jsxImportSource);
  const nonReactJsxFileCache = /* @__PURE__ */ new Map();
  const isNonReactJsxFile = (relPath) => {
    const cached = nonReactJsxFileCache.get(relPath);
    if (cached !== void 0) return cached;
    const lines = readSourceLines?.(relPath);
    const isNonReact = Boolean(
      lines && NON_REACT_JSX_IMPORT_PATTERN.test(lines.slice(0, 30).join("\n")),
    );
    nonReactJsxFileCache.set(relPath, isNonReact);
    return isNonReact;
  };
  const filtered = issues.filter((issue) => {
    const relativeFilePath = toRelativeIssuePath(issue, rootDirectory);
    if (isAutoSuppressedTestNoise(issue, relativeFilePath)) return false;
    const ruleId = normalizeRuleId(issue);
    const unwrappedRuleId = toMetadataRuleKey(issue) ?? ruleId;
    if (REACT_BUILTIN_RULE_PREFIX.test(unwrappedRuleId)) {
      if (isNonReactJsxProject) return false;
      if (relativeFilePath && isNonReactJsxFile(relativeFilePath)) return false;
    }
    if (
      unwrappedRuleId.startsWith(JSX_A11Y_RULE_PREFIX) &&
      relativeFilePath &&
      OG_IMAGE_FILE_PATTERN.test(relativeFilePath)
    )
      return false;
    if (matchesRule(issue, ignoredRules)) return false;
    if (
      relativeFilePath &&
      ignoredFiles.some((pattern) => matchesPathPattern(relativeFilePath, pattern))
    )
      return false;
    if (isIgnoredByOverride(issue, relativeFilePath, overrides)) return false;
    if (
      config.respectInlineDisables !== false &&
      relativeFilePath &&
      isDisabledByInlineComment(issue, readSourceLines?.(relativeFilePath))
    )
      return false;
    if (
      relativeFilePath &&
      isSuppressedRnRawTextIssue(issue, config, readSourceLines?.(relativeFilePath))
    )
      return false;
    return true;
  });
  const seen = /* @__PURE__ */ new Set();
  return filtered.filter((issue) => {
    const loc = issue.location;
    if (!loc?.filePath || loc.line === void 0) return true;
    const dedupeRuleId = normalizeRuleId(issue);
    const dedupeKey = `${loc.filePath}:${loc.line}:${dedupeRuleId}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
};
//#endregion
//#region src/core/rules/react-project-structure.ts
const reactProjectStructureRule = defineRule({
  metadata: {
    id: "react-doctor/react-project-structure",
    name: "React project structure",
    description: "Discovers the React project boundary and records project-level metadata.",
    category: "project",
    severity: "info",
    defaultEnabled: true,
    tags: ["project", "discovery"],
  },
  run: () => ({ issues: [] }),
});
//#endregion
//#region src/core/rules/codebase/analyzer/path-utils.ts
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toPortablePath = (filePath) => filePath.split(path.sep).join("/");
const toRelativePath = (rootDirectory, filePath) =>
  toPortablePath(path.relative(rootDirectory, filePath));
const isSourceFilePath = (filePath) =>
  SOURCE_FILE_EXTENSIONS.some((extension) => filePath.endsWith(extension)) &&
  !TYPESCRIPT_DECLARATION_EXTENSIONS.some((extension) => filePath.endsWith(extension));
const buildLineStarts = (sourceText) => {
  const lineStarts = [0];
  for (let index = 0; index < sourceText.length; index++)
    if (sourceText[index] === "\n") lineStarts.push(index + 1);
  return lineStarts;
};
const getSourcePositionFromLineStarts = (lineStarts, index) => {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const lineStart = lineStarts[middle] ?? 0;
    const nextLineStart = lineStarts[middle + 1] ?? Number.POSITIVE_INFINITY;
    if (index < lineStart) high = middle - 1;
    else if (index >= nextLineStart) low = middle + 1;
    else
      return {
        line: middle + 1,
        column: index - lineStart + 1,
      };
  }
  return {
    line: 1,
    column: 1,
  };
};
const isBareSpecifier = (specifier) =>
  !specifier.startsWith(".") &&
  !specifier.startsWith("/") &&
  !specifier.startsWith("#") &&
  !/^[A-Za-z][A-Za-z\d+.-]*:/.test(specifier);
const isUrlLikeSpecifier = (specifier) => /^[A-Za-z][A-Za-z\d+.-]*:/.test(specifier);
const getPackageNameFromSpecifier = (specifier) => {
  if (!isBareSpecifier(specifier)) return null;
  const parts = specifier.split("/");
  const firstPart = parts[0];
  if (!firstPart) return null;
  if (firstPart.startsWith("@")) {
    const secondPart = parts[1];
    return secondPart ? `${firstPart}/${secondPart}` : firstPart;
  }
  return firstPart;
};
const getFileStem = (relativePath) => {
  const basename = path.basename(relativePath);
  for (const extension of SOURCE_FILE_EXTENSIONS)
    if (basename.endsWith(extension)) return basename.slice(0, -extension.length);
  return basename;
};
const createGlobMatcher = (pattern) => {
  let source = "";
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    const nextCharacter = pattern[index + 1];
    const characterAfterNext = pattern[index + 2];
    if (character === "*" && nextCharacter === "*" && characterAfterNext === "/") {
      source += "(?:.*/)?";
      index += 2;
    } else if (character === "*" && nextCharacter === "*") {
      source += ".*";
      index++;
    } else if (character === "*") source += "[^/]*";
    else if (character === "{") {
      const endIndex = pattern.indexOf("}", index);
      if (endIndex > index) {
        source += `(${pattern
          .slice(index + 1, endIndex)
          .split(",")
          .map(escapeRegExp)
          .join("|")})`;
        index = endIndex;
      } else source += "\\{";
    } else source += escapeRegExp(character);
  }
  return new RegExp(`^${source}$`);
};
const matchesGlob = (relativePath, pattern) => createGlobMatcher(pattern).test(relativePath);
const matchesAnyGlob = (relativePath, patterns) =>
  patterns.some((pattern) => matchesGlob(relativePath, pattern));
//#endregion
//#region src/core/rules/codebase/analyzer/graph.ts
const createGraphNode = (resolvedModule, entryPoints) => ({
  file: resolvedModule.module.file,
  imports: resolvedModule.imports,
  importedBy: /* @__PURE__ */ new Set(),
  exports: new Map(
    resolvedModule.module.exports.map((exportRecord) => [
      exportRecord.exportedName,
      {
        ...exportRecord,
        references: [],
        isPluginUsed: false,
        isReferencedByNamespace: false,
        referencedMemberNames: /* @__PURE__ */ new Set(),
      },
    ]),
  ),
  directives: resolvedModule.module.directives,
  parseErrors: resolvedModule.module.parseErrors,
  usedIdentifiers: resolvedModule.module.usedIdentifiers,
  namespaceMemberReferences: resolvedModule.module.namespaceMemberReferences,
  memberObjectReferences: resolvedModule.module.memberObjectReferences,
  namespaceObjectAliases: resolvedModule.module.namespaceObjectAliases,
  namespaceLocalAliases: resolvedModule.module.namespaceLocalAliases,
  namespaceLocalObjectAliases: resolvedModule.module.namespaceLocalObjectAliases,
  entryRoles: new Set(
    entryPoints
      .filter((entryPoint) => entryPoint.fileId === resolvedModule.module.file.id)
      .map((entryPoint) => entryPoint.role),
  ),
  entrySources: new Set(
    entryPoints
      .filter((entryPoint) => entryPoint.fileId === resolvedModule.module.file.id)
      .map((entryPoint) => entryPoint.source),
  ),
  isReachable: false,
  isRuntimeReachable: false,
  isTestReachable: false,
  isTypeReachable: false,
  hasCjsExports: resolvedModule.module.cjsExportNames.size > 0,
});
const createPathToNodeMap = (nodes) =>
  new Map([...nodes.values()].map((node) => [node.file.filePath, node]));
const connectReverseImports = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  for (const node of nodes.values())
    for (const resolvedImport of node.imports) {
      if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath) continue;
      pathToNode.get(resolvedImport.targetFilePath)?.importedBy.add(node.file.id);
    }
};
const markReachableFiles = (nodes, entryPoints) => {
  const pending = entryPoints.map((entryPoint) => ({
    fileId: entryPoint.fileId,
    role: entryPoint.role,
  }));
  const visitedKeys = /* @__PURE__ */ new Set();
  const pathToNode = createPathToNodeMap(nodes);
  while (pending.length > 0) {
    const item = pending.pop();
    if (!item) continue;
    const key = `${item.fileId}:${item.role}`;
    if (visitedKeys.has(key)) continue;
    visitedKeys.add(key);
    const node = nodes.get(item.fileId);
    if (!node) continue;
    node.isReachable = true;
    if (item.role === "runtime") node.isRuntimeReachable = true;
    if (item.role === "test") node.isTestReachable = true;
    if (item.role === "type") node.isTypeReachable = true;
    for (const resolvedImport of node.imports)
      if (resolvedImport.targetKind === "internal" && resolvedImport.targetFilePath) {
        const targetNode = pathToNode.get(resolvedImport.targetFilePath);
        const role = resolvedImport.importRecord.isTypeOnly ? "type" : item.role;
        if (targetNode)
          pending.push({
            fileId: targetNode.file.id,
            role,
          });
      }
  }
};
const findExportSymbol = (node, importedName) =>
  node.exports.get(importedName) ??
  (importedName === "default" ? node.exports.get("default") : void 0);
const addExportReference = (exportSymbol, reference) => {
  if (
    exportSymbol.references.some(
      (existingReference) =>
        existingReference.fromFileId === reference.fromFileId &&
        existingReference.importRecord.source === reference.importRecord.source &&
        existingReference.kind === reference.kind,
    )
  )
    return false;
  exportSymbol.references.push(reference);
  return true;
};
const addExportMemberReferences = (exportSymbol, memberNames) => {
  for (const memberName of memberNames)
    if (exportSymbol.members.some((member) => member.name === memberName))
      exportSymbol.referencedMemberNames.add(memberName);
};
const addAllExportMemberReferences = (exportSymbol) => {
  addExportMemberReferences(
    exportSymbol,
    exportSymbol.members.map((member) => member.name),
  );
};
const getMemberReferencesForLocalName = (node, localName) =>
  node.namespaceMemberReferences
    .filter((reference) => reference.namespace === localName && reference.memberPath.length >= 1)
    .map((reference) => reference.memberPath[0])
    .filter((memberName) => Boolean(memberName));
const getMemberObjectReferencesForLocalName = (node, localName) =>
  node.memberObjectReferences.filter((reference) => reference.namespace === localName);
const getNamespaceMemberReferencesForLocalName = (node, localName) => [
  ...node.namespaceMemberReferences.filter((reference) => reference.namespace === localName),
  ...node.namespaceLocalAliases
    .filter(
      (alias) =>
        alias.namespaceLocalName === localName && node.usedIdentifiers.has(alias.aliasName),
    )
    .flatMap((alias) =>
      node.namespaceMemberReferences.filter((reference) => reference.namespace === alias.aliasName),
    ),
];
const getNamespaceMemberObjectReferencesForLocalName = (node, localName) => [
  ...getMemberObjectReferencesForLocalName(node, localName),
  ...node.namespaceLocalAliases
    .filter(
      (alias) =>
        alias.namespaceLocalName === localName && node.usedIdentifiers.has(alias.aliasName),
    )
    .flatMap((alias) => getMemberObjectReferencesForLocalName(node, alias.aliasName)),
];
const addImportReferences = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  for (const node of nodes.values())
    for (const resolvedImport of node.imports) {
      if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath) continue;
      const targetNode = pathToNode.get(resolvedImport.targetFilePath);
      if (!targetNode) continue;
      if (resolvedImport.importRecord.bindings.length === 0) continue;
      for (const binding of resolvedImport.importRecord.bindings) {
        if (resolvedImport.importRecord.kind === "re-export" && binding.isNamespace) continue;
        const isReExport = resolvedImport.importRecord.kind === "re-export";
        const isCommentReference = resolvedImport.importRecord.kind === "comment";
        if (!isReExport && !isCommentReference && !node.usedIdentifiers.has(binding.localName))
          continue;
        if (binding.isNamespace) {
          const namespaceReferences = getNamespaceMemberReferencesForLocalName(
            node,
            binding.localName,
          );
          const namespaceObjectReferences = getNamespaceMemberObjectReferencesForLocalName(
            node,
            binding.localName,
          );
          const referencedMemberNames = new Set(
            [...namespaceReferences, ...namespaceObjectReferences]
              .map((reference) => reference.memberPath[0])
              .filter((memberName) => Boolean(memberName)),
          );
          if (
            referencedMemberNames.size === 0 &&
            (node.namespaceObjectAliases.some(
              (alias) => alias.namespaceLocalName === binding.localName,
            ) ||
              node.namespaceLocalAliases.some(
                (alias) => alias.namespaceLocalName === binding.localName,
              ) ||
              node.namespaceLocalObjectAliases.some(
                (alias) => alias.namespaceLocalName === binding.localName,
              ))
          )
            continue;
          const referencedExportSymbols =
            referencedMemberNames.size > 0
              ? [...referencedMemberNames].flatMap((memberName) => {
                  const exportSymbol = targetNode.exports.get(memberName);
                  return exportSymbol ? [exportSymbol] : [];
                })
              : [...targetNode.exports.values()];
          for (const exportSymbol of referencedExportSymbols) {
            exportSymbol.isReferencedByNamespace = true;
            addExportMemberReferences(
              exportSymbol,
              namespaceReferences
                .filter((reference) => reference.memberPath[0] === exportSymbol.exportedName)
                .map((reference) => reference.memberPath[1])
                .filter((memberName) => Boolean(memberName)),
            );
            for (const objectReference of namespaceObjectReferences) {
              if (objectReference.memberPath.length === 0) {
                addAllExportMemberReferences(exportSymbol);
                continue;
              }
              if (objectReference.memberPath[0] === exportSymbol.exportedName)
                addAllExportMemberReferences(exportSymbol);
            }
            addExportReference(exportSymbol, {
              fromFileId: node.file.id,
              kind: referencedMemberNames.size > 0 ? "namespace-member" : "namespace",
              importRecord: resolvedImport.importRecord,
            });
          }
          continue;
        }
        const exportSymbol = findExportSymbol(targetNode, binding.importedName);
        if (exportSymbol && node.file.id !== targetNode.file.id) {
          addExportMemberReferences(
            exportSymbol,
            getMemberReferencesForLocalName(node, binding.localName),
          );
          if (
            getMemberObjectReferencesForLocalName(node, binding.localName).some(
              (reference) => reference.memberPath.length === 0,
            )
          )
            addAllExportMemberReferences(exportSymbol);
          addExportReference(exportSymbol, {
            fromFileId: node.file.id,
            kind: binding.importedName === "default" ? "default" : "named",
            importRecord: resolvedImport.importRecord,
          });
        }
      }
    }
};
const addLocalExportMemberReferences = (nodes) => {
  for (const node of nodes.values())
    for (const exportSymbol of node.exports.values()) {
      const localName = exportSymbol.localName ?? exportSymbol.exportedName;
      addExportMemberReferences(exportSymbol, getMemberReferencesForLocalName(node, localName));
      if (
        getMemberObjectReferencesForLocalName(node, localName).some(
          (reference) => reference.memberPath.length === 0,
        )
      )
        addAllExportMemberReferences(exportSymbol);
    }
};
const propagateNamespaceLocalObjectAliases = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  for (const node of nodes.values()) {
    if (node.namespaceLocalObjectAliases.length === 0) continue;
    for (const memberReference of node.namespaceMemberReferences.filter(
      (reference) => !isPrefixMemberReference(reference, node.namespaceMemberReferences),
    )) {
      const alias = node.namespaceLocalObjectAliases.find(
        (item) =>
          item.objectLocalName === memberReference.namespace &&
          item.propertyName === memberReference.memberPath[0],
      );
      if (!alias) continue;
      const namespaceTargetNode = findNamespaceImportTarget(
        node,
        pathToNode,
        alias.namespaceLocalName,
      );
      if (!namespaceTargetNode) continue;
      const targetMemberPath = memberReference.memberPath.slice(1);
      if (targetMemberPath.length === 0) {
        const importRecord = findNamespaceImportRecord(node, alias.namespaceLocalName);
        if (importRecord)
          addNamespaceObjectReference(namespaceTargetNode, node.file.id, importRecord);
        continue;
      }
      const importRecord = findNamespaceImportRecord(node, alias.namespaceLocalName);
      if (importRecord)
        addNamespaceMemberPathReference(
          namespaceTargetNode,
          targetMemberPath,
          node.file.id,
          importRecord,
        );
    }
  }
};
const findNamespaceImportTarget = (node, pathToNode, namespaceLocalName) => {
  for (const resolvedImport of node.imports) {
    if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath) continue;
    if (
      resolvedImport.importRecord.bindings.some(
        (binding) => binding.isNamespace && binding.localName === namespaceLocalName,
      )
    )
      return pathToNode.get(resolvedImport.targetFilePath) ?? null;
  }
  return null;
};
const findNamespaceImportRecord = (node, namespaceLocalName) => {
  return (
    node.imports.find((item) =>
      item.importRecord.bindings.some(
        (binding) => binding.isNamespace && binding.localName === namespaceLocalName,
      ),
    )?.importRecord ?? null
  );
};
const addNamespaceMemberReference = (
  targetNode,
  exportName,
  fromFileId,
  importRecord,
  exportedMemberNames = [],
) => {
  const exportSymbol = targetNode.exports.get(exportName);
  if (!exportSymbol) return;
  exportSymbol.isReferencedByNamespace = true;
  addExportMemberReferences(exportSymbol, exportedMemberNames);
  addExportReference(exportSymbol, {
    fromFileId,
    kind: "namespace-member",
    importRecord,
  });
};
const addNamespaceMemberPathReference = (targetNode, memberPath, fromFileId, importRecord) => {
  const exportName = memberPath[0];
  if (!exportName) return;
  addNamespaceMemberReference(
    targetNode,
    exportName,
    fromFileId,
    importRecord,
    memberPath.slice(1),
  );
};
const addNamespaceObjectReference = (targetNode, fromFileId, importRecord) => {
  for (const exportSymbol of targetNode.exports.values()) {
    exportSymbol.isReferencedByNamespace = true;
    addExportReference(exportSymbol, {
      fromFileId,
      kind: "namespace",
      importRecord,
    });
  }
};
const isPrefixMemberReference = (reference, references) =>
  references.some(
    (candidate) =>
      candidate !== reference &&
      candidate.namespace === reference.namespace &&
      candidate.memberPath.length > reference.memberPath.length &&
      reference.memberPath.every((memberName, index) => candidate.memberPath[index] === memberName),
  );
const propagateNamespaceObjectAliases = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  for (const consumerNode of nodes.values())
    for (const resolvedImport of consumerNode.imports) {
      if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath) continue;
      const aliasNode = pathToNode.get(resolvedImport.targetFilePath);
      if (!aliasNode || aliasNode.namespaceObjectAliases.length === 0) continue;
      for (const binding of resolvedImport.importRecord.bindings) {
        if (!consumerNode.usedIdentifiers.has(binding.localName)) continue;
        const bindingMemberReferences = consumerNode.namespaceMemberReferences.filter(
          (reference) => reference.namespace === binding.localName,
        );
        if (bindingMemberReferences.length === 0) {
          const aliases = aliasNode.namespaceObjectAliases.filter(
            (alias) => binding.isNamespace || alias.exportName === binding.importedName,
          );
          for (const alias of aliases) {
            const namespaceTargetNode = findNamespaceImportTarget(
              aliasNode,
              pathToNode,
              alias.namespaceLocalName,
            );
            if (namespaceTargetNode)
              addNamespaceObjectReference(
                namespaceTargetNode,
                consumerNode.file.id,
                resolvedImport.importRecord,
              );
          }
          continue;
        }
        for (const memberReference of bindingMemberReferences.filter(
          (reference) => !isPrefixMemberReference(reference, bindingMemberReferences),
        )) {
          const exportNameOffset = binding.isNamespace ? 1 : 0;
          const alias = aliasNode.namespaceObjectAliases.find(
            (item) =>
              item.exportName ===
                (binding.isNamespace ? memberReference.memberPath[0] : binding.importedName) &&
              item.propertyName === memberReference.memberPath[exportNameOffset],
          );
          if (!alias) continue;
          const namespaceTargetNode = findNamespaceImportTarget(
            aliasNode,
            pathToNode,
            alias.namespaceLocalName,
          );
          if (!namespaceTargetNode) continue;
          const targetMemberPath = memberReference.memberPath.slice(exportNameOffset + 1);
          if (targetMemberPath.length === 0) {
            addNamespaceObjectReference(
              namespaceTargetNode,
              consumerNode.file.id,
              resolvedImport.importRecord,
            );
            continue;
          }
          addNamespaceMemberPathReference(
            namespaceTargetNode,
            targetMemberPath,
            consumerNode.file.id,
            resolvedImport.importRecord,
          );
        }
      }
    }
};
const collectNamespaceReExportReferences = (consumerNode, targetNode, exportName) => {
  const references = [];
  for (const resolvedImport of consumerNode.imports) {
    if (
      resolvedImport.targetKind !== "internal" ||
      resolvedImport.targetFilePath !== targetNode.file.filePath
    )
      continue;
    for (const binding of resolvedImport.importRecord.bindings) {
      if (!consumerNode.usedIdentifiers.has(binding.localName)) continue;
      if (binding.isNamespace) {
        const bindingReferences = consumerNode.namespaceMemberReferences.filter(
          (item) => item.namespace === binding.localName,
        );
        const standaloneExportReferences = bindingReferences
          .filter((item) => item.memberPath[0] === exportName)
          .filter((item) => !isPrefixMemberReference(item, bindingReferences));
        if (
          bindingReferences.length === 0 ||
          standaloneExportReferences.some((item) => item.memberPath.length === 1)
        ) {
          references.push({
            kind: "namespace",
            importRecord: resolvedImport.importRecord,
          });
          continue;
        }
        for (const reference of standaloneExportReferences.filter(
          (item) => item.memberPath.length >= 2,
        ))
          references.push({
            kind: "member",
            memberPath: reference.memberPath.slice(1),
            importRecord: resolvedImport.importRecord,
          });
        continue;
      }
      if (binding.importedName !== exportName) continue;
      const bindingReferences = consumerNode.namespaceMemberReferences.filter(
        (item) => item.namespace === binding.localName,
      );
      if (bindingReferences.length === 0) {
        references.push({
          kind: "namespace",
          importRecord: resolvedImport.importRecord,
        });
        continue;
      }
      for (const reference of bindingReferences.filter(
        (item) => !isPrefixMemberReference(item, bindingReferences),
      ))
        references.push({
          kind: "member",
          memberPath: reference.memberPath,
          importRecord: resolvedImport.importRecord,
        });
    }
  }
  return references;
};
const enumerateReachableNamespaceReExports = (nodes, pathToNode, seedNode, seedExportName) => {
  const reachableByKey = /* @__PURE__ */ new Map();
  const pending = [
    {
      node: seedNode,
      exportName: seedExportName,
    },
  ];
  for (const item of pending) {
    const key = `${item.node.file.id}:${item.exportName}`;
    if (reachableByKey.has(key)) continue;
    reachableByKey.set(key, item);
    for (const candidateNode of nodes.values())
      for (const candidateExport of candidateNode.exports.values()) {
        if (!candidateExport.isReExport || !candidateExport.source) continue;
        if (
          getInternalImportTarget(candidateNode, pathToNode, candidateExport.source)?.file.id !==
          item.node.file.id
        )
          continue;
        if (candidateExport.isNamespace && candidateExport.exportedName !== "*") continue;
        if (candidateExport.importedName === item.exportName)
          pending.push({
            node: candidateNode,
            exportName: candidateExport.exportedName,
          });
        else if (candidateExport.importedName === "*" && candidateExport.exportedName === "*")
          pending.push({
            node: candidateNode,
            exportName: item.exportName,
          });
      }
  }
  return [...reachableByKey.values()];
};
const propagateNamespaceReExportReferences = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  for (const node of nodes.values())
    for (const exportSymbol of node.exports.values()) {
      if (
        !exportSymbol.isReExport ||
        !exportSymbol.isNamespace ||
        !exportSymbol.source ||
        exportSymbol.exportedName === "*"
      )
        continue;
      const sourceNode = getInternalImportTarget(node, pathToNode, exportSymbol.source);
      if (!sourceNode) continue;
      const reachableExports = enumerateReachableNamespaceReExports(
        nodes,
        pathToNode,
        node,
        exportSymbol.exportedName,
      );
      if (reachableExports.some((item) => isPackageEntrypoint$1(item.node))) {
        for (const sourceExport of sourceNode.exports.values()) {
          if (sourceExport.exportedName === "default" || sourceExport.exportedName === "*")
            continue;
          addExportReference(sourceExport, {
            fromFileId: node.file.id,
            kind: "re-export",
            importRecord: getInternalImportRecord(node, exportSymbol.source) ??
              node.imports[0]?.importRecord ?? {
                source: exportSymbol.source,
                bindings: [],
                kind: "re-export",
                isTypeOnly: exportSymbol.isTypeOnly,
                isSideEffectOnly: false,
                isOptional: false,
                start: exportSymbol.start,
                end: exportSymbol.end,
                position: exportSymbol.position,
              },
          });
        }
        continue;
      }
      for (const reachableExport of reachableExports)
        for (const consumerNode of nodes.values())
          for (const reference of collectNamespaceReExportReferences(
            consumerNode,
            reachableExport.node,
            reachableExport.exportName,
          )) {
            if (reference.kind === "namespace") {
              addNamespaceObjectReference(sourceNode, consumerNode.file.id, reference.importRecord);
              continue;
            }
            if (reference.memberPath)
              addNamespaceMemberPathReference(
                sourceNode,
                reference.memberPath,
                consumerNode.file.id,
                reference.importRecord,
              );
          }
    }
};
const isPackageEntrypoint$1 = (node) => node.entrySources.has("package.json");
const getInternalImportTarget = (node, pathToNode, source) => {
  const sourceImport = node.imports.find(
    (resolvedImport) => resolvedImport.importRecord.source === source,
  );
  if (sourceImport?.targetKind !== "internal" || !sourceImport.targetFilePath) return null;
  return pathToNode.get(sourceImport.targetFilePath) ?? null;
};
const getInternalImportRecord = (node, source) =>
  node.imports.find((resolvedImport) => resolvedImport.importRecord.source === source)
    ?.importRecord ?? null;
const propagateStarReferenceToSource = (
  sourceNode,
  pathToNode,
  exportName,
  reference,
  visitedNodeIds = /* @__PURE__ */ new Set(),
) => {
  if (visitedNodeIds.has(sourceNode.file.id)) return false;
  visitedNodeIds.add(sourceNode.file.id);
  const sourceExport = sourceNode.exports.get(exportName);
  if (sourceExport)
    return addExportReference(sourceExport, {
      ...reference,
      kind: "re-export",
    });
  let didChange = false;
  for (const starExport of sourceNode.exports.values()) {
    if (!starExport.isReExport || !starExport.source || starExport.exportedName !== "*") continue;
    const nextSourceNode = getInternalImportTarget(sourceNode, pathToNode, starExport.source);
    if (!nextSourceNode) continue;
    didChange =
      propagateStarReferenceToSource(
        nextSourceNode,
        pathToNode,
        exportName,
        reference,
        visitedNodeIds,
      ) || didChange;
  }
  return didChange;
};
const collectNamedImportReferencesToNode = (nodes, targetNode) => {
  const referencesByName = /* @__PURE__ */ new Map();
  for (const importerNode of nodes.values())
    for (const resolvedImport of importerNode.imports) {
      if (
        resolvedImport.targetKind !== "internal" ||
        resolvedImport.targetFilePath !== targetNode.file.filePath
      )
        continue;
      for (const binding of resolvedImport.importRecord.bindings) {
        if (
          binding.isNamespace ||
          binding.importedName === "default" ||
          binding.importedName === "*"
        )
          continue;
        const references = referencesByName.get(binding.importedName) ?? [];
        references.push({
          fromFileId: importerNode.file.id,
          kind: "re-export",
          importRecord: resolvedImport.importRecord,
        });
        referencesByName.set(binding.importedName, references);
      }
    }
  return referencesByName;
};
const collectReferencedExports = (node) => {
  const referencesByName = /* @__PURE__ */ new Map();
  for (const exportSymbol of node.exports.values()) {
    if (exportSymbol.references.length === 0) continue;
    referencesByName.set(exportSymbol.exportedName, [...exportSymbol.references]);
  }
  return referencesByName;
};
const propagateStarReExportReferences = (nodes, node, pathToNode) => {
  let didChange = false;
  const namedImportReferences = collectNamedImportReferencesToNode(nodes, node);
  const referencedExports = collectReferencedExports(node);
  for (const exportSymbol of node.exports.values()) {
    if (!exportSymbol.isReExport || !exportSymbol.source || exportSymbol.exportedName !== "*")
      continue;
    const sourceNode = getInternalImportTarget(node, pathToNode, exportSymbol.source);
    if (!sourceNode) continue;
    const importRecord = getInternalImportRecord(node, exportSymbol.source);
    if (!importRecord) continue;
    if (isPackageEntrypoint$1(node)) {
      for (const sourceExport of sourceNode.exports.values()) {
        if (sourceExport.exportedName === "default" || sourceExport.exportedName === "*") continue;
        didChange =
          addExportReference(sourceExport, {
            fromFileId: node.file.id,
            kind: "re-export",
            importRecord,
          }) || didChange;
      }
      continue;
    }
    for (const [exportName, references] of [...namedImportReferences, ...referencedExports]) {
      if (exportName === "default" || exportName === "*") continue;
      for (const reference of references)
        didChange =
          propagateStarReferenceToSource(sourceNode, pathToNode, exportName, reference) ||
          didChange;
    }
  }
  return didChange;
};
const propagateNamedReExportReferences = (node, pathToNode, exportSymbol) => {
  if (!exportSymbol.isReExport || !exportSymbol.source || exportSymbol.exportedName === "*")
    return false;
  const sourceNode = getInternalImportTarget(node, pathToNode, exportSymbol.source);
  if (!sourceNode) return false;
  const importRecord = getInternalImportRecord(node, exportSymbol.source);
  if (!importRecord) return false;
  const targetExportName = exportSymbol.importedName ?? exportSymbol.exportedName;
  const targetExport = sourceNode.exports.get(targetExportName);
  if (!targetExport) return false;
  const references =
    exportSymbol.references.length > 0
      ? exportSymbol.references
      : isPackageEntrypoint$1(node)
        ? [
            {
              fromFileId: node.file.id,
              kind: "re-export",
              importRecord,
            },
          ]
        : [];
  let didChange = false;
  for (const reference of references)
    didChange =
      addExportReference(targetExport, {
        ...reference,
        kind: "re-export",
      }) || didChange;
  return didChange;
};
const propagateReExportReferences = (nodes) => {
  const pathToNode = createPathToNodeMap(nodes);
  let didChange = true;
  while (didChange) {
    didChange = false;
    for (const node of nodes.values()) {
      didChange = propagateStarReExportReferences(nodes, node, pathToNode) || didChange;
      for (const exportSymbol of node.exports.values())
        didChange = propagateNamedReExportReferences(node, pathToNode, exportSymbol) || didChange;
    }
  }
};
const applyPluginUsedExports = (nodes, pluginResults, workspaces) => {
  for (const node of nodes.values()) {
    const workspace = workspaces[node.file.workspaceId];
    const pluginResult = pluginResults.get(node.file.workspaceId);
    if (!workspace || !pluginResult) continue;
    const workspaceRelativePath = toRelativePath(workspace.directory, node.file.filePath);
    for (const [pattern, exportNames] of pluginResult.usedExports) {
      if (!matchesAnyGlob(workspaceRelativePath, [pattern])) continue;
      for (const exportName of exportNames) {
        const exportSymbol = node.exports.get(exportName);
        if (exportSymbol) exportSymbol.isPluginUsed = true;
      }
    }
  }
};
const collectUnresolvedImports$1 = (nodes) => {
  const unresolvedImports = [];
  for (const node of nodes.values())
    unresolvedImports.push(
      ...node.imports.filter((resolvedImport) => resolvedImport.targetKind === "unresolved"),
    );
  return unresolvedImports;
};
const isLoaderPackageUsage = (resolvedImport) =>
  resolvedImport.importRecord.source.includes("!") &&
  Boolean(
    resolvedImport.packageName &&
    resolvedImport.importRecord.source
      .split("!")
      .slice(0, -1)
      .some((loader) => loader.includes(resolvedImport.packageName ?? "")),
  );
const collectPackageUsages = (nodes, workspaces) => {
  const workspaceNames = new Set(workspaces.map((workspace) => workspace.name));
  const pathToNode = createPathToNodeMap(nodes);
  return [...nodes.values()].flatMap((node) =>
    node.imports
      .filter((resolvedImport) => {
        if (!resolvedImport.packageName) return false;
        if (resolvedImport.targetKind === "external" || resolvedImport.targetKind === "unresolved")
          return true;
        if (!workspaceNames.has(resolvedImport.packageName)) return false;
        if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath)
          return false;
        const targetNode = pathToNode.get(resolvedImport.targetFilePath);
        return Boolean(targetNode && targetNode.file.workspaceId !== node.file.workspaceId);
      })
      .map((resolvedImport) => ({
        packageName: resolvedImport.packageName ?? "",
        workspaceId: node.file.workspaceId,
        fromFileId: node.file.id,
        specifier: resolvedImport.importRecord.source,
        isTypeOnly: resolvedImport.importRecord.isTypeOnly,
        isRuntime: node.isRuntimeReachable && !isLoaderPackageUsage(resolvedImport),
        isTestOnly: node.isTestReachable && !node.isRuntimeReachable,
      })),
  );
};
const buildModuleGraph = (config, workspaces, resolvedModules, entryPoints, pluginResults) => {
  const nodes = /* @__PURE__ */ new Map();
  for (const resolvedModule of resolvedModules)
    nodes.set(resolvedModule.module.file.id, createGraphNode(resolvedModule, entryPoints));
  connectReverseImports(nodes);
  markReachableFiles(nodes, entryPoints);
  addImportReferences(nodes);
  addLocalExportMemberReferences(nodes);
  propagateNamespaceLocalObjectAliases(nodes);
  propagateNamespaceObjectAliases(nodes);
  propagateNamespaceReExportReferences(nodes);
  propagateReExportReferences(nodes);
  applyPluginUsedExports(nodes, pluginResults, workspaces);
  return {
    rootDirectory: config.rootDirectory,
    config,
    workspaces,
    files: resolvedModules.map((resolvedModule) => resolvedModule.module.file),
    nodes,
    pathToFileId: new Map(
      resolvedModules.map((resolvedModule) => [
        resolvedModule.module.file.filePath,
        resolvedModule.module.file.id,
      ]),
    ),
    entryPoints,
    packageUsages: collectPackageUsages(nodes, workspaces),
    unresolvedImports: collectUnresolvedImports$1(nodes),
    pluginResults,
  };
};
const isVisibilityProtected = (exportSymbol) =>
  [...exportSymbol.jsDocTags].some((tag) => PUBLIC_VISIBILITY_TAGS.has(tag) || tag === "internal");
//#endregion
//#region src/core/rules/codebase/analyzer/config.ts
const createCodebaseAnalysisConfig = (options) => ({
  rootDirectory: path.resolve(options.rootDirectory),
  includePaths: options.includePaths?.length ? options.includePaths : DEFAULT_INCLUDE_PATHS,
  excludePatterns: options.excludePatterns ?? [],
  conditionNames: DEFAULT_CONDITION_NAMES,
  production: false,
});
//#endregion
//#region src/core/rules/codebase/analyzer/workspace.ts
const toWorkspacePatternsFromPackageJson = (manifest) => {
  if (!manifest?.workspaces) return [];
  if (Array.isArray(manifest.workspaces)) return manifest.workspaces;
  return manifest.workspaces.packages ?? [];
};
const stripYamlComment = (line) => {
  let quote = null;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if ((character === '"' || character === "'") && line[index - 1] !== "\\")
      quote = quote === character ? null : (quote ?? character);
    if (character === "#" && !quote) return line.slice(0, index);
  }
  return line;
};
const cleanYamlStringValue = (value) =>
  stripYamlComment(value)
    .trim()
    .replace(/^["']|["']$/g, "");
const parseYamlInlineStringArray = (value) => {
  const trimmedValue = cleanYamlStringValue(value);
  if (!trimmedValue.startsWith("[") || !trimmedValue.endsWith("]")) return [];
  return trimmedValue.slice(1, -1).split(",").map(cleanYamlStringValue).filter(Boolean);
};
const parsePnpmWorkspacePatterns = (sourceText) => {
  const patterns = [];
  let isInPackagesSection = false;
  let packagesSectionIndent = 0;
  for (const rawLine of sourceText.split("\n")) {
    const line = stripYamlComment(rawLine);
    if (line.trim().length === 0) continue;
    const indent = line.length - line.trimStart().length;
    const trimmedLine = line.trim();
    const sectionMatch = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(trimmedLine);
    if (sectionMatch && indent === 0) {
      isInPackagesSection = sectionMatch[1] === "packages";
      packagesSectionIndent = indent;
      if (isInPackagesSection && sectionMatch[2])
        patterns.push(...parseYamlInlineStringArray(sectionMatch[2]));
      continue;
    }
    if (!isInPackagesSection || indent < packagesSectionIndent || !trimmedLine.startsWith("-"))
      continue;
    const pattern = cleanYamlStringValue(trimmedLine.slice(1));
    if (pattern.length > 0) patterns.push(pattern);
  }
  return patterns;
};
const readPnpmWorkspacePatterns = async (rootDirectory) => {
  try {
    return parsePnpmWorkspacePatterns(
      await fs$1.readFile(path.join(rootDirectory, "pnpm-workspace.yaml"), "utf8"),
    );
  } catch {
    return [];
  }
};
const hasPackageJson = async (directory) => {
  try {
    return (await fs$1.stat(path.join(directory, PACKAGE_JSON_FILENAME))).isFile();
  } catch {
    return false;
  }
};
const hasDirectory = async (directory) => {
  try {
    return (await fs$1.stat(directory)).isDirectory();
  } catch {
    return false;
  }
};
const parseJsonWithComments = (sourceText) =>
  JSON.parse(sourceText.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1"));
const hasFile = async (filePath) => {
  try {
    return (await fs$1.stat(filePath)).isFile();
  } catch {
    return false;
  }
};
const resolveExtendedTypeScriptConfigPath = async (tsconfigPath, extendsValue) => {
  if (typeof extendsValue !== "string" || extendsValue.length === 0) return null;
  if (!extendsValue.startsWith(".") && !extendsValue.startsWith("/")) return null;
  const directory = path.dirname(tsconfigPath);
  const resolvedPath = path.resolve(directory, extendsValue);
  const candidates = [
    resolvedPath,
    `${resolvedPath}.json`,
    path.join(resolvedPath, "tsconfig.json"),
  ];
  for (const candidate of candidates) if (await hasFile(candidate)) return candidate;
  return null;
};
const resolveReferencedTypeScriptConfigPath = async (tsconfigPath, referencePath) => {
  if (typeof referencePath !== "string" || referencePath.length === 0) return null;
  const directory = path.dirname(tsconfigPath);
  const resolvedPath = path.resolve(directory, referencePath);
  const candidates = [
    resolvedPath,
    `${resolvedPath}.json`,
    path.join(resolvedPath, "tsconfig.json"),
  ];
  for (const candidate of candidates) if (await hasFile(candidate)) return candidate;
  return null;
};
const toDirectoryOption = (value, directory) =>
  typeof value === "string" && value.length > 0 ? path.resolve(directory, value) : void 0;
const toDefinitelyTypedPackageName$1 = (typeName) => {
  if (typeName.startsWith("@types/")) return typeName;
  if (typeName.startsWith("@")) return `@types/${typeName.slice(1).replace("/", "__")}`;
  return `@types/${typeName}`;
};
const collectExtendsDependencyNames = (extendsValue) => {
  const dependencyNames = /* @__PURE__ */ new Set();
  const specifiers = Array.isArray(extendsValue) ? extendsValue : [extendsValue];
  for (const specifier of specifiers) {
    if (typeof specifier !== "string" || specifier.length === 0) continue;
    const packageName = getPackageNameFromSpecifier(specifier);
    if (packageName) dependencyNames.add(packageName);
  }
  return dependencyNames;
};
const collectTypeScriptConfigDependencyNames = (config) => {
  const dependencyNames = collectExtendsDependencyNames(config.extends);
  const compilerOptions = config.compilerOptions;
  if (!compilerOptions) return dependencyNames;
  if (
    typeof compilerOptions.jsxImportSource === "string" &&
    compilerOptions.jsxImportSource.length > 0
  )
    dependencyNames.add(compilerOptions.jsxImportSource);
  if (compilerOptions.importHelpers === true) dependencyNames.add("tslib");
  if (Array.isArray(compilerOptions.types)) {
    for (const typeName of compilerOptions.types)
      if (typeof typeName === "string" && typeName.length > 0)
        dependencyNames.add(toDefinitelyTypedPackageName$1(typeName));
  }
  if (Array.isArray(compilerOptions.plugins)) {
    for (const plugin of compilerOptions.plugins)
      if (
        plugin &&
        typeof plugin === "object" &&
        "name" in plugin &&
        typeof plugin.name === "string" &&
        plugin.name.length > 0
      )
        dependencyNames.add(plugin.name);
  }
  return dependencyNames;
};
const readTypeScriptDirectoryOptions = async (
  tsconfigPath,
  visitedPaths = /* @__PURE__ */ new Set(),
) => {
  if (visitedPaths.has(tsconfigPath)) return null;
  visitedPaths.add(tsconfigPath);
  try {
    const directory = path.dirname(tsconfigPath);
    const config = parseJsonWithComments(await fs$1.readFile(tsconfigPath, "utf8"));
    const extendedPath = await resolveExtendedTypeScriptConfigPath(tsconfigPath, config.extends);
    const inheritedOptions = extendedPath
      ? await readTypeScriptDirectoryOptions(extendedPath, visitedPaths)
      : null;
    const options = {
      ...inheritedOptions,
      dependencyNames: new Set([
        ...(inheritedOptions?.dependencyNames ?? []),
        ...collectTypeScriptConfigDependencyNames(config),
      ]),
      rootDir:
        toDirectoryOption(config.compilerOptions?.rootDir, directory) ?? inheritedOptions?.rootDir,
      outDir:
        toDirectoryOption(config.compilerOptions?.outDir, directory) ?? inheritedOptions?.outDir,
    };
    if (options.rootDir && options.outDir) return options;
    for (const reference of config.references ?? []) {
      const referencedPath = await resolveReferencedTypeScriptConfigPath(
        tsconfigPath,
        reference.path,
      );
      if (!referencedPath) continue;
      const referencedOptions = await readTypeScriptDirectoryOptions(referencedPath, visitedPaths);
      for (const dependencyName of referencedOptions?.dependencyNames ?? [])
        options.dependencyNames.add(dependencyName);
      options.rootDir ??= referencedOptions?.rootDir;
      options.outDir ??= referencedOptions?.outDir;
      if (options.rootDir && options.outDir) break;
    }
    return options;
  } catch {
    return null;
  }
};
const readTypeScriptSourceMaps = async (directory) => {
  const directoryOptions = await readTypeScriptDirectoryOptions(
    path.join(directory, "tsconfig.json"),
  );
  if (!directoryOptions?.outDir) return [];
  return [
    {
      sourceDirectory:
        directoryOptions.rootDir ??
        ((await hasDirectory(path.join(directory, "src")))
          ? path.join(directory, "src")
          : directory),
      outputDirectory: directoryOptions.outDir,
    },
  ];
};
const readTypeScriptConfigDependencyNames = async (directory) =>
  (await readTypeScriptDirectoryOptions(path.join(directory, "tsconfig.json")))?.dependencyNames ??
  /* @__PURE__ */ new Set();
const CSS_EXTENSIONS = new Set([".css", ".scss", ".less"]);
const CSS_IMPORT_PATTERN = /@import\s+["']([^"']+)["']/g;
const isCssFile = (fileName) => CSS_EXTENSIONS.has(path.extname(fileName).toLowerCase());
const extractCssImportPackageNames = (sourceText) => {
  const packageNames = /* @__PURE__ */ new Set();
  for (const match of sourceText.matchAll(CSS_IMPORT_PATTERN)) {
    const specifier = match[1];
    if (!specifier) continue;
    const packageName = getPackageNameFromSpecifier(specifier);
    if (packageName) packageNames.add(packageName);
  }
  return packageNames;
};
const discoverCssFilePaths = async (directory) => {
  let entries;
  try {
    entries = await fs$1.readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const filePaths = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRECTORY_NAMES.has(entry.name))
      filePaths.push(...(await discoverCssFilePaths(entryPath)));
    else if (entry.isFile() && isCssFile(entry.name)) filePaths.push(entryPath);
  }
  return filePaths;
};
const readCssImportDependencyNames = async (directory) => {
  const dependencyNames = /* @__PURE__ */ new Set();
  const cssFilePaths = await discoverCssFilePaths(directory);
  for (const filePath of cssFilePaths)
    try {
      const sourceText = await fs$1.readFile(filePath, "utf8");
      for (const packageName of extractCssImportPackageNames(sourceText))
        dependencyNames.add(packageName);
    } catch {
      continue;
    }
  return dependencyNames;
};
const expandSimpleWorkspacePattern = async (rootDirectory, pattern) => {
  const normalizedPattern = pattern.replace(/\/\*\*$/, "/*");
  const wildcardIndex = normalizedPattern.indexOf("*");
  if (wildcardIndex < 0) {
    const directory = path.resolve(rootDirectory, normalizedPattern);
    return (await hasPackageJson(directory)) ? [directory] : [];
  }
  const prefix = normalizedPattern.slice(0, wildcardIndex).replace(/\/$/, "");
  const suffix = normalizedPattern.slice(wildcardIndex + 1).replace(/^\//, "");
  const baseDirectory = path.resolve(rootDirectory, prefix || ".");
  let entries;
  try {
    entries = await fs$1.readdir(baseDirectory);
  } catch {
    return [];
  }
  const directories = [];
  for (const entry of entries) {
    const candidateDirectory = path.join(baseDirectory, entry, suffix);
    if (await hasPackageJson(candidateDirectory)) directories.push(candidateDirectory);
  }
  return directories;
};
const isNegatedWorkspacePattern = (pattern) => pattern.startsWith("!");
const toPositiveWorkspacePattern = (pattern) =>
  isNegatedWorkspacePattern(pattern) ? pattern.slice(1) : pattern;
const isExcludedWorkspaceDirectory = (rootDirectory, directory, negatedPatterns) => {
  const relativeDirectory = toRelativePath(rootDirectory, directory);
  return negatedPatterns
    .map(toPositiveWorkspacePattern)
    .some(
      (pattern) =>
        matchesGlob(relativeDirectory, pattern) ||
        matchesGlob(
          `${relativeDirectory}/package.json`,
          `${pattern.replace(/\/$/, "")}/package.json`,
        ),
    );
};
const discoverWorkspaceDirectories = async (config, rootManifest) => {
  const packagePatterns = toWorkspacePatternsFromPackageJson(rootManifest);
  const pnpmPatterns = await readPnpmWorkspacePatterns(config.rootDirectory);
  const patterns = [...new Set([...packagePatterns, ...pnpmPatterns])];
  const negatedPatterns = patterns.filter(isNegatedWorkspacePattern);
  const positivePatterns = patterns.filter((pattern) => !isNegatedWorkspacePattern(pattern));
  const directories = /* @__PURE__ */ new Set();
  if (await hasPackageJson(config.rootDirectory)) directories.add(config.rootDirectory);
  for (const pattern of positivePatterns)
    for (const directory of await expandSimpleWorkspacePattern(config.rootDirectory, pattern)) {
      if (isExcludedWorkspaceDirectory(config.rootDirectory, directory, negatedPatterns)) continue;
      directories.add(directory);
    }
  return [...directories].sort((first, second) => first.localeCompare(second));
};
const discoverWorkspaces = async (config) => {
  const rootManifest = await readPackageJson(config.rootDirectory);
  const directories = await discoverWorkspaceDirectories(config, rootManifest);
  const workspaces = [];
  for (const directory of directories) {
    const manifest = await readPackageJson(directory);
    if (!manifest) continue;
    const dependencyBuckets = createDependencyBuckets(manifest);
    const dependencyNames = collectDependencyNames(dependencyBuckets);
    const relativeDirectory = toRelativePath(config.rootDirectory, directory) || ".";
    workspaces.push({
      id: workspaces.length,
      name: manifest.name ?? relativeDirectory,
      directory,
      relativeDirectory,
      packageJsonPath: path.join(directory, PACKAGE_JSON_FILENAME),
      manifest,
      dependencyBuckets,
      dependencyNames,
      manifestDependencyNames: collectManifestDependencyNames(manifest, dependencyNames),
      scriptDependencyNames: collectScriptDependencyNames(manifest, dependencyNames),
      typeScriptConfigDependencyNames: await readTypeScriptConfigDependencyNames(directory),
      cssImportDependencyNames: await readCssImportDependencyNames(directory),
      sourceMaps: await readTypeScriptSourceMaps(directory),
    });
  }
  if (workspaces.length > 0) return workspaces;
  const fallbackManifest = rootManifest ?? {};
  const dependencyBuckets = createDependencyBuckets(fallbackManifest);
  const dependencyNames = collectDependencyNames(dependencyBuckets);
  return [
    {
      id: 0,
      name: path.basename(config.rootDirectory),
      directory: config.rootDirectory,
      relativeDirectory: ".",
      packageJsonPath: path.join(config.rootDirectory, PACKAGE_JSON_FILENAME),
      manifest: fallbackManifest,
      dependencyBuckets,
      dependencyNames,
      manifestDependencyNames: collectManifestDependencyNames(fallbackManifest, dependencyNames),
      scriptDependencyNames: collectScriptDependencyNames(fallbackManifest, dependencyNames),
      typeScriptConfigDependencyNames: await readTypeScriptConfigDependencyNames(
        config.rootDirectory,
      ),
      cssImportDependencyNames: await readCssImportDependencyNames(config.rootDirectory),
      sourceMaps: await readTypeScriptSourceMaps(config.rootDirectory),
    },
  ];
};
const findWorkspaceForFile = (workspaces, filePath) => {
  return (
    [...workspaces]
      .sort((first, second) => second.directory.length - first.directory.length)
      .find((workspace) => {
        const relativePath = path.relative(workspace.directory, filePath);
        return (
          relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
        );
      }) ?? workspaces[0]
  );
};
//#endregion
//#region src/core/rules/codebase/analyzer/discovery.ts
const shouldSkipDirectory = (directoryName) => IGNORED_DIRECTORY_NAMES.has(directoryName);
const discoverSourceFilePaths = async (directoryPath, config, signal) => {
  signal?.throwIfAborted();
  let entries;
  try {
    entries = await fs$1.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }
  const filePaths = [];
  for (const entry of entries) {
    signal?.throwIfAborted();
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name))
        filePaths.push(...(await discoverSourceFilePaths(entryPath, config, signal)));
      continue;
    }
    if (entry.isFile() && isSourceFilePath(entryPath)) filePaths.push(entryPath);
  }
  return filePaths;
};
const patternToRegExp = (pattern) => {
  const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`(^|/)${escapedPattern}($|/)`);
};
const matchesAnyPattern = (relativePath, patterns) =>
  patterns.some((pattern) => patternToRegExp(pattern).test(relativePath));
const toExtendedGitignorePatterns = (pattern) => {
  if (pattern === "*" || pattern === "**" || pattern.endsWith("/*")) return [pattern];
  return [pattern, `${pattern}/**`];
};
const toGitignorePattern = (line) => {
  const trimmedLine = line.trim();
  if (!trimmedLine || (trimmedLine.startsWith("#") && !trimmedLine.startsWith("\\#"))) return null;
  const unescapedLine = trimmedLine.replace(/^\\(?=#)/, "");
  const isNegated = unescapedLine.startsWith("!");
  let pattern = isNegated ? unescapedLine.slice(1) : unescapedLine;
  if (!pattern) return null;
  if (pattern.endsWith("/")) pattern = pattern.slice(0, -1);
  if (pattern.startsWith("/")) pattern = pattern.slice(1);
  else if (!pattern.startsWith("**/")) pattern = `**/${pattern}`;
  return {
    pattern,
    isNegated,
  };
};
const readGitignorePatterns = async (rootDirectory) => {
  try {
    return (await fs$1.readFile(path.join(rootDirectory, ".gitignore"), "utf8"))
      .split(/\r?\n/)
      .map(toGitignorePattern)
      .filter((pattern) => Boolean(pattern));
  } catch {
    return [];
  }
};
const isGitignored = (relativePath, patterns) => {
  let isIgnored = false;
  for (const item of patterns)
    if (
      toExtendedGitignorePatterns(item.pattern).some((pattern) =>
        matchesGlob(relativePath, pattern),
      )
    )
      isIgnored = !item.isNegated;
  return isIgnored;
};
const isIncluded = (relativePath, includePaths) =>
  includePaths.some((includePath) => {
    if (includePath === ".") return true;
    return (
      relativePath === includePath || relativePath.startsWith(`${includePath.replace(/\/$/, "")}/`)
    );
  });
const isUnderDirectory$2 = (filePath, directory) => {
  const relativePath = path.relative(directory, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};
const isGeneratedOutputFile = (filePath, workspaces) =>
  workspaces.some((workspace) =>
    workspace.sourceMaps.some(
      (sourceMap) =>
        isUnderDirectory$2(filePath, sourceMap.outputDirectory) &&
        !isUnderDirectory$2(filePath, sourceMap.sourceDirectory),
    ),
  );
const discoverSourceFiles = async (config, workspaces, signal) => {
  const filePathSet = /* @__PURE__ */ new Set();
  const gitignorePatterns = await readGitignorePatterns(config.rootDirectory);
  for (const includePath of config.includePaths) {
    const directoryPath = path.resolve(config.rootDirectory, includePath);
    for (const filePath of await discoverSourceFilePaths(directoryPath, config, signal)) {
      const relativePath = toRelativePath(config.rootDirectory, filePath);
      if (
        isIncluded(relativePath, config.includePaths) &&
        !isGitignored(relativePath, gitignorePatterns) &&
        !isGeneratedOutputFile(filePath, workspaces) &&
        !matchesAnyPattern(relativePath, config.excludePatterns)
      )
        filePathSet.add(filePath);
    }
  }
  const filePaths = [...filePathSet].sort((first, second) => first.localeCompare(second));
  const sourceFiles = [];
  for (const filePath of filePaths) {
    signal?.throwIfAborted();
    const sourceText = await fs$1.readFile(filePath, "utf8");
    const workspace = findWorkspaceForFile(workspaces, filePath);
    sourceFiles.push({
      id: sourceFiles.length,
      filePath,
      relativePath: toRelativePath(config.rootDirectory, filePath),
      extension: path.extname(filePath),
      sourceText,
      workspaceId: workspace.id,
      lineStarts: buildLineStarts(sourceText),
    });
  }
  return sourceFiles;
};
//#endregion
//#region src/core/rules/codebase/analyzer/entrypoints.ts
const toPathLookup = (files) => new Map(files.map((file) => [file.filePath, file]));
const extensionCandidates = (specifier) => {
  if (path.extname(specifier)) return [specifier];
  return [
    specifier,
    ...SOURCE_FILE_EXTENSIONS.map((item) => `${specifier}${item}`),
    ...SOURCE_FILE_EXTENSIONS.map((item) => path.join(specifier, `index${item}`)),
  ];
};
const SOURCE_EXTENSION_CANDIDATES = {
  ".cjs": [".cts", ".cjs", ".ts", ".js"],
  ".js": [".ts", ".tsx", ".js", ".jsx"],
  ".jsx": [".tsx", ".jsx"],
  ".mjs": [".mts", ".mjs", ".ts", ".js"],
};
const isUnderDirectory$1 = (filePath, directory) => {
  const relativePath = path.relative(directory, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};
const toConfiguredSourceMappedPath$1 = (filePath, workspace) => {
  const sourceMap = [...workspace.sourceMaps]
    .sort((first, second) => second.outputDirectory.length - first.outputDirectory.length)
    .find((item) => isUnderDirectory$1(filePath, item.outputDirectory));
  if (!sourceMap) return null;
  return path.join(sourceMap.sourceDirectory, path.relative(sourceMap.outputDirectory, filePath));
};
const toConventionalSourceMappedPath$1 = (filePath) =>
  filePath.includes(`${path.sep}dist${path.sep}`)
    ? filePath.replace(`${path.sep}dist${path.sep}`, `${path.sep}src${path.sep}`)
    : null;
const toSourceMappedPath = (filePath, workspace) =>
  toConfiguredSourceMappedPath$1(filePath, workspace) ?? toConventionalSourceMappedPath$1(filePath);
const toAlternativeSourcePaths = (filePath) => {
  const declarationExtension = TYPESCRIPT_DECLARATION_EXTENSIONS.find((extension) =>
    filePath.endsWith(extension),
  );
  if (declarationExtension) {
    const basePath = filePath.slice(0, -declarationExtension.length);
    return [`${basePath}.mts`, `${basePath}.cts`, `${basePath}.ts`, `${basePath}.tsx`];
  }
  const extension = path.extname(filePath);
  const sourceExtensions = SOURCE_EXTENSION_CANDIDATES[extension];
  if (!sourceExtensions) return [];
  const basePath = filePath.slice(0, -extension.length);
  return sourceExtensions.map((sourceExtension) => `${basePath}${sourceExtension}`);
};
const resolveEntrySpecifier = (config, workspace, filesByPath, specifier) => {
  for (const candidate of extensionCandidates(specifier)) {
    const absolutePath = path.resolve(workspace.directory, candidate);
    const sourceMappedPath = toSourceMappedPath(absolutePath, workspace);
    const candidatePaths = new Set([
      absolutePath,
      ...toAlternativeSourcePaths(absolutePath),
      ...(sourceMappedPath
        ? [sourceMappedPath, ...toAlternativeSourcePaths(sourceMappedPath)]
        : []),
    ]);
    for (const candidatePath of candidatePaths) {
      const file = filesByPath.get(candidatePath);
      if (file) return file;
    }
  }
  const rootRelativePath = path.resolve(config.rootDirectory, specifier);
  return filesByPath.get(rootRelativePath) ?? null;
};
const isConventionalRuntimeEntry = (relativePath) => {
  const fileStem = getFileStem(relativePath);
  const pathParts = relativePath.split("/");
  return (
    (COMMON_ENTRY_STEMS.has(fileStem) &&
      (relativePath.startsWith("src/") || pathParts.length === 1)) ||
    (FRAMEWORK_ROUTE_ENTRY_STEMS.has(fileStem) &&
      (pathParts.includes("app") || pathParts.includes("pages") || pathParts.includes("routes")))
  );
};
const isTestEntry = (relativePath) =>
  TEST_ENTRY_MARKERS.some((marker) => relativePath.includes(marker));
const isSupportEntry = (relativePath) => matchesAnyGlob(relativePath, SUPPORT_ENTRY_PATTERNS);
const hasGlobSyntax = (value) => value.includes("*") || value.includes("{");
const pushEntryPoint = (entryPoints, file, role, source) => {
  if (!file) return;
  if (entryPoints.some((entryPoint) => entryPoint.fileId === file.id && entryPoint.role === role))
    return;
  entryPoints.push({
    fileId: file.id,
    role,
    source,
  });
};
const discoverEntryPoints = (config, workspaces, files, pluginResults) => {
  const filesByPath = toPathLookup(files);
  const entryPoints = [];
  for (const workspace of workspaces) {
    const manifestEntries = collectManifestEntrySpecifiers(workspace.manifest);
    for (const entry of manifestEntries)
      pushEntryPoint(
        entryPoints,
        resolveEntrySpecifier(config, workspace, filesByPath, entry),
        "runtime",
        "package.json",
      );
    for (const entry of collectScriptFileEntryPaths(workspace.manifest))
      pushEntryPoint(
        entryPoints,
        resolveEntrySpecifier(config, workspace, filesByPath, entry),
        "support",
        "script-file",
      );
    const manifestSupportEntries = collectManifestSupportSpecifiers(workspace.manifest);
    for (const entry of manifestSupportEntries.filter(
      (supportEntry) => !hasGlobSyntax(supportEntry),
    ))
      pushEntryPoint(
        entryPoints,
        resolveEntrySpecifier(config, workspace, filesByPath, entry),
        "support",
        "package.json:sideEffects",
      );
    const workspaceFiles = files.filter((file) => file.workspaceId === workspace.id);
    const pluginResult = pluginResults.get(workspace.id);
    for (const file of workspaceFiles) {
      const workspaceRelativePath = toRelativePath(workspace.directory, file.filePath);
      for (const entry of manifestSupportEntries.filter(hasGlobSyntax))
        if (matchesAnyGlob(workspaceRelativePath, [entry.replace(/^\.\//, "")]))
          pushEntryPoint(entryPoints, file, "support", "package.json:sideEffects");
      for (const entryPattern of pluginResult?.entryPatterns ?? [])
        if (matchesAnyGlob(workspaceRelativePath, [entryPattern.pattern]))
          pushEntryPoint(entryPoints, file, entryPattern.role, "plugin");
      if (isConventionalRuntimeEntry(workspaceRelativePath))
        pushEntryPoint(entryPoints, file, "runtime", "convention");
      if (isTestEntry(workspaceRelativePath))
        pushEntryPoint(entryPoints, file, "test", "test-pattern");
      if (isSupportEntry(workspaceRelativePath))
        pushEntryPoint(entryPoints, file, "support", "support-pattern");
      if (pluginResult && matchesAnyGlob(workspaceRelativePath, pluginResult.alwaysUsedPatterns))
        pushEntryPoint(entryPoints, file, "support", "plugin-always-used");
    }
  }
  return entryPoints.sort(
    (first, second) => first.fileId - second.fileId || first.role.localeCompare(second.role),
  );
};
//#endregion
//#region src/core/rules/codebase/analyzer/extract/index.ts
const isIdentifierWithName = (value) =>
  isAstNode(value) && value.type === "Identifier" && typeof value.name === "string";
const getStringLiteralValue = (node) => {
  if (!isAstNode(node)) return null;
  if ((node.type === "Literal" || node.type === "StringLiteral") && typeof node.value === "string")
    return node.value;
  if (node.type === "TemplateLiteral" && Array.isArray(node.quasis) && node.quasis.length === 1) {
    const quasi = node.quasis[0];
    if (isAstNode(quasi) && typeof quasi.value === "object" && quasi.value !== null) {
      const value = quasi.value;
      return typeof value.cooked === "string" ? value.cooked : null;
    }
  }
  return null;
};
const getNodeStart = (node) => {
  if (typeof node.start === "number") return node.start;
  if (Array.isArray(node.range) && typeof node.range[0] === "number") return node.range[0];
  return 0;
};
const getNodeEnd = (node) => {
  if (typeof node.end === "number") return node.end;
  if (Array.isArray(node.range) && typeof node.range[1] === "number") return node.range[1];
  return getNodeStart(node);
};
const collectBindingIdentifierNames = (node) => {
  if (!isAstNode(node)) return [];
  if (isIdentifierWithName(node)) return [node.name];
  if (node.type === "ObjectPattern")
    return (node.properties ?? []).flatMap((property) => {
      if (!isAstNode(property)) return [];
      if (property.type === "Property") return collectBindingIdentifierNames(property.value);
      if (property.type === "RestElement") return collectBindingIdentifierNames(property.argument);
      return [];
    });
  if (node.type === "ArrayPattern")
    return (node.elements ?? []).flatMap(collectBindingIdentifierNames);
  if (node.type === "AssignmentPattern") return collectBindingIdentifierNames(node.left);
  if (node.type === "RestElement") return collectBindingIdentifierNames(node.argument);
  return [];
};
const findNearestScopeEnd = (node) => {
  let currentNode = node.parent;
  while (currentNode) {
    if (
      currentNode.type === "BlockStatement" ||
      currentNode.type === "Program" ||
      currentNode.type === "StaticBlock"
    )
      return getNodeEnd(currentNode);
    currentNode = currentNode.parent;
  }
  return getNodeEnd(node);
};
const addShadowRange = (runtimeEntryLocals, name, range) => {
  const ranges = runtimeEntryLocals.shadowRangesByName.get(name) ?? [];
  ranges.push(range);
  runtimeEntryLocals.shadowRangesByName.set(name, ranges);
};
const isRuntimeLocalShadowed = (runtimeEntryLocals, name, position) =>
  runtimeEntryLocals.shadowRangesByName
    .get(name)
    ?.some((range) => position >= range.start && position <= range.end) ?? false;
const position = (file, start) => getSourcePositionFromLineStarts(file.lineStarts, start);
const getDirectiveValue = (statement) => {
  if (!isAstNode(statement) || statement.type !== "ExpressionStatement") return null;
  return getStringLiteralValue(statement.expression);
};
const collectDirectives = (program) => {
  const directives = /* @__PURE__ */ new Set();
  if (!Array.isArray(program.body)) return directives;
  for (const statement of program.body) {
    const directive = getDirectiveValue(statement);
    if (!directive) break;
    if (directive === "use client" || directive === "use server") directives.add(directive);
  }
  return directives;
};
const toImportedName = (entry) => {
  if (entry.importName.kind === "Default") return "default";
  if (entry.importName.kind === "NamespaceObject") return "*";
  return entry.importName.name ?? entry.localName.value;
};
const toImportedBinding = (entry) => ({
  importedName: toImportedName(entry),
  localName: entry.localName.value,
  isTypeOnly: entry.isType,
  isNamespace: entry.importName.kind === "NamespaceObject",
  start: entry.localName.start,
  end: entry.localName.end,
});
const createImportRecord = (
  file,
  source,
  kind,
  bindings,
  start,
  end,
  isOptional = false,
  context,
  isTypeOnlyOverride,
) => ({
  source,
  bindings,
  kind,
  context,
  isTypeOnly:
    isTypeOnlyOverride ?? (bindings.length > 0 && bindings.every((binding) => binding.isTypeOnly)),
  isSideEffectOnly: bindings.length === 0,
  isOptional,
  start,
  end,
  position: position(file, start),
});
const toPropertyName = (node) => {
  if (!isAstNode(node)) return null;
  if (typeof node.name === "string") return node.name;
  return getStringLiteralValue(node);
};
const toMemberExpressionPath = (node) => {
  if (isIdentifierWithName(node))
    return {
      namespace: node.name,
      memberPath: [],
    };
  if (node.type !== "MemberExpression" || !isAstNode(node.object) || !isAstNode(node.property))
    return null;
  const propertyName = toPropertyName(node.property);
  if (!propertyName) return null;
  const parentPath = toMemberExpressionPath(node.object);
  if (!parentPath) return null;
  return {
    namespace: parentPath.namespace,
    memberPath: [...parentPath.memberPath, propertyName],
  };
};
const toQualifiedNamePath = (node) => {
  if (isIdentifierWithName(node))
    return {
      namespace: node.name,
      memberPath: [],
    };
  if (node.type !== "TSQualifiedName" || !isAstNode(node.left) || !isIdentifierWithName(node.right))
    return null;
  const parentPath = toQualifiedNamePath(node.left);
  if (!parentPath) return null;
  return {
    namespace: parentPath.namespace,
    memberPath: [...parentPath.memberPath, node.right.name],
  };
};
const toRequireBinding = (property) => {
  const importedName = toPropertyName(property.key);
  if (!importedName) return null;
  const value = isAstNode(property.value) ? property.value : property.key;
  if (isIdentifierWithName(value))
    return {
      importedName,
      localName: value.name,
      isTypeOnly: false,
      isNamespace: false,
      start: getNodeStart(value),
      end: getNodeEnd(value),
    };
  if (isAstNode(value) && value.type === "AssignmentPattern" && isIdentifierWithName(value.left))
    return {
      importedName,
      localName: value.left.name,
      isTypeOnly: false,
      isNamespace: false,
      start: getNodeStart(value.left),
      end: getNodeEnd(value.left),
    };
  return null;
};
const collectObjectPatternRequireBindings = (pattern) => {
  if (!Array.isArray(pattern.properties)) return [];
  return pattern.properties
    .filter((property) => isAstNode(property) && property.type === "Property")
    .map(toRequireBinding)
    .filter((binding) => Boolean(binding));
};
const collectRequireBindings = (requireCall) => {
  const parent = requireCall.parent;
  if (!parent) return [];
  if (
    parent.type === "MemberExpression" &&
    parent.object === requireCall &&
    isAstNode(parent.property)
  ) {
    const grandparent = parent.parent;
    const importedName = toPropertyName(parent.property);
    if (
      importedName &&
      grandparent?.type === "VariableDeclarator" &&
      grandparent.init === parent &&
      isIdentifierWithName(grandparent.id)
    )
      return [
        {
          importedName,
          localName: grandparent.id.name,
          isTypeOnly: false,
          isNamespace: false,
          start: getNodeStart(grandparent.id),
          end: getNodeEnd(grandparent.id),
        },
      ];
  }
  if (parent.type !== "VariableDeclarator" || parent.init !== requireCall || !isAstNode(parent.id))
    return [];
  if (isIdentifierWithName(parent.id))
    return [
      {
        importedName: "*",
        localName: parent.id.name,
        isTypeOnly: false,
        isNamespace: true,
        start: getNodeStart(parent.id),
        end: getNodeEnd(parent.id),
      },
    ];
  if (parent.id.type === "ObjectPattern") return collectObjectPatternRequireBindings(parent.id);
  return [];
};
const getImportUseExpression = (importCall) => {
  let expression = importCall;
  let parent = expression.parent;
  if (isAstNode(parent) && parent.type === "AwaitExpression" && parent.argument === expression) {
    expression = parent;
    parent = expression.parent;
  }
  while (
    isAstNode(parent) &&
    (parent.type === "ParenthesizedExpression" || parent.type === "ChainExpression") &&
    parent.expression === expression
  ) {
    expression = parent;
    parent = expression.parent;
  }
  return expression;
};
const toDynamicImportThenBinding = (importedName, localName, node) => ({
  importedName,
  localName,
  isTypeOnly: false,
  isNamespace: false,
  start: getNodeStart(node),
  end: getNodeEnd(node),
});
const collectDynamicImportThenBindings = (importUseExpression) => {
  const thenMemberExpression = importUseExpression.parent;
  if (
    !isAstNode(thenMemberExpression) ||
    thenMemberExpression.type !== "MemberExpression" ||
    thenMemberExpression.object !== importUseExpression ||
    !isIdentifierWithName(thenMemberExpression.property) ||
    thenMemberExpression.property.name !== "then"
  )
    return [];
  const thenCallExpression = thenMemberExpression.parent;
  if (
    !isAstNode(thenCallExpression) ||
    thenCallExpression.type !== "CallExpression" ||
    thenCallExpression.callee !== thenMemberExpression ||
    !Array.isArray(thenCallExpression.arguments)
  )
    return [];
  const callback = thenCallExpression.arguments[0];
  if (
    !isAstNode(callback) ||
    (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression") ||
    !Array.isArray(callback.params)
  )
    return [];
  const moduleParameter = callback.params[0];
  if (!isAstNode(moduleParameter)) return [];
  if (moduleParameter.type === "ObjectPattern")
    return collectObjectPatternRequireBindings(moduleParameter);
  if (!isIdentifierWithName(moduleParameter) || !isAstNode(callback.body)) return [];
  const importedNamesByName = /* @__PURE__ */ new Map();
  walkAst(callback.body, (node) => {
    if (node.type !== "MemberExpression") return;
    const memberExpressionPath = toMemberExpressionPath(node);
    if (
      !memberExpressionPath ||
      memberExpressionPath.namespace !== moduleParameter.name ||
      memberExpressionPath.memberPath.length === 0
    )
      return;
    const importedName = memberExpressionPath.memberPath[0];
    if (importedName && !importedNamesByName.has(importedName))
      importedNamesByName.set(
        importedName,
        toDynamicImportThenBinding(importedName, moduleParameter.name, node),
      );
  });
  return [...importedNamesByName.values()];
};
const isPromiseAllCall = (node) =>
  node.type === "CallExpression" &&
  isAstNode(node.callee) &&
  node.callee.type === "MemberExpression" &&
  isIdentifierWithName(node.callee.object) &&
  node.callee.object.name === "Promise" &&
  isIdentifierWithName(node.callee.property) &&
  node.callee.property.name === "all";
const collectDynamicImportPromiseAllBindings = (importUseExpression) => {
  const importElements = importUseExpression.parent;
  if (!isAstNode(importElements) || importElements.type !== "ArrayExpression") return [];
  const promiseAllCall = importElements.parent;
  if (!isAstNode(promiseAllCall) || !isPromiseAllCall(promiseAllCall)) return [];
  const awaitExpression = promiseAllCall.parent;
  if (
    !isAstNode(awaitExpression) ||
    awaitExpression.type !== "AwaitExpression" ||
    awaitExpression.argument !== promiseAllCall
  )
    return [];
  const declarator = awaitExpression.parent;
  if (
    !isAstNode(declarator) ||
    declarator.type !== "VariableDeclarator" ||
    declarator.init !== awaitExpression ||
    !isAstNode(declarator.id) ||
    declarator.id.type !== "ArrayPattern" ||
    !Array.isArray(importElements.elements) ||
    !Array.isArray(declarator.id.elements)
  )
    return [];
  const importIndex = importElements.elements.findIndex(
    (element) => element === importUseExpression,
  );
  const bindingElement = declarator.id.elements[importIndex];
  if (!isAstNode(bindingElement)) return [];
  if (bindingElement.type === "ObjectPattern")
    return collectObjectPatternRequireBindings(bindingElement);
  if (isIdentifierWithName(bindingElement))
    return [
      {
        importedName: "*",
        localName: bindingElement.name,
        isTypeOnly: false,
        isNamespace: true,
        start: getNodeStart(bindingElement),
        end: getNodeEnd(bindingElement),
      },
    ];
  return [];
};
const collectDynamicImportBindings = (importCall) => {
  const importUseExpression = getImportUseExpression(importCall);
  const thenBindings = collectDynamicImportThenBindings(importUseExpression);
  if (thenBindings.length > 0) return thenBindings;
  const promiseAllBindings = collectDynamicImportPromiseAllBindings(importUseExpression);
  if (promiseAllBindings.length > 0) return promiseAllBindings;
  const parent = importUseExpression.parent;
  if (!parent) return [];
  if (
    parent.type === "MemberExpression" &&
    parent.object === importUseExpression &&
    isAstNode(parent.property)
  ) {
    const importedName = toPropertyName(parent.property);
    if (!importedName) return [];
    return [
      {
        importedName,
        localName: importedName,
        isTypeOnly: false,
        isNamespace: false,
        start: getNodeStart(parent.property),
        end: getNodeEnd(parent.property),
      },
    ];
  }
  if (
    parent.type !== "VariableDeclarator" ||
    parent.init !== importUseExpression ||
    !isAstNode(parent.id)
  )
    return [];
  if (isIdentifierWithName(parent.id))
    return [
      {
        importedName: "*",
        localName: parent.id.name,
        isTypeOnly: false,
        isNamespace: true,
        start: getNodeStart(parent.id),
        end: getNodeEnd(parent.id),
      },
    ];
  if (parent.id.type === "ObjectPattern") return collectObjectPatternRequireBindings(parent.id);
  return [];
};
const getStringArrayLiteralValues = (node) => {
  const stringValue = getStringLiteralValue(node);
  if (stringValue) return [stringValue];
  if (!isAstNode(node) || node.type !== "ArrayExpression" || !Array.isArray(node.elements))
    return [];
  return node.elements.map(getStringLiteralValue).filter((value) => Boolean(value));
};
const getTemplateGlobValue = (node) => {
  if (!isAstNode(node) || node.type !== "TemplateLiteral" || !Array.isArray(node.quasis))
    return null;
  const parts = node.quasis.map((quasi) => {
    if (!isAstNode(quasi) || typeof quasi.value !== "object" || quasi.value === null) return "";
    const value = quasi.value;
    return typeof value.cooked === "string" ? value.cooked : "";
  });
  if (parts.length < 2) return null;
  return parts.reduce((pattern, part, index) => `${pattern}${index > 0 ? "*" : ""}${part}`, "");
};
const getStringConcatenationGlobValue = (node) => {
  if (!isAstNode(node)) return null;
  const literalValue = getStringLiteralValue(node);
  if (literalValue !== null) return literalValue;
  if (node.type !== "BinaryExpression" || node.operator !== "+") return "*";
  const leftValue = getStringConcatenationGlobValue(node.left);
  const rightValue = getStringConcatenationGlobValue(node.right);
  if (leftValue === null || rightValue === null) return null;
  return `${leftValue}${rightValue}`;
};
const getDynamicImportGlobValue = (node) => {
  const templatePattern = getTemplateGlobValue(node);
  if (templatePattern) return templatePattern;
  const concatenationPattern = getStringConcatenationGlobValue(node);
  if (!concatenationPattern || !concatenationPattern.includes("*")) return null;
  return concatenationPattern;
};
const getBooleanLiteralValue = (node) => {
  if (!isAstNode(node) || node.type !== "Literal" || typeof node.value !== "boolean") return null;
  return node.value;
};
const getRegexLiteral = (node) => {
  if (!isAstNode(node) || node.type !== "Literal") return {};
  const regex = node.regex;
  if (!regex || typeof regex !== "object") return {};
  return {
    regexPattern: "pattern" in regex && typeof regex.pattern === "string" ? regex.pattern : void 0,
    regexFlags: "flags" in regex && typeof regex.flags === "string" ? regex.flags : void 0,
  };
};
const isImportMetaGlobCall = (node) => {
  if (node.type !== "CallExpression" || !isAstNode(node.callee)) return false;
  const callee = node.callee;
  if (
    callee.type !== "MemberExpression" ||
    callee.computed === true ||
    !isAstNode(callee.object) ||
    !isAstNode(callee.property)
  )
    return false;
  return (
    callee.object.type === "MetaProperty" &&
    isIdentifierWithName(callee.property) &&
    callee.property.name === "glob"
  );
};
const isRequireContextCall = (node) => {
  if (node.type !== "CallExpression" || !isAstNode(node.callee)) return false;
  const callee = node.callee;
  return (
    callee.type === "MemberExpression" &&
    callee.computed !== true &&
    isIdentifierWithName(callee.object) &&
    callee.object.name === "require" &&
    isIdentifierWithName(callee.property) &&
    callee.property.name === "context"
  );
};
const collectContextImportRecords = (file, node) => {
  if (!Array.isArray(node.arguments)) return [];
  if (isImportMetaGlobCall(node))
    return getStringArrayLiteralValues(node.arguments[0]).map((source) =>
      createImportRecord(file, source, "context", [], getNodeStart(node), getNodeEnd(node), false, {
        kind: "glob",
      }),
    );
  if (!isRequireContextCall(node)) return [];
  const source = getStringLiteralValue(node.arguments[0]);
  if (!source) return [];
  const recursive = getBooleanLiteralValue(node.arguments[1]) ?? true;
  return [
    createImportRecord(file, source, "context", [], getNodeStart(node), getNodeEnd(node), false, {
      kind: "require-context",
      recursive,
      ...getRegexLiteral(node.arguments[2]),
    }),
  ];
};
const createDynamicImportRecord = (file, node, sourceNode) => {
  const source = getStringLiteralValue(sourceNode);
  if (source)
    return createImportRecord(
      file,
      source,
      "dynamic",
      collectDynamicImportBindings(node),
      getNodeStart(node),
      getNodeEnd(node),
    );
  const templatePattern = getDynamicImportGlobValue(sourceNode);
  if (!templatePattern) return null;
  return createImportRecord(
    file,
    templatePattern,
    "context",
    [],
    getNodeStart(node),
    getNodeEnd(node),
    false,
    { kind: "glob" },
  );
};
const toStaticImportRecord = (file, staticImport) =>
  createImportRecord(
    file,
    staticImport.moduleRequest.value,
    "static",
    staticImport.entries.map(toImportedBinding),
    staticImport.start,
    staticImport.end,
  );
const toExportedName = (entry) => {
  if (entry.exportName.kind === "Default") return "default";
  if (entry.exportName.kind === "None") return "*";
  return entry.exportName.name ?? "*";
};
const toLocalName = (entry) => {
  if (entry.localName.kind === "Default") return "default";
  return entry.localName.name;
};
const getExportKind = (entry) => {
  if (entry.isType) return "type";
  return "unknown";
};
const isReactComponentLikeName = (name) => {
  const firstCharacter = name.at(0);
  return Boolean(firstCharacter && firstCharacter.toUpperCase() === firstCharacter);
};
const collectJSDocTags = (comments, exportStart) => {
  const precedingComment = [...comments]
    .filter((comment) => comment.end <= exportStart)
    .sort((first, second) => second.end - first.end)[0];
  if (!precedingComment || exportStart - precedingComment.end > 8) return /* @__PURE__ */ new Set();
  const tags = [
    ...[...precedingComment.value.matchAll(/@([a-zA-Z][\w-]*)/g)].map((match) => match[1]),
    ...[...precedingComment.value.matchAll(/@api\s+([a-zA-Z][\w-]*)/g)].map((match) => match[1]),
  ].filter((tag) => Boolean(tag));
  return new Set(tags);
};
const toCommentImportedBinding = (importedName, start, end) => ({
  importedName,
  localName: importedName,
  isTypeOnly: true,
  isNamespace: false,
  start,
  end,
});
const collectCommentImportRecords = (file, comments) => {
  const imports = [];
  for (const comment of comments) {
    for (const match of comment.value.matchAll(/<reference\s+path=["']([^"']+)["']/g)) {
      const source = match[1];
      if (!source) continue;
      imports.push(
        createImportRecord(
          file,
          source,
          "comment",
          [],
          comment.start,
          comment.end,
          false,
          void 0,
          true,
        ),
      );
    }
    for (const match of comment.value.matchAll(
      /import\(\s*["']([^"']+)["']\s*\)(?:\s*\.\s*([A-Za-z_$][\w$]*))?/g,
    )) {
      const source = match[1];
      if (!source) continue;
      const importedName = match[2];
      imports.push(
        createImportRecord(
          file,
          source,
          "comment",
          importedName ? [toCommentImportedBinding(importedName, comment.start, comment.end)] : [],
          comment.start,
          comment.end,
          false,
          void 0,
          true,
        ),
      );
    }
    for (const match of comment.value.matchAll(/@import\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g)) {
      const source = match[1];
      if (!source) continue;
      imports.push(
        createImportRecord(
          file,
          source,
          "comment",
          [],
          comment.start,
          comment.end,
          false,
          void 0,
          true,
        ),
      );
    }
  }
  return imports;
};
const toExportRecord = (file, entry, comments) => {
  const exportedName = toExportedName(entry);
  return {
    exportedName,
    localName: toLocalName(entry),
    source: entry.moduleRequest?.value ?? null,
    importedName: entry.importName.name ?? (entry.importName.kind === "AllButDefault" ? "*" : null),
    symbolKind: getExportKind(entry),
    isTypeOnly: entry.isType,
    isReExport: Boolean(entry.moduleRequest),
    isCommonJs: false,
    isNamespace: entry.importName.kind === "All" || entry.importName.kind === "AllButDefault",
    isReactComponentLike: isReactComponentLikeName(exportedName),
    jsDocTags: collectJSDocTags(comments, entry.start),
    members: [],
    hasLocalReferences: false,
    start: entry.start,
    end: entry.end,
    position: position(file, entry.start),
  };
};
const toReExportImportRecord = (file, entry) => {
  const source = entry.moduleRequest?.value;
  if (!source) return null;
  const exportedName = toExportedName(entry);
  return createImportRecord(
    file,
    source,
    "re-export",
    [
      {
        importedName: entry.importName.name ?? exportedName,
        localName: exportedName,
        isTypeOnly: entry.isType,
        isNamespace: entry.importName.kind === "All" || entry.importName.kind === "AllButDefault",
        start: entry.start,
        end: entry.end,
      },
    ],
    entry.start,
    entry.end,
  );
};
const isIdentifierDeclaration = (node) => {
  const parent = node.parent;
  if (!parent) return false;
  if (parent.type === "VariableDeclarator" && parent.id === node) return true;
  if (
    (parent.type === "FunctionDeclaration" || parent.type === "ClassDeclaration") &&
    parent.id === node
  )
    return true;
  if (
    (parent.type === "TSTypeAliasDeclaration" || parent.type === "TSInterfaceDeclaration") &&
    parent.id === node
  )
    return true;
  if (parent.type === "MemberExpression" && parent.property === node && parent.computed !== true)
    return true;
  if (
    parent.type === "ImportSpecifier" ||
    parent.type === "ImportDefaultSpecifier" ||
    parent.type === "ImportNamespaceSpecifier"
  )
    return true;
  if (parent.type === "ExportSpecifier") return true;
  return false;
};
const isExportedVariableDeclarator = (node) =>
  node.parent?.type === "VariableDeclaration" &&
  node.parent.parent?.type === "ExportNamedDeclaration";
const collectObjectNamespaceAliases = (node) => {
  if (
    node.type !== "VariableDeclarator" ||
    !isExportedVariableDeclarator(node) ||
    !isIdentifierWithName(node.id) ||
    !isAstNode(node.init) ||
    node.init.type !== "ObjectExpression" ||
    !Array.isArray(node.init.properties)
  )
    return [];
  return node.init.properties.flatMap((property) => {
    if (!isAstNode(property) || property.type !== "Property") return [];
    const propertyName = toPropertyName(property.key);
    const value = isAstNode(property.value) ? property.value : property.key;
    if (!propertyName || !isIdentifierWithName(value)) return [];
    return [
      {
        exportName: node.id.name,
        propertyName,
        namespaceLocalName: value.name,
      },
    ];
  });
};
const collectNamespaceLocalAliases = (node) => {
  if (node.type !== "VariableDeclarator" || !isIdentifierWithName(node.id) || !isAstNode(node.init))
    return [];
  if (isIdentifierWithName(node.init))
    return [
      {
        aliasName: node.id.name,
        namespaceLocalName: node.init.name,
      },
    ];
  if (
    node.init.type === "ConditionalExpression" &&
    isIdentifierWithName(node.init.consequent) &&
    isIdentifierWithName(node.init.alternate)
  )
    return [
      {
        aliasName: node.id.name,
        namespaceLocalName: node.init.consequent.name,
      },
      {
        aliasName: node.id.name,
        namespaceLocalName: node.init.alternate.name,
      },
    ];
  if (node.init.type === "ObjectExpression" && Array.isArray(node.init.properties))
    return node.init.properties.flatMap((property) => {
      if (
        !isAstNode(property) ||
        property.type !== "SpreadElement" ||
        !isIdentifierWithName(property.argument)
      )
        return [];
      return [
        {
          aliasName: node.id.name,
          namespaceLocalName: property.argument.name,
        },
      ];
    });
  return [];
};
const collectNamespaceLocalObjectAliases = (node) => {
  if (
    node.type !== "VariableDeclarator" ||
    !isIdentifierWithName(node.id) ||
    !isAstNode(node.init) ||
    node.init.type !== "ObjectExpression" ||
    !Array.isArray(node.init.properties)
  )
    return [];
  return node.init.properties.flatMap((property) => {
    if (!isAstNode(property) || property.type !== "Property") return [];
    const propertyName = toPropertyName(property.key);
    const value = isAstNode(property.value) ? property.value : property.key;
    if (!propertyName || !isIdentifierWithName(value)) return [];
    return [
      {
        objectLocalName: node.id.name,
        propertyName,
        namespaceLocalName: value.name,
      },
    ];
  });
};
const collectDestructuredNamespaceReferences = (node) => {
  if (
    node.type !== "VariableDeclarator" ||
    !isAstNode(node.id) ||
    node.id.type !== "ObjectPattern" ||
    !isAstNode(node.init) ||
    !Array.isArray(node.id.properties)
  )
    return [];
  const initPath = toMemberExpressionPath(node.init);
  if (!initPath) return [];
  return node.id.properties.flatMap((property) => {
    if (!isAstNode(property) || property.type !== "Property") return [];
    const propertyName = toPropertyName(property.key);
    if (!propertyName) return [];
    return [
      {
        namespace: initPath.namespace,
        memberName: propertyName,
        memberPath: [...initPath.memberPath, propertyName],
      },
    ];
  });
};
const collectObjectExportNames = (node) => {
  if (!isAstNode(node) || node.type !== "ObjectExpression" || !Array.isArray(node.properties))
    return [];
  return node.properties.flatMap((property) => {
    if (!isAstNode(property) || property.type !== "Property") return [];
    const propertyName = toPropertyName(property.key);
    return propertyName ? [propertyName] : [];
  });
};
const getRequireCallSource = (node) => {
  if (
    !isAstNode(node) ||
    node.type !== "CallExpression" ||
    !isIdentifierWithName(node.callee) ||
    node.callee.name !== "require" ||
    !Array.isArray(node.arguments)
  )
    return null;
  return getStringLiteralValue(node.arguments[0]);
};
const createRuntimeEntryLocals = () => ({
  childProcessMethodNames: /* @__PURE__ */ new Set(),
  childProcessNamespaceNames: /* @__PURE__ */ new Set(),
  nodeModuleNamespaceNames: /* @__PURE__ */ new Set(),
  nodeModuleRegisterNames: /* @__PURE__ */ new Set(),
  pathHelperMethodNames: /* @__PURE__ */ new Map(),
  pathNamespaceNames: /* @__PURE__ */ new Set(),
  shadowRangesByName: /* @__PURE__ */ new Map(),
  workerThreadConstructorNames: /* @__PURE__ */ new Set(),
  workerThreadNamespaceNames: /* @__PURE__ */ new Set(),
});
const addRuntimeImportDeclarationLocals = (node, runtimeEntryLocals) => {
  if (node.type !== "ImportDeclaration" || !Array.isArray(node.specifiers)) return;
  const source = getStringLiteralValue(node.source);
  if (!source) return;
  for (const specifier of node.specifiers) {
    if (!isAstNode(specifier) || !isIdentifierWithName(specifier.local)) continue;
    if (CHILD_PROCESS_MODULE_SPECIFIERS.has(source)) {
      if (specifier.type === "ImportNamespaceSpecifier")
        runtimeEntryLocals.childProcessNamespaceNames.add(specifier.local.name);
      else if (specifier.type === "ImportSpecifier") {
        const importedName = toPropertyName(specifier.imported);
        if (importedName && CHILD_PROCESS_ENTRY_METHODS.has(importedName))
          runtimeEntryLocals.childProcessMethodNames.add(specifier.local.name);
      }
    }
    if (NODE_MODULE_SPECIFIERS.has(source)) {
      if (specifier.type === "ImportNamespaceSpecifier")
        runtimeEntryLocals.nodeModuleNamespaceNames.add(specifier.local.name);
      else if (specifier.type === "ImportSpecifier") {
        if (toPropertyName(specifier.imported) === "register")
          runtimeEntryLocals.nodeModuleRegisterNames.add(specifier.local.name);
      }
    }
    if (PATH_MODULE_SPECIFIERS.has(source)) {
      if (
        specifier.type === "ImportNamespaceSpecifier" ||
        specifier.type === "ImportDefaultSpecifier"
      )
        runtimeEntryLocals.pathNamespaceNames.add(specifier.local.name);
      else if (specifier.type === "ImportSpecifier") {
        const importedName = toPropertyName(specifier.imported);
        if (importedName && PATH_ENTRY_HELPER_METHODS.has(importedName))
          runtimeEntryLocals.pathHelperMethodNames.set(specifier.local.name, importedName);
      }
    }
    if (WORKER_THREADS_MODULE_SPECIFIERS.has(source)) {
      if (specifier.type === "ImportNamespaceSpecifier")
        runtimeEntryLocals.workerThreadNamespaceNames.add(specifier.local.name);
      else if (specifier.type === "ImportSpecifier") {
        if (toPropertyName(specifier.imported) === "Worker")
          runtimeEntryLocals.workerThreadConstructorNames.add(specifier.local.name);
      }
    }
  }
};
const addRuntimeRequireLocals = (node, runtimeEntryLocals) => {
  if (node.type !== "VariableDeclarator" || !isAstNode(node.id) || !isAstNode(node.init)) return;
  const source = getRequireCallSource(node.init);
  if (!source) return;
  if (isIdentifierWithName(node.id)) {
    if (CHILD_PROCESS_MODULE_SPECIFIERS.has(source))
      runtimeEntryLocals.childProcessNamespaceNames.add(node.id.name);
    if (NODE_MODULE_SPECIFIERS.has(source))
      runtimeEntryLocals.nodeModuleNamespaceNames.add(node.id.name);
    if (PATH_MODULE_SPECIFIERS.has(source)) runtimeEntryLocals.pathNamespaceNames.add(node.id.name);
    if (WORKER_THREADS_MODULE_SPECIFIERS.has(source))
      runtimeEntryLocals.workerThreadNamespaceNames.add(node.id.name);
    return;
  }
  if (node.id.type !== "ObjectPattern") return;
  for (const binding of collectObjectPatternRequireBindings(node.id)) {
    if (
      CHILD_PROCESS_MODULE_SPECIFIERS.has(source) &&
      CHILD_PROCESS_ENTRY_METHODS.has(binding.importedName)
    )
      runtimeEntryLocals.childProcessMethodNames.add(binding.localName);
    if (NODE_MODULE_SPECIFIERS.has(source) && binding.importedName === "register")
      runtimeEntryLocals.nodeModuleRegisterNames.add(binding.localName);
    if (PATH_MODULE_SPECIFIERS.has(source) && PATH_ENTRY_HELPER_METHODS.has(binding.importedName))
      runtimeEntryLocals.pathHelperMethodNames.set(binding.localName, binding.importedName);
    if (WORKER_THREADS_MODULE_SPECIFIERS.has(source) && binding.importedName === "Worker")
      runtimeEntryLocals.workerThreadConstructorNames.add(binding.localName);
  }
};
const getRuntimeRequireBindingNames = (node) => {
  const bindingNames = /* @__PURE__ */ new Set();
  if (node.type !== "VariableDeclarator" || !isAstNode(node.id) || !isAstNode(node.init))
    return bindingNames;
  const source = getRequireCallSource(node.init);
  if (
    !source ||
    (!CHILD_PROCESS_MODULE_SPECIFIERS.has(source) &&
      !NODE_MODULE_SPECIFIERS.has(source) &&
      !PATH_MODULE_SPECIFIERS.has(source) &&
      !WORKER_THREADS_MODULE_SPECIFIERS.has(source))
  )
    return bindingNames;
  for (const bindingName of collectBindingIdentifierNames(node.id)) bindingNames.add(bindingName);
  return bindingNames;
};
const addRuntimeShadowRanges = (node, runtimeEntryLocals) => {
  if (
    (node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression") &&
    isAstNode(node.body)
  ) {
    const range = {
      start: getNodeStart(node.body),
      end: getNodeEnd(node.body),
    };
    for (const bindingName of (node.params ?? []).flatMap(collectBindingIdentifierNames))
      addShadowRange(runtimeEntryLocals, bindingName, range);
    if (
      (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") &&
      isIdentifierWithName(node.id)
    )
      addShadowRange(runtimeEntryLocals, node.id.name, range);
    return;
  }
  if (node.type === "VariableDeclarator" && isAstNode(node.id)) {
    const runtimeRequireBindingNames = getRuntimeRequireBindingNames(node);
    const range = {
      start: getNodeStart(node),
      end: findNearestScopeEnd(node),
    };
    for (const bindingName of collectBindingIdentifierNames(node.id))
      if (!runtimeRequireBindingNames.has(bindingName))
        addShadowRange(runtimeEntryLocals, bindingName, range);
    return;
  }
  if (node.type === "CatchClause" && isAstNode(node.param) && isAstNode(node.body)) {
    const range = {
      start: getNodeStart(node.body),
      end: getNodeEnd(node.body),
    };
    for (const bindingName of collectBindingIdentifierNames(node.param))
      addShadowRange(runtimeEntryLocals, bindingName, range);
  }
};
const getInlineDirnamePath = (node, runtimeEntryLocals) => {
  if (
    !isAstNode(node) ||
    node.type !== "CallExpression" ||
    !isAstNode(node.callee) ||
    !Array.isArray(node.arguments) ||
    node.arguments.length < 2
  )
    return null;
  let helperName = null;
  if (
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    runtimeEntryLocals.pathNamespaceNames.has(node.callee.object.name) &&
    !isRuntimeLocalShadowed(
      runtimeEntryLocals,
      node.callee.object.name,
      getNodeStart(node.callee.object),
    ) &&
    isIdentifierWithName(node.callee.property) &&
    PATH_ENTRY_HELPER_METHODS.has(node.callee.property.name)
  )
    helperName = node.callee.property.name;
  else if (
    isIdentifierWithName(node.callee) &&
    !isRuntimeLocalShadowed(runtimeEntryLocals, node.callee.name, getNodeStart(node.callee))
  )
    helperName = runtimeEntryLocals.pathHelperMethodNames.get(node.callee.name) ?? null;
  if (!helperName) return null;
  const firstArgument = node.arguments[0];
  if (!isIdentifierWithName(firstArgument) || firstArgument.name !== "__dirname") return null;
  const pathParts = node.arguments.slice(1).map(getStringLiteralValue);
  if (pathParts.some((pathPart) => pathPart === null)) return null;
  const joinedPath = pathParts.join("/").replace(/\/+/g, "/");
  return joinedPath.startsWith(".") || joinedPath.startsWith("/") ? joinedPath : `./${joinedPath}`;
};
const isImportMetaUrlExpression = (node) =>
  isAstNode(node) &&
  node.type === "MemberExpression" &&
  isAstNode(node.object) &&
  node.object.type === "MetaProperty" &&
  isIdentifierWithName(node.property) &&
  node.property.name === "url";
const createEntryImportRecord = (file, sourceNode) => {
  if (!isAstNode(sourceNode)) return null;
  const source = getStringLiteralValue(sourceNode);
  if (!source) return null;
  return createImportRecord(
    file,
    source,
    "require-resolve",
    [],
    getNodeStart(sourceNode),
    getNodeEnd(sourceNode),
  );
};
const collectResolverEntryImportRecords = (file, node, runtimeEntryLocals) => {
  if (node.type !== "CallExpression" || !isAstNode(node.callee) || !Array.isArray(node.arguments))
    return [];
  const firstArgument = node.arguments[0];
  if (
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    node.callee.object.name === "require" &&
    !isRuntimeLocalShadowed(runtimeEntryLocals, "require", getNodeStart(node.callee.object)) &&
    isIdentifierWithName(node.callee.property) &&
    node.callee.property.name === "resolve"
  ) {
    const importRecord = createEntryImportRecord(file, firstArgument);
    return importRecord ? [importRecord] : [];
  }
  if (
    node.callee.type === "MemberExpression" &&
    isAstNode(node.callee.object) &&
    node.callee.object.type === "MetaProperty" &&
    isIdentifierWithName(node.callee.property) &&
    node.callee.property.name === "resolve"
  ) {
    const importRecord = createEntryImportRecord(file, firstArgument);
    return importRecord ? [importRecord] : [];
  }
  let isNodeModuleRegisterCall = false;
  if (
    isIdentifierWithName(node.callee) &&
    runtimeEntryLocals.nodeModuleRegisterNames.has(node.callee.name) &&
    !isRuntimeLocalShadowed(runtimeEntryLocals, node.callee.name, getNodeStart(node.callee))
  )
    isNodeModuleRegisterCall = true;
  else if (
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    runtimeEntryLocals.nodeModuleNamespaceNames.has(node.callee.object.name) &&
    !isRuntimeLocalShadowed(
      runtimeEntryLocals,
      node.callee.object.name,
      getNodeStart(node.callee.object),
    ) &&
    isIdentifierWithName(node.callee.property) &&
    node.callee.property.name === "register"
  )
    isNodeModuleRegisterCall = true;
  if (!isNodeModuleRegisterCall) return [];
  const source = getStringLiteralValue(firstArgument);
  const secondArgument = node.arguments[1];
  if (!source || (source.startsWith(".") && !isImportMetaUrlExpression(secondArgument))) return [];
  const importRecord = createEntryImportRecord(file, firstArgument);
  return importRecord ? [importRecord] : [];
};
const collectRuntimeEntryImportRecords = (file, node, runtimeEntryLocals) => {
  if (node.type !== "CallExpression" || !isAstNode(node.callee) || !Array.isArray(node.arguments))
    return [];
  let isChildProcessEntryCall = false;
  if (
    isIdentifierWithName(node.callee) &&
    runtimeEntryLocals.childProcessMethodNames.has(node.callee.name) &&
    !isRuntimeLocalShadowed(runtimeEntryLocals, node.callee.name, getNodeStart(node.callee))
  )
    isChildProcessEntryCall = true;
  else if (
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    runtimeEntryLocals.childProcessNamespaceNames.has(node.callee.object.name) &&
    !isRuntimeLocalShadowed(
      runtimeEntryLocals,
      node.callee.object.name,
      getNodeStart(node.callee.object),
    ) &&
    isIdentifierWithName(node.callee.property) &&
    CHILD_PROCESS_ENTRY_METHODS.has(node.callee.property.name)
  )
    isChildProcessEntryCall = true;
  if (!isChildProcessEntryCall) return [];
  const source = getInlineDirnamePath(node.arguments[0], runtimeEntryLocals);
  if (!source) return [];
  return [
    createImportRecord(
      file,
      source,
      "require-resolve",
      [],
      getNodeStart(node.arguments[0]),
      getNodeEnd(node.arguments[0]),
    ),
  ];
};
const collectWorkerThreadEntryImportRecords = (file, node, runtimeEntryLocals) => {
  if (node.type !== "NewExpression" || !isAstNode(node.callee) || !Array.isArray(node.arguments))
    return [];
  let isWorkerThreadConstructor = false;
  if (
    isIdentifierWithName(node.callee) &&
    runtimeEntryLocals.workerThreadConstructorNames.has(node.callee.name) &&
    !isRuntimeLocalShadowed(runtimeEntryLocals, node.callee.name, getNodeStart(node.callee))
  )
    isWorkerThreadConstructor = true;
  else if (
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    runtimeEntryLocals.workerThreadNamespaceNames.has(node.callee.object.name) &&
    !isRuntimeLocalShadowed(
      runtimeEntryLocals,
      node.callee.object.name,
      getNodeStart(node.callee.object),
    ) &&
    isIdentifierWithName(node.callee.property) &&
    node.callee.property.name === "Worker"
  )
    isWorkerThreadConstructor = true;
  if (!isWorkerThreadConstructor) return [];
  const source = getInlineDirnamePath(node.arguments[0], runtimeEntryLocals);
  if (!source) return [];
  return [
    createImportRecord(
      file,
      source,
      "require-resolve",
      [],
      getNodeStart(node.arguments[0]),
      getNodeEnd(node.arguments[0]),
    ),
  ];
};
const collectRequireSpreadSources = (node) => {
  if (!isAstNode(node) || node.type !== "ObjectExpression" || !Array.isArray(node.properties))
    return [];
  return node.properties.flatMap((property) => {
    if (!isAstNode(property) || property.type !== "SpreadElement") return [];
    const source = getRequireCallSource(property.argument);
    return source
      ? [
          {
            source,
            start: getNodeStart(property),
            end: getNodeEnd(property),
          },
        ]
      : [];
  });
};
const collectCommonJsExportNames = (node) => {
  if (node.type !== "AssignmentExpression" || node.operator !== "=" || !isAstNode(node.left))
    return [];
  const leftPath = toMemberExpressionPath(node.left);
  if (!leftPath) return [];
  if (leftPath.namespace === "exports" && leftPath.memberPath.length === 1) {
    const exportName = leftPath.memberPath[0];
    return exportName ? [exportName] : [];
  }
  if (leftPath.namespace === "module" && leftPath.memberPath[0] === "exports") {
    if (leftPath.memberPath.length === 2) {
      const exportName = leftPath.memberPath[1];
      return exportName ? [exportName] : [];
    }
    if (leftPath.memberPath.length === 1) {
      const objectExportNames = collectObjectExportNames(node.right);
      if (collectRequireSpreadSources(node.right).length > 0) return objectExportNames;
      if (getRequireCallSource(node.right)) return [];
      return objectExportNames.length > 0 ? objectExportNames : ["default"];
    }
  }
  return [];
};
const collectCommonJsStarReExports = (node) => {
  if (node.type !== "AssignmentExpression" || node.operator !== "=" || !isAstNode(node.left))
    return [];
  const leftPath = toMemberExpressionPath(node.left);
  if (
    !leftPath ||
    leftPath.namespace !== "module" ||
    leftPath.memberPath[0] !== "exports" ||
    leftPath.memberPath.length !== 1
  )
    return [];
  const directSource = getRequireCallSource(node.right);
  if (directSource)
    return [
      {
        source: directSource,
        start: getNodeStart(node),
        end: getNodeEnd(node),
      },
    ];
  return collectRequireSpreadSources(node.right);
};
const collectCommonJsReExportRecords = (file, node) => {
  if (
    node.type !== "AssignmentExpression" ||
    node.operator !== "=" ||
    !isAstNode(node.left) ||
    !isAstNode(node.right)
  )
    return [];
  const leftPath = toMemberExpressionPath(node.left);
  if (
    !leftPath ||
    leftPath.namespace !== "module" ||
    leftPath.memberPath[0] !== "exports" ||
    leftPath.memberPath.length !== 2
  )
    return [];
  const exportName = leftPath.memberPath[1];
  if (
    !exportName ||
    node.right.type !== "MemberExpression" ||
    !isAstNode(node.right.object) ||
    node.right.object.type !== "CallExpression" ||
    !isIdentifierWithName(node.right.object.callee) ||
    node.right.object.callee.name !== "require" ||
    !isAstNode(node.right.property) ||
    !Array.isArray(node.right.object.arguments)
  )
    return [];
  const source = getStringLiteralValue(node.right.object.arguments[0]);
  const importedName = toPropertyName(node.right.property);
  if (!source || !importedName) return [];
  return [
    createImportRecord(
      file,
      source,
      "re-export",
      [
        {
          importedName,
          localName: exportName,
          isTypeOnly: false,
          isNamespace: false,
          start: getNodeStart(node.right.property),
          end: getNodeEnd(node.right.property),
        },
      ],
      getNodeStart(node),
      getNodeEnd(node),
    ),
  ];
};
const toMemberObjectReference = (node) => {
  if (!isAstNode(node)) return null;
  const memberExpressionPath = toMemberExpressionPath(node);
  return memberExpressionPath
    ? {
        namespace: memberExpressionPath.namespace,
        memberPath: memberExpressionPath.memberPath,
      }
    : null;
};
const collectWholeObjectMemberReferences = (node) => {
  if (
    node.type === "CallExpression" &&
    isAstNode(node.callee) &&
    node.callee.type === "MemberExpression" &&
    isIdentifierWithName(node.callee.object) &&
    node.callee.object.name === "Object" &&
    isIdentifierWithName(node.callee.property) &&
    WHOLE_OBJECT_MEMBER_METHODS.has(node.callee.property.name) &&
    Array.isArray(node.arguments)
  )
    return node.arguments.flatMap((argument) => {
      const reference = toMemberObjectReference(argument);
      return reference ? [reference] : [];
    });
  if (node.type === "SpreadElement") {
    const reference = toMemberObjectReference(node.argument);
    return reference ? [reference] : [];
  }
  return [];
};
const toTypeImportQualifierName = (node) => {
  if (!isAstNode(node)) return null;
  if (isIdentifierWithName(node)) return node.name;
  if (node.type !== "TSQualifiedName") return null;
  return toTypeImportQualifierName(node.left);
};
const collectTypeImportRecords = (file, node) => {
  if (node.type !== "TSImportType") return [];
  const source = getStringLiteralValue(node.source);
  if (!source) return [];
  const qualifierName = toTypeImportQualifierName(node.qualifier);
  return [
    createImportRecord(
      file,
      source,
      "comment",
      qualifierName
        ? [toCommentImportedBinding(qualifierName, getNodeStart(node), getNodeEnd(node))]
        : [],
      getNodeStart(node),
      getNodeEnd(node),
      false,
      void 0,
      true,
    ),
  ];
};
const collectTypeScriptImportEqualsRecords = (file, node) => {
  if (
    node.type !== "TSImportEqualsDeclaration" ||
    !isIdentifierWithName(node.id) ||
    !isAstNode(node.moduleReference) ||
    node.moduleReference.type !== "TSExternalModuleReference"
  )
    return [];
  const source = getStringLiteralValue(node.moduleReference.expression);
  if (!source) return [];
  return [
    createImportRecord(
      file,
      source,
      "require",
      [
        {
          importedName: "*",
          localName: node.id.name,
          isTypeOnly: node.importKind === "type",
          isNamespace: true,
          start: getNodeStart(node.id),
          end: getNodeEnd(node.id),
        },
      ],
      getNodeStart(node),
      getNodeEnd(node),
      false,
      void 0,
      node.importKind === "type",
    ),
  ];
};
const collectAstFacts = (file, program) => {
  const imports = [];
  const usedIdentifiers = /* @__PURE__ */ new Set();
  const namespaceMemberReferences = [];
  const memberObjectReferences = [];
  const namespaceObjectAliases = [];
  const namespaceLocalAliases = [];
  const namespaceLocalObjectAliases = [];
  const cjsExportNames = /* @__PURE__ */ new Set();
  const cjsStarReExports = [];
  const runtimeEntryLocals = createRuntimeEntryLocals();
  const membersByExportName = /* @__PURE__ */ new Map();
  walkAst(program, (node) => {
    addRuntimeImportDeclarationLocals(node, runtimeEntryLocals);
    addRuntimeShadowRanges(node, runtimeEntryLocals);
    if (
      node.type === "Identifier" &&
      typeof node.name === "string" &&
      !isIdentifierDeclaration(node)
    )
      usedIdentifiers.add(node.name);
    if (node.type === "JSXIdentifier" && typeof node.name === "string")
      usedIdentifiers.add(node.name);
    memberObjectReferences.push(...collectWholeObjectMemberReferences(node));
    imports.push(...collectTypeImportRecords(file, node));
    imports.push(...collectTypeScriptImportEqualsRecords(file, node));
    if (node.type === "CallExpression" && isAstNode(node.callee)) {
      imports.push(...collectResolverEntryImportRecords(file, node, runtimeEntryLocals));
      imports.push(...collectRuntimeEntryImportRecords(file, node, runtimeEntryLocals));
      imports.push(...collectContextImportRecords(file, node));
      if (node.callee.type === "Import" && Array.isArray(node.arguments)) {
        const dynamicImportRecord = createDynamicImportRecord(file, node, node.arguments[0]);
        if (dynamicImportRecord) imports.push(dynamicImportRecord);
      }
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "require" &&
        Array.isArray(node.arguments)
      ) {
        const source = getStringLiteralValue(node.arguments[0]);
        if (source)
          imports.push(
            createImportRecord(
              file,
              source,
              "require",
              collectRequireBindings(node),
              getNodeStart(node),
              getNodeEnd(node),
            ),
          );
      }
    }
    if (node.type === "ImportExpression") {
      const dynamicImportRecord = createDynamicImportRecord(file, node, node.source);
      if (dynamicImportRecord) imports.push(dynamicImportRecord);
    }
    if (
      node.type === "NewExpression" &&
      isAstNode(node.callee) &&
      node.callee.type === "Identifier" &&
      node.callee.name === "URL" &&
      Array.isArray(node.arguments) &&
      isImportMetaUrlExpression(node.arguments[1])
    ) {
      const source = getStringLiteralValue(node.arguments[0]);
      if (source)
        imports.push(
          createImportRecord(file, source, "asset", [], getNodeStart(node), getNodeEnd(node)),
        );
    }
    imports.push(...collectWorkerThreadEntryImportRecords(file, node, runtimeEntryLocals));
    if (node.type === "VariableDeclarator") {
      addRuntimeRequireLocals(node, runtimeEntryLocals);
      namespaceObjectAliases.push(...collectObjectNamespaceAliases(node));
      namespaceLocalAliases.push(...collectNamespaceLocalAliases(node));
      namespaceLocalObjectAliases.push(...collectNamespaceLocalObjectAliases(node));
      namespaceMemberReferences.push(...collectDestructuredNamespaceReferences(node));
    }
    if (node.type === "TSQualifiedName") {
      const qualifiedNamePath = toQualifiedNamePath(node);
      if (qualifiedNamePath && qualifiedNamePath.memberPath.length > 0)
        namespaceMemberReferences.push({
          namespace: qualifiedNamePath.namespace,
          memberName: qualifiedNamePath.memberPath.at(-1) ?? "",
          memberPath: qualifiedNamePath.memberPath,
        });
    }
    if (node.type === "AssignmentExpression") {
      imports.push(...collectCommonJsReExportRecords(file, node));
      cjsStarReExports.push(...collectCommonJsStarReExports(node));
      for (const exportName of collectCommonJsExportNames(node)) cjsExportNames.add(exportName);
    }
    if (node.type === "MemberExpression" && isAstNode(node.object) && isAstNode(node.property)) {
      const memberExpressionPath = toMemberExpressionPath(node);
      if (memberExpressionPath && memberExpressionPath.memberPath.length > 0) {
        namespaceMemberReferences.push({
          namespace: memberExpressionPath.namespace,
          memberName: memberExpressionPath.memberPath.at(-1) ?? "",
          memberPath: memberExpressionPath.memberPath,
        });
        if (
          memberExpressionPath.namespace === "exports" &&
          memberExpressionPath.memberPath.length === 1
        )
          cjsExportNames.add(memberExpressionPath.memberPath[0] ?? "");
      }
    }
    if (
      (node.type === "TSEnumDeclaration" || node.type === "ClassDeclaration") &&
      isAstNode(node.id) &&
      typeof node.id.name === "string"
    ) {
      const members = [];
      const rawMembers =
        node.type === "TSEnumDeclaration" &&
        isAstNode(node.body) &&
        Array.isArray(node.body.members)
          ? node.body.members
          : node.type === "ClassDeclaration" &&
              isAstNode(node.body) &&
              Array.isArray(node.body.body)
            ? node.body.body
            : [];
      for (const member of rawMembers) {
        if (!isAstNode(member)) continue;
        if (node.type === "ClassDeclaration" && member.static !== true) continue;
        const key = isAstNode(member.id) ? member.id : isAstNode(member.key) ? member.key : null;
        const name = key && typeof key.name === "string" ? key.name : getStringLiteralValue(key);
        if (name)
          members.push({
            name,
            kind: node.type === "TSEnumDeclaration" ? "enum" : "class",
            start: getNodeStart(member),
            end: getNodeEnd(member),
            position: position(file, getNodeStart(member)),
            jsDocTags: /* @__PURE__ */ new Set(),
            hasLocalReferences: false,
          });
      }
      membersByExportName.set(node.id.name, members);
    }
  });
  return {
    imports,
    usedIdentifiers,
    namespaceMemberReferences,
    memberObjectReferences,
    namespaceObjectAliases,
    namespaceLocalAliases,
    namespaceLocalObjectAliases,
    cjsExportNames,
    cjsStarReExports,
    membersByExportName,
  };
};
const enrichExportsFromAst = (exports, membersByExportName, usedIdentifiers) =>
  exports.map((exportRecord) => {
    const localName = exportRecord.localName ?? exportRecord.exportedName;
    return {
      ...exportRecord,
      symbolKind:
        exportRecord.symbolKind === "unknown" && membersByExportName.has(localName)
          ? membersByExportName.get(localName)?.[0]?.kind === "enum"
            ? "enum"
            : "class"
          : exportRecord.symbolKind,
      members: membersByExportName.get(localName) ?? [],
      hasLocalReferences: exportRecord.isCommonJs ? false : usedIdentifiers.has(localName),
    };
  });
const extractModule = (file) => {
  const parseResult = parseSync(file.filePath, file.sourceText, {
    sourceType: "unambiguous",
    range: true,
  });
  const comments = parseResult.comments;
  const program = parseResult.program;
  const astFacts = collectAstFacts(file, program);
  const commentImports = collectCommentImportRecords(file, comments);
  const staticImports = parseResult.module.staticImports.map((staticImport) =>
    toStaticImportRecord(file, staticImport),
  );
  const reExportImports = parseResult.module.staticExports
    .flatMap((staticExport) => staticExport.entries)
    .map((entry) => toReExportImportRecord(file, entry))
    .filter((importRecord) => Boolean(importRecord));
  const rawExports = parseResult.module.staticExports
    .flatMap((staticExport) => staticExport.entries)
    .map((entry) => toExportRecord(file, entry, comments));
  for (const cjsExportName of astFacts.cjsExportNames)
    rawExports.push({
      exportedName: cjsExportName,
      localName: cjsExportName,
      source: null,
      importedName: null,
      symbolKind: "value",
      isTypeOnly: false,
      isReExport: false,
      isCommonJs: true,
      isNamespace: false,
      isReactComponentLike: isReactComponentLikeName(cjsExportName),
      jsDocTags: /* @__PURE__ */ new Set(),
      members: [],
      hasLocalReferences: false,
      start: 0,
      end: 0,
      position: {
        line: 1,
        column: 1,
      },
    });
  const cjsStarReExportImports = astFacts.cjsStarReExports.map((record) =>
    createImportRecord(
      file,
      record.source,
      "re-export",
      [
        {
          importedName: "*",
          localName: "*",
          isTypeOnly: false,
          isNamespace: true,
          start: record.start,
          end: record.end,
        },
      ],
      record.start,
      record.end,
    ),
  );
  for (const record of astFacts.cjsStarReExports)
    rawExports.push({
      exportedName: "*",
      localName: null,
      source: record.source,
      importedName: "*",
      symbolKind: "unknown",
      isTypeOnly: false,
      isReExport: true,
      isCommonJs: true,
      isNamespace: true,
      isReactComponentLike: false,
      jsDocTags: /* @__PURE__ */ new Set(),
      members: [],
      hasLocalReferences: false,
      start: record.start,
      end: record.end,
      position: position(file, record.start),
    });
  return {
    file,
    imports: [
      ...staticImports,
      ...commentImports,
      ...astFacts.imports,
      ...reExportImports,
      ...cjsStarReExportImports,
    ],
    exports: enrichExportsFromAst(
      rawExports,
      astFacts.membersByExportName,
      astFacts.usedIdentifiers,
    ),
    directives: collectDirectives(program),
    usedIdentifiers: astFacts.usedIdentifiers,
    namespaceMemberReferences: astFacts.namespaceMemberReferences,
    memberObjectReferences: astFacts.memberObjectReferences,
    namespaceObjectAliases: astFacts.namespaceObjectAliases,
    namespaceLocalAliases: astFacts.namespaceLocalAliases,
    namespaceLocalObjectAliases: astFacts.namespaceLocalObjectAliases,
    cjsExportNames: astFacts.cjsExportNames,
    parseErrors: parseResult.errors.map((error) => error.message),
  };
};
const extractModules = (files) => files.map(extractModule);
//#endregion
//#region src/core/rules/codebase/analyzer/plugins/index.ts
const createEmptyPluginResult = () => ({
  entryPatterns: [],
  alwaysUsedPatterns: [],
  usedExports: /* @__PURE__ */ new Map(),
  toolingDependencies: /* @__PURE__ */ new Set(),
  virtualModulePrefixes: [],
  generatedImportSuffixes: [],
});
const builtInPlugins = [
  {
    name: "nextjs",
    enablers: ["next"],
    entryPatterns: [
      "app/**/page.{js,jsx,ts,tsx}",
      "app/**/layout.{js,jsx,ts,tsx}",
      "app/**/route.{js,ts}",
      "app/**/not-found.{js,jsx,ts,tsx}",
      "app/**/error.{js,jsx,ts,tsx}",
      "app/**/global-error.{js,jsx,ts,tsx}",
      "app/**/loading.{js,jsx,ts,tsx}",
      "app/**/template.{js,jsx,ts,tsx}",
      "app/**/default.{js,jsx,ts,tsx}",
      "app/**/opengraph-image.{js,jsx,ts,tsx}",
      "app/**/twitter-image.{js,jsx,ts,tsx}",
      "app/**/icon.{js,jsx,ts,tsx}",
      "app/**/apple-icon.{js,jsx,ts,tsx}",
      "app/**/sitemap.{js,ts}",
      "app/**/robots.{js,ts}",
      "app/**/manifest.{js,ts}",
      "pages/**/*.{js,jsx,ts,tsx}",
      "next.config.{js,mjs,cjs,ts}",
    ],
    entryRole: "runtime",
    alwaysUsedPatterns: [
      "middleware.{js,ts}",
      "instrumentation.{js,ts}",
      "instrumentation-client.{js,ts}",
      "mdx-components.{js,jsx,ts,tsx}",
    ],
    toolingDependencies: ["next", "react", "react-dom"],
    usedExports: [
      {
        pattern:
          "app/**/{page,layout,route,not-found,error,global-error,loading,template,default}.{js,jsx,ts,tsx}",
        exports: [
          "default",
          "metadata",
          "generateMetadata",
          "generateStaticParams",
          "generateViewport",
          "viewport",
          "config",
          "dynamic",
          "dynamicParams",
          "fetchCache",
          "maxDuration",
          "preferredRegion",
          "revalidate",
          "runtime",
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE",
          "HEAD",
          "OPTIONS",
        ],
      },
      {
        pattern: "app/**/{opengraph-image,twitter-image,icon,apple-icon}.{js,jsx,ts,tsx}",
        exports: ["default", "alt", "size", "contentType", "generateImageMetadata"],
      },
      {
        pattern: "app/**/{sitemap,robots,manifest}.{js,ts}",
        exports: ["default"],
      },
      {
        pattern: "next.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
    generatedImportSuffixes: ["/$types"],
    virtualModulePrefixes: ["@/."],
  },
  {
    name: "vite",
    enablers: ["vite"],
    entryPatterns: ["index.html", "src/main.{js,jsx,ts,tsx}", "vite.config.{js,mjs,cjs,ts}"],
    entryRole: "runtime",
    toolingDependencies: ["vite"],
    virtualModulePrefixes: ["virtual:"],
  },
  {
    name: "vitest",
    enablers: ["vitest"],
    entryPatterns: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "vitest.config.{js,mjs,cjs,ts}"],
    entryRole: "test",
    toolingDependencies: ["vitest"],
  },
  {
    name: "jest",
    enablers: ["jest", "ts-jest", "@jest/"],
    entryPatterns: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "jest.config.{js,mjs,cjs,ts}"],
    entryRole: "test",
    toolingDependencies: ["jest", "ts-jest"],
  },
  {
    name: "eslint",
    enablers: ["eslint", "@eslint/"],
    entryPatterns: ["eslint.config.{js,mjs,cjs,ts}"],
    entryRole: "support",
    toolingDependencies: ["eslint"],
    usedExports: [
      {
        pattern: "eslint.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
  },
  {
    name: "tailwindcss",
    enablers: ["tailwindcss", "@tailwindcss/postcss", "@tailwindcss/vite", "@tailwindcss/cli"],
    entryPatterns: ["tailwind.config.{js,mjs,cjs,ts}"],
    entryRole: "support",
    toolingDependencies: [
      "tailwindcss",
      "@tailwindcss/postcss",
      "@tailwindcss/vite",
      "@tailwindcss/cli",
    ],
    usedExports: [
      {
        pattern: "tailwind.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
  },
  {
    name: "postcss",
    enablers: ["postcss", "@tailwindcss/postcss"],
    entryPatterns: ["postcss.config.{js,mjs,cjs,ts}"],
    entryRole: "support",
    toolingDependencies: ["postcss"],
    usedExports: [
      {
        pattern: "postcss.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
  },
  {
    name: "playwright",
    enablers: ["@playwright/test", "playwright"],
    entryPatterns: ["playwright.config.{js,mjs,cjs,ts}"],
    entryRole: "support",
    toolingDependencies: ["@playwright/test", "playwright"],
    usedExports: [
      {
        pattern: "playwright.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
  },
  {
    name: "tsup",
    enablers: ["tsup"],
    entryPatterns: ["tsup.config.{js,mjs,cjs,ts}"],
    entryRole: "support",
    toolingDependencies: ["tsup"],
    usedExports: [
      {
        pattern: "tsup.config.{js,mjs,cjs,ts}",
        exports: ["default"],
      },
    ],
  },
  {
    name: "storybook",
    enablers: ["storybook", "@storybook/"],
    entryPatterns: ["**/*.stories.{js,jsx,ts,tsx}", ".storybook/**/*.{js,jsx,ts,tsx}"],
    entryRole: "support",
    toolingDependencies: ["storybook"],
  },
  {
    name: "tanstack-start",
    enablers: ["@tanstack/react-start", "@tanstack/start"],
    entryPatterns: ["app/routes/**/*.{js,jsx,ts,tsx}", "src/routes/**/*.{js,jsx,ts,tsx}"],
    entryRole: "runtime",
    toolingDependencies: ["@tanstack/react-start"],
  },
  {
    name: "react-native",
    enablers: ["react-native", "expo"],
    entryPatterns: ["App.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "index.{js,jsx,ts,tsx}"],
    entryRole: "runtime",
    toolingDependencies: ["react-native", "expo"],
  },
];
const isPluginEnabled = (plugin, workspace) => {
  if (plugin.isEnabled?.(workspace)) return true;
  return plugin.enablers.some((enabler) => {
    if (enabler.endsWith("/"))
      return [...workspace.dependencyNames].some((dependencyName) =>
        dependencyName.startsWith(enabler),
      );
    return workspace.dependencyNames.has(enabler);
  });
};
const mergePluginResult = (target, plugin, workspace) => {
  target.entryPatterns.push(
    ...plugin.entryPatterns.map((pattern) => ({
      pattern,
      role: plugin.entryRole,
    })),
  );
  target.alwaysUsedPatterns.push(...(plugin.alwaysUsedPatterns ?? []));
  target.virtualModulePrefixes.push(...(plugin.virtualModulePrefixes ?? []));
  target.generatedImportSuffixes.push(...(plugin.generatedImportSuffixes ?? []));
  for (const dependencyName of plugin.toolingDependencies ?? [])
    target.toolingDependencies.add(dependencyName);
  for (const usedExportRule of plugin.usedExports ?? [])
    target.usedExports.set(usedExportRule.pattern, new Set(usedExportRule.exports));
  const packageJsonResult = plugin.resolvePackageJson?.(workspace.manifest);
  if (!packageJsonResult) return;
  target.entryPatterns.push(...packageJsonResult.entryPatterns);
  target.alwaysUsedPatterns.push(...packageJsonResult.alwaysUsedPatterns);
  target.virtualModulePrefixes.push(...packageJsonResult.virtualModulePrefixes);
  target.generatedImportSuffixes.push(...packageJsonResult.generatedImportSuffixes);
  for (const dependencyName of packageJsonResult.toolingDependencies)
    target.toolingDependencies.add(dependencyName);
  for (const [pattern, exportNames] of packageJsonResult.usedExports)
    target.usedExports.set(pattern, exportNames);
};
const runCodebasePlugins = (workspaces) => {
  const results = /* @__PURE__ */ new Map();
  for (const workspace of workspaces) {
    const result = createEmptyPluginResult();
    for (const plugin of builtInPlugins)
      if (isPluginEnabled(plugin, workspace)) mergePluginResult(result, plugin, workspace);
    results.set(workspace.id, result);
  }
  return results;
};
//#endregion
//#region src/core/rules/codebase/analyzer/resolve.ts
const createResolver = () =>
  new ResolverFactory({
    tsconfig: "auto",
    conditionNames: DEFAULT_CONDITION_NAMES,
    extensions: RESOLVE_EXTENSIONS,
    extensionAlias: {
      ".js": [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    },
    mainFields: ["module", "browser", "main"],
    builtinModules: true,
    symlinks: false,
  });
const isInsideRoot = (rootDirectory, filePath) => {
  const relativePath = path.relative(rootDirectory, filePath);
  return Boolean(relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};
const isNodeModulePath = (filePath) => filePath.split(path.sep).includes("node_modules");
const getKnownAssetExtension = (specifier) => {
  const lowerSpecifier = specifier.toLowerCase();
  return (
    [...ASSET_FILE_EXTENSIONS]
      .sort((first, second) => second.length - first.length)
      .find((item) => lowerSpecifier.endsWith(item)) ?? null
  );
};
const isKnownAssetSpecifier = (specifier) => Boolean(getKnownAssetExtension(specifier));
const findWorkspacePackageTarget = (sourceFilePaths, workspaces, packageName, importSource) => {
  if (!packageName) return null;
  const workspace = workspaces.find((item) => item.name === packageName);
  if (!workspace) return null;
  const subpath = importSource === packageName ? "" : importSource.slice(packageName.length + 1);
  const exportTargets =
    subpath.length > 0
      ? collectManifestExportTargets(workspace.manifest.exports, `./${subpath}`)
      : [];
  return findExistingSourcePath(
    sourceFilePaths,
    (subpath.length > 0
      ? [...exportTargets, subpath, path.join("src", subpath)]
      : [
          ...collectManifestEntrySpecifiers(workspace.manifest),
          "src/index",
          "index",
          "src/main",
          "main",
        ]
    ).flatMap((candidate) => toWorkspaceSourceCandidates(workspace.directory, candidate)),
    [workspace],
  );
};
const collectManifestExportTargets = (exportsField, exportKey) => {
  if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) return [];
  const exportValue = exportsField[exportKey];
  return [
    ...collectStringValues(exportValue),
    ...collectWildcardManifestExportTargets(exportsField, exportKey),
  ].filter((value) => value.startsWith(".") || value.startsWith("/"));
};
const collectWildcardManifestExportTargets = (exportsField, exportKey) => {
  const targets = [];
  for (const [pattern, value] of Object.entries(exportsField)) {
    if (!pattern.includes("*")) continue;
    const matchedValue = matchWildcardExportKey(pattern, exportKey);
    if (matchedValue === null) continue;
    targets.push(
      ...collectStringValues(value).map((target) => target.replaceAll("*", matchedValue)),
    );
  }
  return targets;
};
const matchWildcardExportKey = (pattern, exportKey) => {
  const wildcardIndex = pattern.indexOf("*");
  const prefix = pattern.slice(0, wildcardIndex);
  const suffix = pattern.slice(wildcardIndex + 1);
  if (!exportKey.startsWith(prefix) || !exportKey.endsWith(suffix)) return null;
  return exportKey.slice(prefix.length, exportKey.length - suffix.length);
};
const collectStringValues = (value) => {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  return Object.values(value).flatMap(collectStringValues);
};
const toWorkspaceSourceCandidates = (workspaceDirectory, candidate) => {
  const absolutePath = path.resolve(workspaceDirectory, candidate);
  if (path.extname(absolutePath)) return [absolutePath, ...toIndexCandidates(absolutePath)];
  return [
    absolutePath,
    ...SOURCE_FILE_EXTENSIONS.map((sourceExtension) => `${absolutePath}${sourceExtension}`),
    ...toIndexCandidates(absolutePath),
  ];
};
const toIndexCandidates = (absolutePath) =>
  SOURCE_FILE_EXTENSIONS.map((sourceExtension) =>
    path.join(absolutePath, `index${sourceExtension}`),
  );
const findExistingSourcePath = (sourceFilePaths, candidates, workspaces = []) => {
  for (const candidate of candidates) {
    if (sourceFilePaths.has(candidate)) return candidate;
    const sourceMappedTargetPath = findSourceMappedTarget(sourceFilePaths, candidate, workspaces);
    if (sourceMappedTargetPath) return sourceMappedTargetPath;
  }
  return null;
};
const stripCompiledExtension = (filePath) => {
  const declarationExtension = TYPESCRIPT_DECLARATION_EXTENSIONS.find((extension) =>
    filePath.endsWith(extension),
  );
  if (declarationExtension) return filePath.slice(0, -declarationExtension.length);
  const extension = path.extname(filePath);
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs")
    return filePath.slice(0, -extension.length);
  return filePath;
};
const toConventionalSourceMappedPath = (filePath) => {
  const distSegment = `${path.sep}dist${path.sep}`;
  if (!filePath.includes(distSegment)) return null;
  return stripCompiledExtension(filePath.replace(distSegment, `${path.sep}src${path.sep}`));
};
const isUnderDirectory = (filePath, directory) => {
  const relativePath = path.relative(directory, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};
const toConfiguredSourceMappedPath = (filePath, workspaces) => {
  const sourceMap = workspaces
    .flatMap((workspace) => workspace.sourceMaps)
    .sort((first, second) => second.outputDirectory.length - first.outputDirectory.length)
    .find((item) => isUnderDirectory(filePath, item.outputDirectory));
  if (!sourceMap) return null;
  return stripCompiledExtension(
    path.join(sourceMap.sourceDirectory, path.relative(sourceMap.outputDirectory, filePath)),
  );
};
const findSourceMappedTarget = (sourceFilePaths, filePath, workspaces = []) => {
  const sourceMappedBasePath =
    toConfiguredSourceMappedPath(filePath, workspaces) ?? toConventionalSourceMappedPath(filePath);
  if (!sourceMappedBasePath) return null;
  return (
    [
      sourceMappedBasePath,
      `${sourceMappedBasePath}.mts`,
      `${sourceMappedBasePath}.cts`,
      `${sourceMappedBasePath}.ts`,
      `${sourceMappedBasePath}.tsx`,
      `${sourceMappedBasePath}.mjs`,
      `${sourceMappedBasePath}.cjs`,
      `${sourceMappedBasePath}.js`,
      `${sourceMappedBasePath}.jsx`,
    ].find((candidate) => sourceFilePaths.has(candidate)) ?? null
  );
};
const isVirtualOrGeneratedImport = (importSource, pluginResult) =>
  Boolean(
    pluginResult &&
    (pluginResult.virtualModulePrefixes.some((prefix) => importSource.startsWith(prefix)) ||
      pluginResult.generatedImportSuffixes.some((suffix) => importSource.endsWith(suffix))),
  );
const stripResourceQuery = (specifier) => {
  const queryIndex = specifier.search(/[?#]/);
  return queryIndex >= 0 ? specifier.slice(0, queryIndex) : specifier;
};
const normalizeLoaderName = (loader) => {
  return getPackageNameFromSpecifier(loader.replace(/^[-!]+/, "").trim());
};
const normalizeBundlerSpecifier = (specifier) => {
  const parts = specifier.split("!");
  return {
    resource: stripResourceQuery(parts.at(-1) ?? specifier),
    loaderPackageNames: parts
      .slice(0, -1)
      .map(normalizeLoaderName)
      .filter((packageName) => Boolean(packageName)),
  };
};
const toExternalPackageImport = (importRecord, packageName) => ({
  importRecord,
  targetKind: "external",
  targetFilePath: null,
  packageName,
  error: null,
});
const toContextGlobPattern = (rootDirectory, module, importRecord) => {
  if (importRecord.context?.kind === "require-context") {
    const baseDirectory = getContextBaseDirectory(rootDirectory, module, importRecord);
    return path.join(baseDirectory, importRecord.context.recursive === false ? "*" : "**/*");
  }
  if (importRecord.source.startsWith("/"))
    return path.join(rootDirectory, importRecord.source.slice(1));
  return path.resolve(path.dirname(module.file.filePath), importRecord.source);
};
const getContextBaseDirectory = (rootDirectory, module, importRecord) => {
  if (importRecord.context?.kind === "require-context")
    return path.resolve(path.dirname(module.file.filePath), importRecord.source);
  if (importRecord.source.startsWith("/")) return rootDirectory;
  return path.dirname(path.resolve(path.dirname(module.file.filePath), importRecord.source));
};
const createContextRegex = (importRecord) => {
  const pattern = importRecord.context?.regexPattern;
  if (!pattern) return null;
  try {
    return new RegExp(pattern, importRecord.context?.regexFlags ?? "");
  } catch {
    return null;
  }
};
const matchesContextRegex = (rootDirectory, module, filePath, importRecord) => {
  const regex = createContextRegex(importRecord);
  if (!regex) return true;
  const importerRelativePath = toRelativePath(
    getContextBaseDirectory(rootDirectory, module, importRecord),
    filePath,
  );
  return regex.test(`./${importerRelativePath}`);
};
const resolveContextImports = (module, rootDirectory, sourceFilePaths, importRecord) => {
  const globPattern = toPortablePath(toContextGlobPattern(rootDirectory, module, importRecord));
  return [...sourceFilePaths.keys()]
    .filter((filePath) => matchesGlob(toPortablePath(filePath), globPattern))
    .filter((filePath) => matchesContextRegex(rootDirectory, module, filePath, importRecord))
    .map((filePath) => ({
      importRecord,
      targetKind: "internal",
      targetFilePath: filePath,
      packageName: null,
      error: null,
    }));
};
const resolveImport = (
  module,
  resolver,
  rootDirectory,
  sourceFilePaths,
  workspaces,
  pluginResults,
  importRecord,
) => {
  const importSource = normalizeBundlerSpecifier(importRecord.source).resource;
  const packageName = getPackageNameFromSpecifier(importSource);
  const pluginResult = pluginResults.get(module.file.workspaceId);
  if (isUrlLikeSpecifier(importSource))
    return {
      importRecord,
      targetKind: "asset",
      targetFilePath: null,
      packageName: null,
      error: null,
    };
  if (isKnownAssetSpecifier(importSource))
    return {
      importRecord,
      targetKind: packageName ? "external" : "asset",
      targetFilePath: packageName
        ? null
        : path.resolve(path.dirname(module.file.filePath), importSource),
      packageName,
      error: null,
    };
  if (isVirtualOrGeneratedImport(importSource, pluginResult))
    return {
      importRecord,
      targetKind: "asset",
      targetFilePath: null,
      packageName,
      error: null,
    };
  const result = resolver.resolveFileSync(module.file.filePath, importSource);
  if (result.builtin)
    return {
      importRecord,
      targetKind: "builtin",
      targetFilePath: null,
      packageName,
      error: null,
    };
  if (result.path) {
    const resolvedPath = path.resolve(result.path);
    const sourceMappedTargetPath = findSourceMappedTarget(
      sourceFilePaths,
      resolvedPath,
      workspaces,
    );
    const internalTargetPath = sourceFilePaths.has(resolvedPath)
      ? resolvedPath
      : sourceMappedTargetPath;
    if (internalTargetPath)
      return {
        importRecord,
        targetKind: "internal",
        targetFilePath: internalTargetPath,
        packageName,
        error: null,
      };
    return {
      importRecord,
      targetKind:
        isInsideRoot(rootDirectory, resolvedPath) && !isNodeModulePath(resolvedPath)
          ? "asset"
          : "external",
      targetFilePath: resolvedPath,
      packageName,
      error: null,
    };
  }
  const workspaceTargetPath = findWorkspacePackageTarget(
    sourceFilePaths,
    workspaces,
    packageName,
    importSource,
  );
  if (workspaceTargetPath)
    return {
      importRecord,
      targetKind: "internal",
      targetFilePath: workspaceTargetPath,
      packageName,
      error: null,
    };
  if (packageName) return toExternalPackageImport(importRecord, packageName);
  return {
    importRecord,
    targetKind: "unresolved",
    targetFilePath: null,
    packageName,
    error: result.error ?? "Unable to resolve import.",
  };
};
const resolveImportRecords = (
  module,
  resolver,
  rootDirectory,
  sourceFilePaths,
  workspaces,
  pluginResults,
  importRecord,
) => {
  if (importRecord.kind === "context")
    return resolveContextImports(module, rootDirectory, sourceFilePaths, importRecord);
  return [
    ...normalizeBundlerSpecifier(importRecord.source).loaderPackageNames.map((packageName) =>
      toExternalPackageImport(importRecord, packageName),
    ),
    resolveImport(
      module,
      resolver,
      rootDirectory,
      sourceFilePaths,
      workspaces,
      pluginResults,
      importRecord,
    ),
  ];
};
const resolveModules = (rootDirectory, modules, workspaces, pluginResults) => {
  const resolver = createResolver();
  const sourceFilePaths = new Map(modules.map((module) => [module.file.filePath, module.file.id]));
  return modules.map((module) => ({
    module,
    imports: module.imports.flatMap((importRecord) =>
      resolveImportRecords(
        module,
        resolver,
        rootDirectory,
        sourceFilePaths,
        workspaces,
        pluginResults,
        importRecord,
      ),
    ),
  }));
};
//#endregion
//#region src/core/rules/codebase/analyzer/index.ts
const runCodebaseAnalysis = async (options) => {
  options.signal?.throwIfAborted();
  const config = createCodebaseAnalysisConfig(options);
  const workspaces = await discoverWorkspaces(config);
  const pluginResults = runCodebasePlugins(workspaces);
  const sourceFiles = await discoverSourceFiles(config, workspaces, options.signal);
  options.signal?.throwIfAborted();
  const modules = extractModules(sourceFiles);
  options.signal?.throwIfAborted();
  return {
    graph: buildModuleGraph(
      config,
      workspaces,
      resolveModules(config.rootDirectory, modules, workspaces, pluginResults),
      discoverEntryPoints(config, workspaces, sourceFiles, pluginResults),
      pluginResults,
    ),
  };
};
//#endregion
//#region src/core/rules/codebase/dead-code.ts
const DEAD_CODE_RULE_ID = DEAD_CODE_CHECK_ID;
const DEFAULT_EXPORT_NAME = "default";
const NAMESPACE_EXPORT_NAME = "*";
const createCodebaseIssue$2 = (issue) => ({
  severity: issue.severity ?? "warning",
  category: issue.category ?? "codebase",
  ...issue,
});
const sortIssues$2 = (issues) =>
  issues.sort((first, second) => {
    const firstPath = first.location?.filePath ?? "";
    const secondPath = second.location?.filePath ?? "";
    return (
      firstPath.localeCompare(secondPath) ||
      (first.location?.line ?? 0) - (second.location?.line ?? 0) ||
      first.id.localeCompare(second.id)
    );
  });
const isExportUsed = (exportSymbol) =>
  exportSymbol.references.length > 0 ||
  exportSymbol.hasLocalReferences ||
  exportSymbol.isPluginUsed ||
  isExpectedUnused(exportSymbol) ||
  isVisibilityProtected(exportSymbol);
const hasUsageReference = (exportSymbol) =>
  exportSymbol.references.length > 0 ||
  exportSymbol.hasLocalReferences ||
  exportSymbol.isPluginUsed;
const isExpectedUnused = (exportSymbol) =>
  exportSymbol.jsDocTags.has(EXPECTED_UNUSED_VISIBILITY_TAG);
const isMemberVisibilityProtected = (member) =>
  [...member.jsDocTags].some((tag) => PUBLIC_VISIBILITY_TAGS.has(tag) || tag === "internal");
const isPackageEntrypoint = (entrySources) => entrySources.has("package.json");
const isExternalEntrypointExportSurface = (node) =>
  isPackageEntrypoint(node.entrySources) || node.entryRoles.has("support");
const collectDuplicateExports = (graph) => {
  const exportsByName = /* @__PURE__ */ new Map();
  for (const node of graph.nodes.values()) {
    if (!node.isReachable) continue;
    if (isExternalEntrypointExportSurface(node)) continue;
    for (const exportSymbol of node.exports.values()) {
      if (
        exportSymbol.exportedName === DEFAULT_EXPORT_NAME ||
        exportSymbol.exportedName === NAMESPACE_EXPORT_NAME ||
        exportSymbol.isPluginUsed
      )
        continue;
      const exports = exportsByName.get(exportSymbol.exportedName) ?? [];
      exports.push({
        file: node.file,
        exportSymbol,
      });
      exportsByName.set(exportSymbol.exportedName, exports);
    }
  }
  return [...exportsByName.entries()]
    .filter(([, exports]) => exports.length > 1)
    .map(([exportName, exports]) => ({
      exportName,
      exports,
    }));
};
const collectUnusedFiles = (graph) =>
  [...graph.nodes.values()]
    .filter((node) => !node.isReachable)
    .map((node) => ({ file: node.file }));
const collectUnusedExports = (graph) =>
  [...graph.nodes.values()]
    .filter((node) => node.isReachable)
    .flatMap((node) =>
      [...node.exports.values()]
        .filter(
          (exportSymbol) =>
            exportSymbol.exportedName !== NAMESPACE_EXPORT_NAME &&
            !isExportUsed(exportSymbol) &&
            !isExternalEntrypointExportSurface(node),
        )
        .map((exportSymbol) => ({
          file: node.file,
          exportSymbol,
        })),
    );
const collectNamespaceOnlyExports = (graph) =>
  [...graph.nodes.values()].flatMap((node) =>
    [...node.exports.values()]
      .filter(
        (exportSymbol) =>
          exportSymbol.isReferencedByNamespace &&
          exportSymbol.references.every((reference) => reference.kind === "namespace"),
      )
      .map((exportSymbol) => ({
        file: node.file,
        exportSymbol,
      })),
  );
const isMemberUsed = (exportSymbol, member) =>
  member.hasLocalReferences ||
  exportSymbol.referencedMemberNames.has(member.name) ||
  member.jsDocTags.has("expected-unused") ||
  isMemberVisibilityProtected(member);
const collectUnusedExportMembers = (graph) =>
  [...graph.nodes.values()]
    .filter((node) => node.isReachable && !isExternalEntrypointExportSurface(node))
    .flatMap((node) =>
      [...node.exports.values()]
        .filter((exportSymbol) => isExportUsed(exportSymbol))
        .flatMap((exportSymbol) =>
          exportSymbol.members
            .filter((member) => !isMemberUsed(exportSymbol, member))
            .map((member) => ({
              file: node.file,
              exportSymbol,
              member,
            })),
        ),
    );
const collectStaleExpectedUnusedExports = (graph) =>
  [...graph.nodes.values()].flatMap((node) =>
    [...node.exports.values()]
      .filter(
        (exportSymbol) =>
          exportSymbol.exportedName !== NAMESPACE_EXPORT_NAME &&
          isExpectedUnused(exportSymbol) &&
          hasUsageReference(exportSymbol),
      )
      .map((exportSymbol) => ({
        file: node.file,
        exportSymbol,
      })),
  );
const toUnusedFileIssue = (finding) =>
  createCodebaseIssue$2({
    id: `${DEAD_CODE_CHECK_ID}/unused-file/${finding.file.relativePath}`,
    title: "Unused file",
    message:
      "This source file is not reachable from any package, framework, test, or support entrypoint.",
    location: { filePath: finding.file.relativePath },
    recommendation: "Remove the file or connect it to a real entrypoint.",
    source: {
      checkId: DEAD_CODE_CHECK_ID,
      ruleId: "unused-file",
    },
  });
const toUnusedExportIssue = (finding, ruleId, title) =>
  createCodebaseIssue$2({
    id: `${DEAD_CODE_CHECK_ID}/${ruleId}/${finding.file.relativePath}/${finding.exportSymbol.exportedName}`,
    title,
    message: `The exported symbol "${finding.exportSymbol.exportedName}" is not referenced by reachable modules.`,
    location: {
      filePath: finding.file.relativePath,
      line: finding.exportSymbol.position.line,
      column: finding.exportSymbol.position.column,
    },
    recommendation: "Remove the export or make it part of an entrypoint API.",
    source: {
      checkId: DEAD_CODE_CHECK_ID,
      ruleId,
    },
  });
const toDuplicateExportIssue = (finding) =>
  createCodebaseIssue$2({
    id: `${DEAD_CODE_CHECK_ID}/duplicate-export/${finding.exportName}`,
    title: "Duplicate export",
    message: `The exported symbol "${finding.exportName}" appears in ${finding.exports.length} files.`,
    location: { filePath: finding.exports[0]?.file.relativePath ?? "" },
    recommendation: "Consolidate the public API or use more specific names.",
    source: {
      checkId: DEAD_CODE_CHECK_ID,
      ruleId: "duplicate-export",
    },
  });
const toUnusedExportMemberIssue = (finding) =>
  createCodebaseIssue$2({
    id: `${DEAD_CODE_CHECK_ID}/unused-${finding.member.kind}-member/${finding.file.relativePath}/${finding.exportSymbol.exportedName}.${finding.member.name}`,
    title: `Unused ${finding.member.kind} member`,
    message: `The exported ${finding.member.kind} member "${finding.exportSymbol.exportedName}.${finding.member.name}" is not referenced by reachable modules.`,
    location: {
      filePath: finding.file.relativePath,
      line: finding.member.position.line,
      column: finding.member.position.column,
    },
    recommendation: "Remove the member or reference it from reachable code.",
    source: {
      checkId: DEAD_CODE_CHECK_ID,
      ruleId: `unused-${finding.member.kind}-member`,
    },
  });
const toStaleExpectedUnusedIssue = (finding) =>
  createCodebaseIssue$2({
    id: `${DEAD_CODE_CHECK_ID}/stale-expected-unused/${finding.file.relativePath}/${finding.exportSymbol.exportedName}`,
    title: "Stale expected-unused marker",
    message: `The exported symbol "${finding.exportSymbol.exportedName}" is marked @expected-unused but is now referenced.`,
    location: {
      filePath: finding.file.relativePath,
      line: finding.exportSymbol.position.line,
      column: finding.exportSymbol.position.column,
    },
    recommendation: "Remove the @expected-unused marker or stop referencing the export.",
    source: {
      checkId: DEAD_CODE_CHECK_ID,
      ruleId: "stale-expected-unused",
    },
  });
const inspectDeadCode = (graph) => {
  const unusedExports = collectUnusedExports(graph);
  return sortIssues$2([
    ...collectUnusedFiles(graph).map(toUnusedFileIssue),
    ...unusedExports
      .filter((finding) => !finding.exportSymbol.isTypeOnly)
      .map((finding) => toUnusedExportIssue(finding, "unused-export", "Unused export")),
    ...unusedExports
      .filter((finding) => finding.exportSymbol.isTypeOnly)
      .map((finding) => toUnusedExportIssue(finding, "unused-type-export", "Unused type export")),
    ...collectNamespaceOnlyExports(graph).map((finding) =>
      toUnusedExportIssue(finding, "namespace-only-export", "Namespace-only export"),
    ),
    ...collectUnusedExportMembers(graph).map(toUnusedExportMemberIssue),
    ...collectStaleExpectedUnusedExports(graph).map(toStaleExpectedUnusedIssue),
    ...collectDuplicateExports(graph).map(toDuplicateExportIssue),
  ]);
};
const deadCodeRule = defineRule({
  metadata: {
    id: DEAD_CODE_RULE_ID,
    name: "Codebase dead code",
    description:
      "Builds a project module graph and reports unused files, exports, types, and duplicate exports.",
    category: "dead-code",
    severity: "warning",
    defaultEnabled: false,
    tags: ["codebase", "dead-code", "oxc"],
  },
  run: async ({ rootDirectory, includePaths, excludePatterns, signal, getCodebaseAnalysis }) => {
    return {
      issues: inspectDeadCode(
        (
          await (getCodebaseAnalysis?.() ??
            runCodebaseAnalysis({
              rootDirectory,
              includePaths,
              excludePatterns,
              signal,
            }))
        ).graph,
      ),
    };
  },
});
//#endregion
//#region src/core/rules/codebase/dependencies.ts
const DEPENDENCIES_RULE_ID = DEPENDENCIES_CHECK_ID;
const dependencyBucketNames = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const createCodebaseIssue$1 = (issue) => ({
  severity: issue.severity ?? "warning",
  category: issue.category ?? "codebase",
  ...issue,
});
const sortIssues$1 = (issues) =>
  issues.sort((first, second) => {
    const firstPath = first.location?.filePath ?? "";
    const secondPath = second.location?.filePath ?? "";
    return (
      firstPath.localeCompare(secondPath) ||
      (first.location?.line ?? 0) - (second.location?.line ?? 0) ||
      first.id.localeCompare(second.id)
    );
  });
const findUsage = (graph, workspace, packageName) =>
  graph.packageUsages.find(
    (usage) => usage.workspaceId === workspace.id && usage.packageName === packageName,
  );
const isDefinitelyTypedPackage = (packageName) =>
  packageName.startsWith(`${DEFINITELY_TYPED_SCOPE}/`);
const toDefinitelyTypedPackageName = (packageName) => {
  if (isDefinitelyTypedPackage(packageName)) return packageName;
  if (packageName.startsWith("@"))
    return `${DEFINITELY_TYPED_SCOPE}/${packageName.slice(1).replace("/", "__")}`;
  return `${DEFINITELY_TYPED_SCOPE}/${packageName}`;
};
const toRuntimePackageName = (typesPackageName) => {
  if (!isDefinitelyTypedPackage(typesPackageName)) return null;
  const unscopedName = typesPackageName.slice(7);
  if (!unscopedName) return null;
  if (unscopedName.includes("__")) {
    const [scopeName, packageName] = unscopedName.split("__");
    return scopeName && packageName ? `@${scopeName}/${packageName}` : null;
  }
  return unscopedName;
};
const addDefinitelyTypedCompanionPackages = (workspace, usedPackages) => {
  for (const packageName of [...usedPackages]) {
    if (isDefinitelyTypedPackage(packageName)) continue;
    const typesPackageName = toDefinitelyTypedPackageName(packageName);
    if (workspace.dependencyNames.has(typesPackageName)) usedPackages.add(typesPackageName);
  }
  for (const packageName of workspace.dependencyNames) {
    const runtimePackageName = toRuntimePackageName(packageName);
    if (!runtimePackageName || !IGNORED_DEFINITELY_TYPED_PACKAGE_NAMES.has(runtimePackageName))
      continue;
    usedPackages.add(packageName);
  }
};
const getUsedPackages = (graph, workspace) => {
  const usedPackages = new Set([
    ...graph.packageUsages
      .filter((usage) => usage.workspaceId === workspace.id)
      .map((usage) => usage.packageName),
    ...workspace.manifestDependencyNames,
    ...workspace.scriptDependencyNames,
    ...workspace.typeScriptConfigDependencyNames,
    ...workspace.cssImportDependencyNames,
    ...(graph.pluginResults.get(workspace.id)?.toolingDependencies ?? []),
  ]);
  addDefinitelyTypedCompanionPackages(workspace, usedPackages);
  return usedPackages;
};
const getNonImportUsedPackages = (graph, workspace) =>
  new Set([
    ...workspace.manifestDependencyNames,
    ...workspace.scriptDependencyNames,
    ...workspace.typeScriptConfigDependencyNames,
    ...workspace.cssImportDependencyNames,
    ...(graph.pluginResults.get(workspace.id)?.toolingDependencies ?? []),
  ]);
const hasDeclaredDependency = (workspace, packageName) =>
  dependencyBucketNames.some((bucketName) =>
    workspace.dependencyBuckets[bucketName].has(packageName),
  );
const hasDeclaredDependencyInGraph = (graph, packageName) =>
  graph.workspaces.some((workspace) => hasDeclaredDependency(workspace, packageName));
const getDeclaredDependencyBuckets = (workspace, packageName) =>
  dependencyBucketNames.filter((bucketName) =>
    workspace.dependencyBuckets[bucketName].has(packageName),
  );
const createDependencyFinding = (
  graph,
  workspace,
  packageName,
  dependencyBucket,
  sourceKind = "import",
) => {
  const usage = findUsage(graph, workspace, packageName);
  const file = usage ? graph.files[usage.fromFileId] : void 0;
  return {
    workspace,
    packageName,
    file,
    importRecord: file
      ? graph.nodes
          .get(file.id)
          ?.imports.find((resolvedImport) => resolvedImport.packageName === packageName)
          ?.importRecord
      : void 0,
    dependencyBucket,
    sourceKind,
  };
};
const createDuplicateDependencyFinding = (workspace, packageName) => ({
  workspace,
  packageName,
  dependencyBuckets: getDeclaredDependencyBuckets(workspace, packageName),
});
const collectDuplicateDependencyDeclarations = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.dependencyNames]
      .filter((packageName) => getDeclaredDependencyBuckets(workspace, packageName).length > 1)
      .map((packageName) => createDuplicateDependencyFinding(workspace, packageName)),
  );
const collectUnresolvedImports = (graph) =>
  graph.unresolvedImports.flatMap((resolvedImport) => {
    const file = graph.files.find((projectFile) =>
      graph.nodes.get(projectFile.id)?.imports.includes(resolvedImport),
    );
    if (!file) return [];
    return [
      {
        file,
        importRecord: resolvedImport.importRecord,
        error: resolvedImport.error ?? "Unable to resolve import.",
      },
    ];
  });
const collectUnlistedImportDependencies = (graph) =>
  graph.packageUsages
    .filter((usage) => {
      const workspace = graph.workspaces[usage.workspaceId];
      return (
        workspace &&
        !hasDeclaredDependency(workspace, usage.packageName) &&
        !hasDeclaredDependencyInGraph(graph, usage.packageName)
      );
    })
    .map((usage) => {
      const workspace = graph.workspaces[usage.workspaceId];
      return createDependencyFinding(graph, workspace, usage.packageName);
    });
const collectUnlistedManifestDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.manifestDependencyNames]
      .filter((packageName) => !hasDeclaredDependency(workspace, packageName))
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, void 0, "manifest"),
      ),
  );
const collectUnlistedScriptDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.scriptDependencyNames]
      .filter((packageName) => !hasDeclaredDependency(workspace, packageName))
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, void 0, "script"),
      ),
  );
const collectUnlistedTypeScriptConfigDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.typeScriptConfigDependencyNames]
      .filter((packageName) => !hasDeclaredDependency(workspace, packageName))
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, void 0, "config"),
      ),
  );
const collectUnlistedDependencies = (graph) => [
  ...collectUnlistedImportDependencies(graph),
  ...collectUnlistedManifestDependencies(graph),
  ...collectUnlistedScriptDependencies(graph),
  ...collectUnlistedTypeScriptConfigDependencies(graph),
];
const collectUnusedDependencies = (graph, bucketName) =>
  graph.workspaces.flatMap((workspace) => {
    const usedPackages = getUsedPackages(graph, workspace);
    return [...workspace.dependencyBuckets[bucketName].keys()]
      .filter((packageName) => !usedPackages.has(packageName))
      .map((packageName) => createDependencyFinding(graph, workspace, packageName, bucketName));
  });
const collectUnusedOptionalPeerDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.dependencyBuckets.peerDependencies.keys()]
      .filter((packageName) => isOptionalPeerDependency(workspace, packageName))
      .filter((packageName) => !getUsedPackages(graph, workspace).has(packageName))
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, "peerDependencies"),
      ),
  );
const collectUnusedPeerDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) => {
    const usedPackages = getUsedPackages(graph, workspace);
    return [...workspace.dependencyBuckets.peerDependencies.keys()]
      .filter((packageName) => !isOptionalPeerDependency(workspace, packageName))
      .filter((packageName) => !usedPackages.has(packageName))
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, "peerDependencies"),
      );
  });
const collectUnusedOptionalDependencies = (graph) =>
  collectUnusedDependencies(graph, "optionalDependencies");
const collectRuntimeDevDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.dependencyBuckets.devDependencies.keys()]
      .filter((packageName) => !workspace.dependencyBuckets.dependencies.has(packageName))
      .filter((packageName) =>
        graph.packageUsages.some(
          (usage) =>
            usage.workspaceId === workspace.id &&
            usage.packageName === packageName &&
            usage.isRuntime &&
            !usage.isTypeOnly,
        ),
      )
      .map((packageName) =>
        createDependencyFinding(graph, workspace, packageName, "devDependencies"),
      ),
  );
const collectTypeOnlyDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.dependencyBuckets.dependencies.keys()]
      .filter((packageName) => {
        if (getNonImportUsedPackages(graph, workspace).has(packageName)) return false;
        const usages = graph.packageUsages.filter(
          (usage) => usage.workspaceId === workspace.id && usage.packageName === packageName,
        );
        return usages.length > 0 && usages.every((usage) => usage.isTypeOnly);
      })
      .map((packageName) => createDependencyFinding(graph, workspace, packageName, "dependencies")),
  );
const collectTestOnlyDependencies = (graph) =>
  graph.workspaces.flatMap((workspace) =>
    [...workspace.dependencyBuckets.dependencies.keys()]
      .filter((packageName) => {
        if (getNonImportUsedPackages(graph, workspace).has(packageName)) return false;
        const usages = graph.packageUsages.filter(
          (usage) => usage.workspaceId === workspace.id && usage.packageName === packageName,
        );
        return usages.length > 0 && usages.every((usage) => usage.isTestOnly);
      })
      .map((packageName) => createDependencyFinding(graph, workspace, packageName, "dependencies")),
  );
const toUnresolvedImportIssue = (finding) =>
  createCodebaseIssue$1({
    id: `${DEPENDENCIES_CHECK_ID}/unresolved/${finding.file.relativePath}/${finding.importRecord.source}`,
    title: "Unresolved import",
    message: `The import "${finding.importRecord.source}" could not be resolved.`,
    severity: "error",
    location: {
      filePath: finding.file.relativePath,
      line: finding.importRecord.position.line,
      column: finding.importRecord.position.column,
    },
    recommendation:
      "Fix the specifier, dependency, tsconfig path, or generated module configuration.",
    source: {
      checkId: DEPENDENCIES_CHECK_ID,
      ruleId: "unresolved-import",
    },
  });
const toDependencyIssue = (finding, ruleId, title, message) =>
  createCodebaseIssue$1({
    id: `${DEPENDENCIES_CHECK_ID}/${ruleId}/${finding.workspace.name}/${finding.packageName}`,
    title,
    message,
    location: finding.file
      ? {
          filePath: finding.file.relativePath,
          line: finding.importRecord?.position.line,
          column: finding.importRecord?.position.column,
        }
      : { filePath: finding.workspace.relativeDirectory },
    recommendation: "Update the nearest package.json dependency bucket to match actual usage.",
    source: {
      checkId: DEPENDENCIES_CHECK_ID,
      ruleId,
    },
  });
const getUnlistedDependencyMessage = (finding) => {
  if (finding.sourceKind === "script")
    return `"${finding.packageName}" is used by package.json scripts but not listed in the workspace package.json.`;
  if (finding.sourceKind === "manifest")
    return `"${finding.packageName}" is referenced by package.json configuration but not listed in the workspace package.json.`;
  if (finding.sourceKind === "config")
    return `"${finding.packageName}" is referenced by tsconfig.json but not listed in the workspace package.json.`;
  return `"${finding.packageName}" is imported but not listed in the workspace package.json.`;
};
const getDuplicateDependencyMessage = (finding) =>
  `"${finding.packageName}" is declared in multiple dependency buckets: ${(finding.dependencyBuckets ?? []).join(", ")}.`;
const inspectDependencies = (graph) =>
  sortIssues$1([
    ...collectUnresolvedImports(graph).map(toUnresolvedImportIssue),
    ...collectDuplicateDependencyDeclarations(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "duplicate-dependency-declaration",
        "Duplicate dependency declaration",
        getDuplicateDependencyMessage(finding),
      ),
    ),
    ...collectUnlistedDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "unlisted-dependency",
        "Unlisted dependency",
        getUnlistedDependencyMessage(finding),
      ),
    ),
    ...collectUnusedDependencies(graph, "dependencies").map((finding) =>
      toDependencyIssue(
        finding,
        "unused-dependency",
        "Unused dependency",
        `"${finding.packageName}" is listed in dependencies but not used.`,
      ),
    ),
    ...collectUnusedDependencies(graph, "devDependencies").map((finding) =>
      toDependencyIssue(
        finding,
        "unused-dev-dependency",
        "Unused dev dependency",
        `"${finding.packageName}" is listed in devDependencies but not used.`,
      ),
    ),
    ...collectUnusedOptionalPeerDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "unused-optional-peer-dependency",
        "Unused optional peer dependency",
        `"${finding.packageName}" is listed as an optional peer but not used.`,
      ),
    ),
    ...collectUnusedPeerDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "unused-peer-dependency",
        "Unused peer dependency",
        `"${finding.packageName}" is listed in peerDependencies but not used.`,
      ),
    ),
    ...collectUnusedOptionalDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "unused-optional-dependency",
        "Unused optional dependency",
        `"${finding.packageName}" is listed in optionalDependencies but not used.`,
      ),
    ),
    ...collectRuntimeDevDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "runtime-dev-dependency",
        "Runtime dependency listed in devDependencies",
        `"${finding.packageName}" is imported by runtime code but listed in devDependencies.`,
      ),
    ),
    ...collectTypeOnlyDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "type-only-dependency",
        "Type-only production dependency",
        `"${finding.packageName}" is only used in type positions.`,
      ),
    ),
    ...collectTestOnlyDependencies(graph).map((finding) =>
      toDependencyIssue(
        finding,
        "test-only-dependency",
        "Test-only production dependency",
        `"${finding.packageName}" is only used from test entrypoints.`,
      ),
    ),
  ]);
const dependenciesRule = defineRule({
  metadata: {
    id: DEPENDENCIES_RULE_ID,
    name: "Codebase dependencies",
    description:
      "Builds a workspace-aware module graph and reports unresolved, unlisted, unused, type-only, and test-only dependencies.",
    category: "dependencies",
    severity: "warning",
    defaultEnabled: false,
    tags: ["codebase", "dependencies", "oxc"],
  },
  run: async ({ rootDirectory, includePaths, excludePatterns, signal, getCodebaseAnalysis }) => {
    return {
      issues: inspectDependencies(
        (
          await (getCodebaseAnalysis?.() ??
            runCodebaseAnalysis({
              rootDirectory,
              includePaths,
              excludePatterns,
              signal,
            }))
        ).graph,
      ),
    };
  },
});
//#endregion
//#region src/core/rules/codebase/react-architecture.ts
const REACT_ARCHITECTURE_RULE_ID = REACT_ARCHITECTURE_CHECK_ID;
const createCodebaseIssue = (issue) => ({
  severity: issue.severity ?? "warning",
  category: issue.category ?? "codebase",
  ...issue,
});
const sortIssues = (issues) =>
  issues.sort((first, second) => {
    const firstPath = first.location?.filePath ?? "";
    const secondPath = second.location?.filePath ?? "";
    return (
      firstPath.localeCompare(secondPath) ||
      (first.location?.line ?? 0) - (second.location?.line ?? 0) ||
      first.id.localeCompare(second.id)
    );
  });
const isClientNode = (node) => node.directives.has(REACT_CLIENT_DIRECTIVE);
const isServerOnlyTarget = (graph, resolvedImport) => {
  if (resolvedImport.packageName === "server-only") return true;
  return false;
};
const isServerActionBoundary = (graph, resolvedImport) => {
  if (resolvedImport.targetKind !== "internal" || !resolvedImport.targetFilePath) return false;
  const targetFileId = graph.pathToFileId.get(resolvedImport.targetFilePath);
  if (typeof targetFileId !== "number") return false;
  const targetNode = graph.nodes.get(targetFileId);
  return Boolean(targetNode?.directives.has(REACT_SERVER_DIRECTIVE));
};
const collectClientBoundaryViolations = (graph) => {
  const findings = [];
  for (const node of graph.nodes.values()) {
    if (!isClientNode(node)) continue;
    const pending = [
      {
        currentNode: node,
        firstImport: null,
      },
    ];
    const visited = /* @__PURE__ */ new Set();
    while (pending.length > 0) {
      const item = pending.pop();
      if (!item || visited.has(item.currentNode.file.id)) continue;
      visited.add(item.currentNode.file.id);
      for (const resolvedImport of item.currentNode.imports) {
        const firstImport = item.firstImport ?? resolvedImport;
        if (isServerOnlyTarget(graph, resolvedImport)) {
          findings.push({
            file: node.file,
            targetFile: resolvedImport.targetFilePath
              ? graph.nodes.get(graph.pathToFileId.get(resolvedImport.targetFilePath) ?? -1)?.file
              : void 0,
            importRecord: firstImport.importRecord,
          });
          continue;
        }
        if (isServerActionBoundary(graph, resolvedImport)) continue;
        if (resolvedImport.targetKind === "internal" && resolvedImport.targetFilePath) {
          const targetNode = graph.nodes.get(
            graph.pathToFileId.get(resolvedImport.targetFilePath) ?? -1,
          );
          if (targetNode)
            pending.push({
              currentNode: targetNode,
              firstImport,
            });
        }
      }
    }
  }
  return findings;
};
const collectBarrelHotspots = (graph) =>
  [...graph.nodes.values()]
    .filter((node) => node.exports.size >= 5 && node.importedBy.size >= 3)
    .map((node) => ({
      file: node.file,
      exportCount: node.exports.size,
      importerCount: node.importedBy.size,
    }));
const getInternalImportTargets = (graph, node) =>
  [
    ...new Set(
      node.imports
        .filter(
          (resolvedImport) =>
            resolvedImport.targetKind === "internal" &&
            resolvedImport.targetFilePath &&
            !resolvedImport.importRecord.isTypeOnly,
        )
        .map((resolvedImport) => graph.pathToFileId.get(resolvedImport.targetFilePath ?? ""))
        .filter((fileId) => typeof fileId === "number"),
    ),
  ].sort((first, second) => {
    const firstPath = graph.nodes.get(first)?.file.relativePath ?? "";
    const secondPath = graph.nodes.get(second)?.file.relativePath ?? "";
    return firstPath.localeCompare(secondPath);
  });
const sortFileIdsByPath = (graph, fileIds) =>
  [...fileIds].sort((first, second) => {
    const firstPath = graph.nodes.get(first)?.file.relativePath ?? "";
    const secondPath = graph.nodes.get(second)?.file.relativePath ?? "";
    return firstPath.localeCompare(secondPath);
  });
const visitStronglyConnectedComponent = (graph, fileId, state) => {
  state.indexByFileId.set(fileId, state.index);
  state.lowLinkByFileId.set(fileId, state.index);
  state.index++;
  state.stack.push(fileId);
  state.fileIdsOnStack.add(fileId);
  const node = graph.nodes.get(fileId);
  if (node) {
    for (const targetFileId of getInternalImportTargets(graph, node))
      if (!state.indexByFileId.has(targetFileId)) {
        visitStronglyConnectedComponent(graph, targetFileId, state);
        state.lowLinkByFileId.set(
          fileId,
          Math.min(
            state.lowLinkByFileId.get(fileId) ?? 0,
            state.lowLinkByFileId.get(targetFileId) ?? 0,
          ),
        );
      } else if (state.fileIdsOnStack.has(targetFileId))
        state.lowLinkByFileId.set(
          fileId,
          Math.min(
            state.lowLinkByFileId.get(fileId) ?? 0,
            state.indexByFileId.get(targetFileId) ?? 0,
          ),
        );
  }
  if (state.lowLinkByFileId.get(fileId) !== state.indexByFileId.get(fileId)) return;
  const component = [];
  while (state.stack.length > 0) {
    const stackedFileId = state.stack.pop();
    if (typeof stackedFileId !== "number") break;
    state.fileIdsOnStack.delete(stackedFileId);
    component.push(stackedFileId);
    if (stackedFileId === fileId) break;
  }
  if (component.length > 1) state.components.push(sortFileIdsByPath(graph, component));
};
const collectCircularImports = (graph) => {
  const state = {
    index: 0,
    stack: [],
    indexByFileId: /* @__PURE__ */ new Map(),
    lowLinkByFileId: /* @__PURE__ */ new Map(),
    fileIdsOnStack: /* @__PURE__ */ new Set(),
    components: [],
  };
  for (const fileId of sortFileIdsByPath(graph, [...graph.nodes.keys()]))
    if (!state.indexByFileId.has(fileId)) visitStronglyConnectedComponent(graph, fileId, state);
  return state.components.map((cycle) => ({
    files: cycle.flatMap((fileId) => {
      const file = graph.nodes.get(fileId)?.file;
      return file ? [file] : [];
    }),
  }));
};
const toCircularDependencyIssue = (finding) =>
  createCodebaseIssue({
    id: `${REACT_ARCHITECTURE_CHECK_ID}/circular/${finding.files.map((file) => file.relativePath).join(">")}`,
    title: "Circular import",
    message: `These files form a cycle: ${finding.files.map((file) => file.relativePath).join(" -> ")}.`,
    location: { filePath: finding.files[0]?.relativePath ?? "" },
    recommendation: "Extract shared code or invert one dependency edge.",
    source: {
      checkId: REACT_ARCHITECTURE_CHECK_ID,
      ruleId: "circular-import",
    },
  });
const toBoundaryIssue = (finding) =>
  createCodebaseIssue({
    id: `${REACT_ARCHITECTURE_CHECK_ID}/client-server/${finding.file.relativePath}/${finding.importRecord.source}`,
    title: "Client module reaches server-only code",
    message: `The client graph reaches server-only import "${finding.importRecord.source}".`,
    severity: "error",
    location: {
      filePath: finding.file.relativePath,
      line: finding.importRecord.position.line,
      column: finding.importRecord.position.column,
    },
    recommendation: "Move the import behind a server component boundary or split shared code.",
    source: {
      checkId: REACT_ARCHITECTURE_CHECK_ID,
      ruleId: "client-server-boundary",
    },
  });
const toBarrelIssue = (finding) =>
  createCodebaseIssue({
    id: `${REACT_ARCHITECTURE_CHECK_ID}/barrel/${finding.file.relativePath}`,
    title: "Barrel import hotspot",
    message: `This module exports ${finding.exportCount} symbols and is imported by ${finding.importerCount} modules.`,
    location: { filePath: finding.file.relativePath },
    recommendation: "Prefer direct imports when the barrel inflates the dependency graph.",
    source: {
      checkId: REACT_ARCHITECTURE_CHECK_ID,
      ruleId: "barrel-hotspot",
    },
  });
const inspectReactArchitecture = (graph) =>
  sortIssues([
    ...collectClientBoundaryViolations(graph).map(toBoundaryIssue),
    ...collectCircularImports(graph).map(toCircularDependencyIssue),
    ...collectBarrelHotspots(graph).map(toBarrelIssue),
  ]);
const reactArchitectureRule = defineRule({
  metadata: {
    id: REACT_ARCHITECTURE_RULE_ID,
    name: "Codebase React architecture",
    description:
      "Builds a project module graph and reports React architecture boundary and dependency issues.",
    category: "react-architecture",
    severity: "warning",
    defaultEnabled: false,
    tags: ["codebase", "react-architecture", "oxc"],
  },
  run: async ({ rootDirectory, includePaths, excludePatterns, signal, getCodebaseAnalysis }) => {
    return {
      issues: inspectReactArchitecture(
        (
          await (getCodebaseAnalysis?.() ??
            runCodebaseAnalysis({
              rootDirectory,
              includePaths,
              excludePatterns,
              signal,
            }))
        ).graph,
      ),
    };
  },
});
//#endregion
//#region src/core/rules/lint/metadata.ts
const REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE = "react-doctor";
const REACT_DOCTOR_OXLINT_RULE_ID_PREFIX = "oxlint/react-doctor/";
const toTitleCaseWord = (word) => {
  const [firstLetter, ...remainingLetters] = word;
  if (firstLetter === void 0) return word;
  return `${firstLetter.toUpperCase()}${remainingLetters.join("")}`;
};
const toRuleDisplayName = (ruleName) => ruleName.split("-").map(toTitleCaseWord).join(" ");
const toReactDoctorSeverity = (severity) => {
  if (severity === "error") return "error";
  if (severity === "off") return "info";
  return "warning";
};
const reactDoctorOxlintRuleMetadata = Object.entries(reactDoctorOxlintRules)
  .sort(([ruleName], [nextRuleName]) => ruleName.localeCompare(nextRuleName))
  .map(([ruleName, rule]) => {
    const oxlintRuleKey = `${REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE}/${ruleName}`;
    const severity = REACT_DOCTOR_CUSTOM_OXLINT_RULES[oxlintRuleKey] ?? "warn";
    return {
      id: `${REACT_DOCTOR_OXLINT_RULE_ID_PREFIX}${ruleName}`,
      name: toRuleDisplayName(ruleName),
      description: `Runs the ${oxlintRuleKey} custom oxlint rule.`,
      recommendation: rule.recommendation,
      examples: rule.examples,
      category: "oxlint",
      severity: toReactDoctorSeverity(severity),
      defaultEnabled: false,
      tags: ["oxlint", "custom", REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE],
      oxlintRuleName: ruleName,
      oxlintRuleKey,
    };
  });
//#endregion
//#region src/core/rules/index.ts
const coreRules = [
  reactProjectStructureRule,
  deadCodeRule,
  dependenciesRule,
  reactArchitectureRule,
];
const createRuleRegistry = (options = {}) =>
  createRuleRegistry$1({
    ...options,
    rules: options.rules ?? coreRules,
  });
createRuleRegistry();
//#endregion
//#region src/core/runners/collect-ignore-patterns.ts
const IGNORE_FILENAMES = [".eslintignore", ".oxlintignore"];
const PRETTIERIGNORE_FILENAME = ".prettierignore";
const BUILTIN_IGNORE_PATTERNS = [
  "*.min.js",
  "*.min.mjs",
  "*.bundle.js",
  "*.global.js",
  "*.umd.js",
  "*.production.js",
  "*.development.js",
  "vendor/**",
  "vendors/**",
];
const SOURCE_EXTENSION_GLOB_PATTERN = /^\*\.(?:[cm]?[jt]sx?|json|jsonc)$/;
const LINGUIST_ATTRIBUTE_PATTERN = /^linguist-(?:vendored|generated)(?:=([a-zA-Z0-9]+))?$/i;
const FALSY_LINGUIST_VALUES = new Set(["false", "0", "off", "no"]);
const stripGitignoreEscape = (pattern) => {
  if (pattern.startsWith("\\#") || pattern.startsWith("\\!")) return pattern.slice(1);
  return pattern;
};
const readIgnoreFile = (filePath) => {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const patterns = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    patterns.push(stripGitignoreEscape(trimmed));
  }
  return patterns;
};
const isTruthyLinguistAttribute = (token) => {
  const match = LINGUIST_ATTRIBUTE_PATTERN.exec(token);
  if (!match) return false;
  if (match[1] === void 0) return true;
  return !FALSY_LINGUIST_VALUES.has(match[1].toLowerCase());
};
const parseGitattributesLinguistPaths = (filePath) => {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const paths = [];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) continue;
    const [pathSpec, ...attributes] = tokens;
    if (attributes.some(isTruthyLinguistAttribute)) paths.push(pathSpec);
  }
  return paths;
};
const translatePattern = (pattern, relPath) => {
  if (relPath === "") return pattern;
  const isNegation = pattern.startsWith("!");
  let body = isNegation ? pattern.slice(1) : pattern;
  const isAnchored = body.startsWith("/");
  if (isAnchored) body = body.slice(1);
  if (!isAnchored && !body.includes("/")) return pattern;
  const prefix = `${relPath}/`;
  if (!body.startsWith(prefix)) return null;
  const remaining = body.slice(prefix.length);
  return `${isNegation ? "!" : ""}${remaining}`;
};
const collectIgnorePatterns = (rootDirectory) => {
  const seen = /* @__PURE__ */ new Set();
  const patterns = [];
  const add = (pattern) => {
    if (seen.has(pattern)) return;
    seen.add(pattern);
    patterns.push(pattern);
  };
  for (const builtinPattern of BUILTIN_IGNORE_PATTERNS) add(builtinPattern);
  let currentDirectory = rootDirectory;
  while (true) {
    const relPath = path.relative(currentDirectory, rootDirectory);
    for (const fileName of IGNORE_FILENAMES)
      for (const pattern of readIgnoreFile(path.join(currentDirectory, fileName))) {
        const translated = translatePattern(pattern, relPath);
        if (translated !== null) add(translated);
      }
    for (const pattern of readIgnoreFile(path.join(currentDirectory, PRETTIERIGNORE_FILENAME))) {
      if (SOURCE_EXTENSION_GLOB_PATTERN.test(pattern)) continue;
      const translated = translatePattern(pattern, relPath);
      if (translated !== null) add(translated);
    }
    for (const linguistPath of parseGitattributesLinguistPaths(
      path.join(currentDirectory, ".gitattributes"),
    )) {
      const translated = translatePattern(linguistPath, relPath);
      if (translated !== null) add(translated);
    }
    if (fs.existsSync(path.join(currentDirectory, ".git"))) break;
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) break;
    currentDirectory = parentDirectory;
  }
  return patterns;
};
//#endregion
//#region src/core/runners/oxlint.ts
const OXLINT_CHECK_ID = "react-doctor/oxlint";
const esmRequire = createRequire(import.meta.url);
const OXLINT_STDERR_PREVIEW_LENGTH = 2e3;
const USER_LINT_CONFIG_FILENAMES = [".oxlintrc.json", ".eslintrc.json"];
const TSCONFIG_FILENAMES = ["tsconfig.json", "tsconfig.base.json"];
const resolveTsconfigRelativePath = (rootDirectory) => {
  for (const fileName of TSCONFIG_FILENAMES)
    if (existsSync(path.join(rootDirectory, fileName))) return `./${fileName}`;
  return null;
};
const metadataByRuleKey = new Map(
  reactDoctorOxlintRuleMetadata.map((metadata) => [metadata.oxlintRuleKey, metadata]),
);
const resolveOxlintBinary = () => {
  try {
    const packageJsonPath = esmRequire.resolve("oxlint/package.json");
    return path.join(path.dirname(packageJsonPath), "bin/oxlint");
  } catch (error) {
    throw new ReactDoctorRunnerUnavailableError(
      OXLINT_CHECK_ID,
      "Oxlint is not installed. Add oxlint to the project or install react-doctor-v2 dependencies.",
      { cause: error },
    );
  }
};
const resolvePluginPath = () => {
  const candidatePaths = [
    fileURLToPath(new URL("./oxlint-plugin.js", import.meta.url)),
    fileURLToPath(new URL("../../oxlint-plugin.js", import.meta.url)),
  ];
  return candidatePaths.find((candidatePath) => existsSync(candidatePath)) ?? candidatePaths[0];
};
const detectUserLintConfigPaths = (rootDirectory) => {
  let currentDirectory = rootDirectory;
  while (true) {
    for (const fileName of USER_LINT_CONFIG_FILENAMES) {
      const configPath = path.join(currentDirectory, fileName);
      if (existsSync(configPath)) return [configPath];
    }
    if (existsSync(path.join(currentDirectory, ".git"))) return [];
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) return [];
    currentDirectory = parentDirectory;
  }
};
const splitRuleCode = (code) => {
  const separatorIndex = code.indexOf("/");
  if (separatorIndex < 0)
    return {
      pluginName: "oxlint",
      ruleId: code,
    };
  return {
    pluginName: code.slice(0, separatorIndex),
    ruleId: code.slice(separatorIndex + 1),
  };
};
const toRelativeFilename = (rootDirectory, filename) => {
  if (!filename) return "";
  if (!path.isAbsolute(filename)) return filename;
  return path.relative(rootDirectory, filename);
};
const toReactDoctorIssue = (diagnostic, rootDirectory) => {
  const code = diagnostic.code ?? "oxlint/unknown";
  const ruleSource = splitRuleCode(code);
  const metadata = metadataByRuleKey.get(code);
  const firstSpan = diagnostic.labels?.[0]?.span;
  const filePath = toRelativeFilename(rootDirectory, diagnostic.filename);
  const severity = diagnostic.severity === "error" ? "error" : "warning";
  return {
    id: `${OXLINT_CHECK_ID}/${code}/${filePath}/${firstSpan?.line ?? 0}/${firstSpan?.column ?? 0}`,
    title: metadata?.name ?? code,
    message: diagnostic.message ?? code,
    severity,
    category: metadata?.category ?? "oxlint",
    recommendation: metadata?.recommendation ?? diagnostic.help,
    location: filePath
      ? {
          filePath,
          line: firstSpan?.line,
          column: firstSpan?.column,
          endLine: firstSpan?.endLine,
          endColumn: firstSpan?.endColumn,
        }
      : void 0,
    source: {
      checkId: OXLINT_CHECK_ID,
      pluginName: ruleSource.pluginName,
      ruleId: ruleSource.ruleId,
    },
  };
};
const formatOxlintOutputPreview = (stdout, stderr = "") => {
  return [stdout, stderr]
    .filter((value) => value.trim().length > 0)
    .join("\n")
    .trim()
    .slice(0, OXLINT_STDERR_PREVIEW_LENGTH);
};
const parseOxlintOutput = (stdout, rootDirectory, stderr = "") => {
  if (!stdout.trim()) return [];
  let output;
  try {
    output = JSON.parse(stdout);
  } catch (error) {
    const preview = formatOxlintOutputPreview(stdout, stderr);
    throw new ReactDoctorCheckFailedError(
      OXLINT_CHECK_ID,
      preview ? `Oxlint failed before returning JSON: ${preview}` : "Oxlint returned invalid JSON.",
      { cause: error },
    );
  }
  return (output.diagnostics ?? []).map((diagnostic) =>
    toReactDoctorIssue(diagnostic, rootDirectory),
  );
};
const spawnOxlint = (args, rootDirectory, signal) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: rootDirectory,
      signal,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode === 0 || exitCode === 1) {
        resolve({
          stdout,
          stderr,
        });
        return;
      }
      reject(
        new ReactDoctorCheckFailedError(
          OXLINT_CHECK_ID,
          `Oxlint failed with exit code ${exitCode ?? "unknown"}: ${stderr.slice(0, OXLINT_STDERR_PREVIEW_LENGTH)}`,
        ),
      );
    });
  });
const runOxlint = async (options) => {
  options.signal?.throwIfAborted();
  const configDirectory = await fs$1.mkdtemp(path.join(os.tmpdir(), "react-doctor-oxlint-"));
  const configPath = path.join(configDirectory, ".oxlintrc.json");
  const oxlintBinary = resolveOxlintBinary();
  const config = createReactDoctorOxlintConfig({
    pluginPath: resolvePluginPath(),
    project: options.project,
    customRulesOnly: options.customRulesOnly,
    includeEcosystemRules: options.includeEcosystemRules,
    extendsPaths:
      options.adoptExistingLintConfig === true && !options.customRulesOnly
        ? detectUserLintConfigPaths(options.rootDirectory)
        : [],
    ignoredTags: options.ignoredTags,
  });
  await fs$1.writeFile(configPath, JSON.stringify(config), { mode: 384 });
  try {
    const args = [
      oxlintBinary,
      "-c",
      configPath,
      "--format",
      "json",
      ...(options.excludePatterns ?? []).flatMap((pattern) => ["--ignore-pattern", pattern]),
    ];
    if (options.project.hasTypeScript) {
      const tsconfigRelativePath = resolveTsconfigRelativePath(options.rootDirectory);
      if (tsconfigRelativePath) args.push("--tsconfig", tsconfigRelativePath);
    }
    const combinedPatterns = collectIgnorePatterns(options.rootDirectory);
    if (combinedPatterns.length > 0) {
      const combinedIgnorePath = path.join(configDirectory, "combined.ignore");
      await fs$1.writeFile(combinedIgnorePath, `${combinedPatterns.join("\n")}\n`);
      args.push("--ignore-path", combinedIgnorePath);
    }
    args.push(...(options.includePaths?.length ? options.includePaths : ["."]));
    const { stdout, stderr } = await spawnOxlint(args, options.rootDirectory, options.signal);
    return parseOxlintOutput(stdout, options.rootDirectory, stderr);
  } finally {
    await fs$1.rm(configDirectory, {
      recursive: true,
      force: true,
    });
  }
};
//#endregion
//#region src/core/proxy-fetch.ts
const getGlobalProcess = () => {
  const candidate = globalThis.process;
  return candidate?.versions?.node ? candidate : void 0;
};
const getProxyUrl = () => {
  const proc = getGlobalProcess();
  if (!proc?.env) return void 0;
  return proc.env.HTTPS_PROXY ?? proc.env.https_proxy ?? proc.env.HTTP_PROXY ?? proc.env.http_proxy;
};
const createProxyDispatcher = async (proxyUrl) => {
  try {
    const { ProxyAgent } = await import("undici");
    return new ProxyAgent(proxyUrl);
  } catch {
    return null;
  }
};
const proxyFetch = async (url, init) => {
  const proxyUrl = getProxyUrl();
  const dispatcher = proxyUrl ? await createProxyDispatcher(proxyUrl) : null;
  const fetchInit = {
    ...init,
    ...(dispatcher ? { dispatcher } : {}),
  };
  return fetch(url, fetchInit);
};
//#endregion
//#region src/core/try-score-from-api.ts
const parseScoreResult = (value) => {
  if (typeof value !== "object" || value === null) return null;
  if (!("score" in value) || !("label" in value)) return null;
  const scoreValue = Reflect.get(value, "score");
  const labelValue = Reflect.get(value, "label");
  if (typeof scoreValue !== "number" || typeof labelValue !== "string") return null;
  return {
    value: scoreValue,
    label: labelValue,
  };
};
const issueToApiDiagnostic = (issue) => ({
  plugin: issue.source?.pluginName ?? issue.source?.checkId ?? "react-doctor",
  rule: issue.source?.ruleId ?? issue.id,
  severity: issue.severity === "error" ? "error" : "warning",
  message: issue.message,
  help: issue.recommendation ?? "",
  line: issue.location?.line ?? 0,
  column: issue.location?.column ?? 0,
  category: issue.category,
});
const isAbortError = (error) =>
  error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
const describeFailure = (error) => {
  if (isAbortError(error)) return `timed out after ${FETCH_TIMEOUT_MS / 1e3}s`;
  if (error instanceof Error && error.message) return error.message;
  return String(error);
};
const tryScoreFromApi = async (issues, fetchImplementation) => {
  if (typeof fetchImplementation !== "function") return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImplementation(SCORE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnostics: issues.map(issueToApiDiagnostic) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(
        `[react-doctor] Score API returned ${response.status} ${response.statusText} — using local scoring`,
      );
      return null;
    }
    return parseScoreResult(await response.json());
  } catch (error) {
    console.warn(
      `[react-doctor] Score API unreachable (${describeFailure(error)}) — using local scoring`,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
//#endregion
//#region src/core/inspect-react-project.ts
const mergeConfig = (loadedConfig, options) => ({
  ...loadedConfig?.config,
  ...options.config,
  lint: options.lint ?? options.config?.lint ?? loadedConfig?.config.lint,
  deadCode: options.deadCode ?? options.config?.deadCode ?? loadedConfig?.config.deadCode,
  customRulesOnly:
    options.customRulesOnly ??
    options.config?.customRulesOnly ??
    loadedConfig?.config.customRulesOnly,
  respectInlineDisables:
    options.respectInlineDisables ??
    options.config?.respectInlineDisables ??
    loadedConfig?.config.respectInlineDisables,
  offline: options.offline ?? options.config?.offline ?? loadedConfig?.config.offline,
});
const mergeRuleSelection = (selection, config) => {
  const enabledRuleIds = [...(selection?.enabledRuleIds ?? [])];
  if (config.deadCode)
    enabledRuleIds.push(DEAD_CODE_RULE_ID, DEPENDENCIES_RULE_ID, REACT_ARCHITECTURE_RULE_ID);
  return {
    enabledRuleIds,
    disabledRuleIds: selection?.disabledRuleIds,
  };
};
const readSourceLines = (rootDirectory, filePath) => {
  try {
    return fs.readFileSync(path.resolve(rootDirectory, filePath), "utf8").split(/\r?\n/);
  } catch {
    return;
  }
};
const readJsxImportSource = (rootDirectory) => {
  try {
    const tsconfigPath = path.resolve(rootDirectory, "tsconfig.json");
    const cleaned = fs
      .readFileSync(tsconfigPath, "utf8")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    return JSON.parse(cleaned)?.compilerOptions?.jsxImportSource;
  } catch {
    return;
  }
};
const createOxlintCheck = async (rootDirectory, config, options, project) => {
  if (config.lint !== true) return null;
  const startedMilliseconds = globalThis.performance.now();
  try {
    return {
      id: OXLINT_CHECK_ID,
      name: "Oxlint",
      status: "completed",
      issues: await runOxlint({
        rootDirectory,
        includePaths: options.includePaths,
        excludePatterns: options.excludePatterns,
        project: toOxlintProjectInfo(project),
        customRulesOnly: config.customRulesOnly,
        includeEcosystemRules: config.includeEcosystemRules,
        adoptExistingLintConfig: config.adoptExistingLintConfig,
        ignoredTags: config.ignoredTags ? new Set(config.ignoredTags) : void 0,
        signal: options.signal,
      }),
      durationMilliseconds: globalThis.performance.now() - startedMilliseconds,
    };
  } catch (error) {
    return {
      id: OXLINT_CHECK_ID,
      name: "Oxlint",
      status: "failed",
      issues: [],
      durationMilliseconds: globalThis.performance.now() - startedMilliseconds,
      error: toReactDoctorErrorInfo(error),
    };
  }
};
const applyIssueFiltering = (checks, filteredIssues) => {
  const issueIds = new Set(filteredIssues.map((issue) => issue.id));
  return checks.map((check) => ({
    ...check,
    issues: check.issues.filter((issue) => issueIds.has(issue.id)),
  }));
};
const inspectReactProjectCore = async (options = {}) => {
  options.signal?.throwIfAborted();
  const startedAt = /* @__PURE__ */ new Date();
  const startedMilliseconds = globalThis.performance.now();
  const requestedRootDirectory = path.resolve(options.rootDirectory ?? ".");
  const loadedConfig =
    options.config === void 0 ? await loadReactDoctorConfig(requestedRootDirectory) : null;
  const rootDirectory = await resolveConfigRootDirectory(loadedConfig, requestedRootDirectory);
  const config = mergeConfig(loadedConfig, options);
  const project = await discoverReactProject(rootDirectory);
  options.signal?.throwIfAborted();
  const registry = createRuleRegistry();
  let codebaseAnalysisPromise = null;
  const getCodebaseAnalysis = () => {
    codebaseAnalysisPromise ??= runCodebaseAnalysis({
      rootDirectory,
      includePaths: options.includePaths,
      excludePatterns: options.excludePatterns,
      signal: options.signal,
    });
    return codebaseAnalysisPromise;
  };
  const checks = await registry.runRules({
    rootDirectory,
    includePaths: options.includePaths,
    excludePatterns: options.excludePatterns,
    selection: mergeRuleSelection(options.rules, config),
    signal: options.signal,
    getCodebaseAnalysis,
  });
  const oxlintCheck = await createOxlintCheck(rootDirectory, config, options, project);
  const allChecks = oxlintCheck ? [...checks, oxlintCheck] : checks;
  const completedAt = /* @__PURE__ */ new Date();
  const issues = filterReactDoctorIssues(
    allChecks.flatMap((check) => check.issues),
    config,
    rootDirectory,
    (filePath) => readSourceLines(rootDirectory, filePath),
    { jsxImportSource: readJsxImportSource(rootDirectory) },
  );
  const filteredChecks = applyIssueFiltering(allChecks, issues);
  const hasFailedChecks = filteredChecks.some((check) => check.status === "failed");
  const score =
    (config.offline ? null : await tryScoreFromApi(issues, proxyFetch)) ??
    calculateReactDoctorScore(issues);
  return {
    status: hasFailedChecks ? "completed-with-errors" : "completed",
    project,
    issues,
    checks: filteredChecks,
    score,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMilliseconds: globalThis.performance.now() - startedMilliseconds,
  };
};
//#endregion
//#region src/sdk/create-react-doctor.ts
const mergeInspectOptions = (defaults, options) => ({
  ...defaults,
  ...options,
  rootDirectory: options.rootDirectory ?? defaults.rootDirectory,
});
const createReactDoctor = (options = {}) => ({
  inspect: (runOptions = {}) => inspectReactProjectCore(mergeInspectOptions(options, runOptions)),
});
//#endregion
//#region src/cli/index.ts
const VERSION = "0.0.0";
const REACT_PROJECT_DEPENDENCIES = new Set([
  "@remix-run/react",
  "@tanstack/react-start",
  "expo",
  "gatsby",
  "next",
  "react",
  "react-native",
  "react-scripts",
]);
const NON_INTERACTIVE_ENVIRONMENT_VARIABLES = [
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
];
const CI_ENVIRONMENT_VARIABLES = ["GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI"];
const isNonInteractiveEnvironment = () =>
  NON_INTERACTIVE_ENVIRONMENT_VARIABLES.some((envVariable) => Boolean(process.env[envVariable]));
const isCiEnvironment = () =>
  CI_ENVIRONMENT_VARIABLES.some((envVariable) => Boolean(process.env[envVariable])) ||
  process.env.CI === "true";
const isSourceFile = (filePath) => SOURCE_FILE_PATTERN.test(filePath);
const isReactWorkspace = (workspace) =>
  [...REACT_PROJECT_DEPENDENCIES].some((dependencyName) =>
    workspace.dependencyNames.has(dependencyName),
  );
const FILESYSTEM_WALK_IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "storybook-static",
]);
const hasReactDependencyInManifest = (manifest) => {
  for (const bucket of [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.peerDependencies,
    manifest.optionalDependencies,
  ]) {
    if (!bucket) continue;
    for (const dependencyName of REACT_PROJECT_DEPENDENCIES)
      if (dependencyName in bucket) return true;
  }
  return false;
};
const discoverReactProjectsByFilesystem = async (rootDirectory) => {
  const directories = [];
  const pending = [rootDirectory];
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) continue;
    try {
      const manifestText = await fs$1.readFile(path.join(current, "package.json"), "utf8");
      if (hasReactDependencyInManifest(JSON.parse(manifestText))) directories.push(current);
    } catch {}
    let entries;
    try {
      entries = await fs$1.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith(".") ||
        FILESYSTEM_WALK_IGNORED_DIRECTORIES.has(entry.name)
      )
        continue;
      pending.push(path.join(current, entry.name));
    }
  }
  return directories.sort((first, second) => first.localeCompare(second));
};
const toNamedProject = (workspace) => ({
  name: workspace.name ?? path.basename(workspace.directory),
  directory: workspace.directory,
});
const toNamedProjectFromDirectory = async (directory) => {
  try {
    const manifestText = await fs$1.readFile(path.join(directory, "package.json"), "utf8");
    return {
      name: JSON.parse(manifestText).name ?? path.basename(directory),
      directory,
    };
  } catch {
    return {
      name: path.basename(directory),
      directory,
    };
  }
};
const discoverProjects = async (rootDirectory, configHasRootDirectory, shouldUseSingleProject) => {
  if (configHasRootDirectory || shouldUseSingleProject)
    return [await toNamedProjectFromDirectory(rootDirectory)];
  const reactWorkspaces = (
    await discoverWorkspaces(createCodebaseAnalysisConfig({ rootDirectory }))
  ).filter(isReactWorkspace);
  if (reactWorkspaces.length > 1) return reactWorkspaces.map(toNamedProject);
  if (reactWorkspaces.length === 1) {
    const onlyWorkspace = reactWorkspaces[0];
    if (onlyWorkspace.directory !== rootDirectory) return [toNamedProject(onlyWorkspace)];
  }
  const filesystemDirectories = await discoverReactProjectsByFilesystem(rootDirectory);
  if (filesystemDirectories.length > 0)
    return Promise.all(filesystemDirectories.map(toNamedProjectFromDirectory));
  if (reactWorkspaces.length === 1) return [toNamedProject(reactWorkspaces[0])];
  return [await toNamedProjectFromDirectory(rootDirectory)];
};
const getGitFiles = (rootDirectory, args) => {
  const result = spawnSync("git", args, {
    cwd: rootDirectory,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) return [];
  return result.stdout
    .split("\0")
    .map((filePath) => filePath.trim())
    .filter((filePath) => filePath.length > 0 && isSourceFile(filePath));
};
const dedupeFilePaths = (filePaths) => [...new Set(filePaths)];
const resolveIncludePaths = (rootDirectory, flags) => {
  if (flags.unstaged)
    return dedupeFilePaths([
      ...getGitFiles(rootDirectory, ["diff", "--name-only", "-z"]),
      ...getGitFiles(rootDirectory, ["ls-files", "--others", "--exclude-standard", "-z"]),
    ]);
  if (flags.changed)
    return dedupeFilePaths([
      ...getGitFiles(rootDirectory, ["diff", "--name-only", "-z", "HEAD"]),
      ...getGitFiles(rootDirectory, ["ls-files", "--others", "--exclude-standard", "-z"]),
    ]);
  if (flags.diff)
    return getGitFiles(rootDirectory, [
      "diff",
      "--name-only",
      "-z",
      `${typeof flags.diff === "string" ? flags.diff : "main"}...HEAD`,
    ]);
};
const isChangedFileMode = (flags) =>
  flags.staged || flags.unstaged || flags.changed || Boolean(flags.diff);
const getCliOptionOverride = (command, optionName, value) =>
  command.getOptionValueSource(optionName) === "cli" ? value : void 0;
const resolveBooleanInspectOption = (command, optionName, flagValue, configValue, defaultValue) => {
  const cliValue = getCliOptionOverride(command, optionName, flagValue);
  if (cliValue !== void 0) return cliValue;
  return configValue === void 0 ? defaultValue : void 0;
};
const normalizeFailOnLevel = (value) => {
  if (value === "error" || value === "warning" || value === "none") return value;
  console.error(
    `[react-doctor] Invalid failOn level "${value}". Expected: error, warning, none. Falling back to "error".`,
  );
  return "error";
};
const shouldFailForIssues = (issues, failOnLevel) => {
  if (failOnLevel === "none") return false;
  if (failOnLevel === "warning") return issues.length > 0;
  return issues.some((issue) => issue.severity === "error");
};
const groupIssuesByRule = (issues) => {
  const groups = /* @__PURE__ */ new Map();
  for (const issue of issues) {
    const ruleKey = issue.title;
    const ruleIssues = groups.get(ruleKey) ?? [];
    ruleIssues.push(issue);
    groups.set(ruleKey, ruleIssues);
  }
  return groups;
};
const SEVERITY_ORDER = {
  error: 0,
  warning: 1,
  info: 2,
};
const buildCategoryGroups = (issues) => {
  const categoryMap = /* @__PURE__ */ new Map();
  for (const issue of issues) {
    const categoryIssues = categoryMap.get(issue.category) ?? [];
    categoryIssues.push(issue);
    categoryMap.set(issue.category, categoryIssues);
  }
  return [...categoryMap.entries()]
    .map(([category, categoryIssues]) => {
      return {
        category,
        issues: categoryIssues,
        ruleGroups: [...groupIssuesByRule(categoryIssues).entries()].toSorted(
          ([, issuesA], [, issuesB]) => {
            const severityDelta =
              (SEVERITY_ORDER[issuesA[0].severity] ?? 2) -
              (SEVERITY_ORDER[issuesB[0].severity] ?? 2);
            if (severityDelta !== 0) return severityDelta;
            return issuesB.length - issuesA.length;
          },
        ),
      };
    })
    .toSorted((groupA, groupB) => {
      const worstA = Math.min(...groupA.issues.map((issue) => SEVERITY_ORDER[issue.severity] ?? 2));
      const worstB = Math.min(...groupB.issues.map((issue) => SEVERITY_ORDER[issue.severity] ?? 2));
      if (worstA !== worstB) return worstA - worstB;
      if (groupA.issues.length !== groupB.issues.length)
        return groupB.issues.length - groupA.issues.length;
      return groupA.category.localeCompare(groupB.category);
    });
};
const encodeAnnotationProperty = (value) =>
  value
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C");
const encodeAnnotationMessage = (value) =>
  value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const printAnnotations = (issues, routeToStderr) => {
  const writeLine = routeToStderr
    ? (line) => process.stderr.write(`${line}\n`)
    : (line) => process.stdout.write(`${line}\n`);
  for (const issue of issues) {
    const level = issue.severity === "error" ? "error" : "warning";
    const title = issue.title;
    writeLine(
      `::${level} ${`file=${encodeAnnotationProperty(issue.location?.filePath ?? "")}`}${issue.location?.line ? `,line=${issue.location.line}` : ""}${`,title=${encodeAnnotationProperty(title)}`}::${encodeAnnotationMessage(issue.message)}`,
    );
  }
};
const formatElapsedTime = (elapsedMilliseconds) => {
  if (elapsedMilliseconds < 1e3) return `${Math.round(elapsedMilliseconds)}ms`;
  return `${(elapsedMilliseconds / MILLISECONDS_PER_SECOND).toFixed(1)}s`;
};
const formatFrameworkName = (framework) => {
  return (
    {
      nextjs: "Next.js",
      "react-native": "React Native",
      "tanstack-start": "TanStack Start",
      cra: "Create React App",
      expo: "Expo",
      gatsby: "Gatsby",
      remix: "Remix",
      vite: "Vite",
      react: "React",
    }[framework] ?? framework
  );
};
const printProjectDetection = (result) => {
  const projectInfo = result.project;
  const frameworkLabel = formatFrameworkName(projectInfo.framework);
  const languageLabel = projectInfo.hasTypeScript ? "TypeScript" : "JavaScript";
  const completedStep = (message) => {
    console.log(`  ${highlighter.success("✔")} ${message}`);
  };
  completedStep(`Detecting framework. Found ${highlighter.info(frameworkLabel)}.`);
  if (projectInfo.reactVersion)
    completedStep(
      `Detecting React version. Found ${highlighter.info(`React ${projectInfo.reactVersion}`)}.`,
    );
  completedStep(
    `Detecting Tailwind. ${projectInfo.tailwindVersion ? `Found ${highlighter.info(`Tailwind ${projectInfo.tailwindVersion}`)}.` : "Not found."}`,
  );
  completedStep(`Detecting language. Found ${highlighter.info(languageLabel)}.`);
  completedStep(
    `Detecting React Compiler. ${projectInfo.hasReactCompiler ? highlighter.info("Found React Compiler.") : "Not found."}`,
  );
  completedStep(`Found ${highlighter.info(`${projectInfo.sourceFileCount}`)} source files.`);
  for (const check of result.checks)
    if (check.status === "completed") completedStep(`${check.name}.`);
    else if (check.status === "failed")
      console.log(`  ${highlighter.error("✗")} ${check.name} failed (non-fatal, skipping).`);
  console.log("");
};
const printDefaultIssueGroup = (ruleTitle, ruleIssues) => {
  const firstIssue = ruleIssues[0];
  const marker = firstIssue.severity === "error" ? highlighter.error("✗") : highlighter.warn("⚠");
  const siteCountBadge =
    ruleIssues.length > 1 ? ` ${highlighter.gray(`×${ruleIssues.length}`)}` : "";
  console.log(`  ${marker} ${ruleTitle}${siteCountBadge}`);
  console.log(`    ${highlighter.gray(firstIssue.message)}`);
  if (firstIssue.recommendation) console.log(`    ${highlighter.gray(firstIssue.recommendation)}`);
  const firstLocation = ruleIssues.find((issue) => issue.location?.line);
  if (firstLocation?.location) {
    const locationPath = firstLocation.location.filePath ?? "";
    const line = firstLocation.location.line ? `:${firstLocation.location.line}` : "";
    console.log(`    ${highlighter.gray(`${locationPath}${line}`)}`);
  }
};
const printVerboseIssueGroup = (ruleTitle, ruleIssues) => {
  const firstIssue = ruleIssues[0];
  const marker = firstIssue.severity === "error" ? highlighter.error("✗") : highlighter.warn("⚠");
  const siteCountBadge =
    ruleIssues.length > 1 ? ` ${highlighter.gray(`×${ruleIssues.length}`)}` : "";
  console.log(`  ${marker} ${ruleTitle}${siteCountBadge}`);
  console.log(`      ${highlighter.gray(firstIssue.message)}`);
  if (firstIssue.recommendation)
    console.log(`      ${highlighter.gray(`→ ${firstIssue.recommendation}`)}`);
  for (const issue of ruleIssues)
    if (issue.location?.filePath && issue.location?.line)
      console.log(`      ${highlighter.gray(`${issue.location.filePath}:${issue.location.line}`)}`);
};
const printIssueSections = (issues, isVerbose) => {
  const categoryGroups = buildCategoryGroups(issues);
  if (isVerbose) {
    for (const categoryGroup of categoryGroups) {
      const issueCount = `${categoryGroup.issues.length} ${categoryGroup.issues.length === 1 ? "issue" : "issues"}`;
      console.log(`${highlighter.bold(categoryGroup.category)} ${highlighter.dim(issueCount)}`);
      for (const [ruleTitle, ruleIssues] of categoryGroup.ruleGroups)
        printVerboseIssueGroup(ruleTitle, ruleIssues);
      console.log("");
    }
    return;
  }
  const visibleCategoryGroups = categoryGroups.slice(0, 3);
  const hiddenCategoryGroups = categoryGroups.slice(3);
  const hiddenRuleGroups = [];
  for (const categoryGroup of visibleCategoryGroups) {
    const visibleRuleGroups = categoryGroup.ruleGroups.slice(0, 3);
    const remainingRuleGroups = categoryGroup.ruleGroups.slice(3);
    const issueCount = `${categoryGroup.issues.length} ${categoryGroup.issues.length === 1 ? "issue" : "issues"}`;
    console.log(`${highlighter.bold(categoryGroup.category)} ${highlighter.dim(issueCount)}`);
    for (const [ruleTitle, ruleIssues] of visibleRuleGroups)
      printDefaultIssueGroup(ruleTitle, ruleIssues);
    console.log("");
    hiddenRuleGroups.push(...remainingRuleGroups);
  }
  hiddenRuleGroups.push(
    ...hiddenCategoryGroups.flatMap((categoryGroup) => categoryGroup.ruleGroups),
  );
  if (hiddenRuleGroups.length > 0) {
    const hiddenIssueCount = hiddenRuleGroups.reduce(
      (total, [, ruleIssues]) => total + ruleIssues.length,
      0,
    );
    const hiddenRuleCount = hiddenRuleGroups.length;
    console.log(
      `  ${highlighter.dim(`… and ${hiddenRuleCount} more rules (${hiddenIssueCount} issues). Run \`npx react-doctor@latest . --verbose\` for all details.`)}`,
    );
    console.log("");
  }
};
const collectAffectedFiles = (issues) =>
  new Set(issues.flatMap((issue) => (issue.location?.filePath ? [issue.location.filePath] : [])));
const printCountsSummaryLine = (issues, totalSourceFileCount, elapsedMilliseconds) => {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const affectedFileCount = collectAffectedFiles(issues).size;
  const totalIssueCount = issues.length;
  const elapsedTimeLabel = formatElapsedTime(elapsedMilliseconds);
  const issueCountColor =
    errorCount > 0 ? highlighter.error : warningCount > 0 ? highlighter.warn : highlighter.dim;
  const issueCountText = `${totalIssueCount} ${totalIssueCount === 1 ? "issue" : "issues"}`;
  const fileCountText =
    totalSourceFileCount > 0
      ? `across ${affectedFileCount}/${totalSourceFileCount} files`
      : `across ${affectedFileCount} file${affectedFileCount === 1 ? "" : "s"}`;
  const elapsedTimeText = `in ${elapsedTimeLabel}`;
  console.log(
    `  ${issueCountColor(issueCountText)} ${highlighter.dim(`${fileCountText}  ${elapsedTimeText}`)}`,
  );
};
const buildShareUrl = (issues, score, projectName) => {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const affectedFileCount = collectAffectedFiles(issues).size;
  const params = new URLSearchParams();
  params.set("p", projectName);
  if (score !== null) params.set("s", String(score));
  if (errorCount > 0) params.set("e", String(errorCount));
  if (warningCount > 0) params.set("w", String(warningCount));
  if (affectedFileCount > 0) params.set("f", String(affectedFileCount));
  return `${SHARE_BASE_URL}?${params.toString()}`;
};
const writeDiagnosticsDirectory = (issues) => {
  try {
    const diagnosticsDirectory = path.join(tmpdir(), `react-doctor-diagnostics-${Date.now()}`);
    mkdirSync(diagnosticsDirectory, { recursive: true });
    writeFileSync(
      path.join(diagnosticsDirectory, "diagnostics.json"),
      JSON.stringify(issues, null, 2),
    );
    return diagnosticsDirectory;
  } catch {
    return null;
  }
};
const printVerboseScoreBreakdown = (issues, score) => {
  const ruleMap = /* @__PURE__ */ new Map();
  for (const issue of issues) {
    const ruleKey = issue.title;
    const existing = ruleMap.get(ruleKey);
    if (existing) {
      existing.count += 1;
      if (issue.severity === "error") existing.severity = "error";
    } else
      ruleMap.set(ruleKey, {
        severity: issue.severity,
        count: 1,
      });
  }
  const errorRules = [...ruleMap.entries()]
    .filter(([, info]) => info.severity === "error")
    .map(([key]) => key);
  const warningRules = [...ruleMap.entries()]
    .filter(([, info]) => info.severity !== "error")
    .map(([key]) => key);
  console.log("");
  console.log(
    highlighter.dim(
      `  Score: ${score} / 100 (${errorRules.length} error rules, ${warningRules.length} warning rules)`,
    ),
  );
  if (errorRules.length > 0)
    console.log(highlighter.dim(`  Error rules: ${errorRules.join(", ")}`));
  if (warningRules.length > 0)
    console.log(highlighter.dim(`  Warning rules: ${warningRules.join(", ")}`));
};
const printProjectHeader = (result) => {
  console.log(
    `${highlighter.bold(result.project.projectName)} ${highlighter.dim(result.project.rootDirectory)}`,
  );
  console.log("");
};
const printResultScoreBlock = (result) => {
  printScoreHeader(result.score?.value ?? 100, result.score?.label ?? "Great");
};
const printSkippedChecksWarning = (result) => {
  const failedChecks = result.checks
    .filter((check) => check.status === "failed" || check.status === "skipped")
    .map((check) => check.name);
  if (failedChecks.length > 0) {
    const skippedLabel = failedChecks.join(" and ");
    console.log(
      `  ${highlighter.warn(`Note: ${skippedLabel} checks failed — score may be incomplete.`)}`,
    );
    console.log("");
  }
};
const printInspectionResult = (result, flags, isOffline) => {
  if (flags.json) {
    const report = buildReactDoctorJsonReport(result);
    process.stdout.write(
      `${flags.jsonCompact ? JSON.stringify(report) : JSON.stringify(report, null, 2)}\n`,
    );
    return;
  }
  printProjectHeader(result);
  printProjectDetection(result);
  if (result.issues.length === 0) {
    console.log(`${highlighter.success("✔")} No React Doctor issues found.`);
    console.log("");
    printResultScoreBlock(result);
    printSkippedChecksWarning(result);
    printReactReviewCta();
    return;
  }
  printIssueSections(result.issues, flags.verbose);
  printResultScoreBlock(result);
  printCountsSummaryLine(
    result.issues,
    result.project.sourceFileCount,
    result.durationMilliseconds,
  );
  const diagnosticsDirectory = writeDiagnosticsDirectory(result.issues);
  if (diagnosticsDirectory)
    console.log(highlighter.gray(`  Full diagnostics written to ${diagnosticsDirectory}`));
  if (!isOffline) {
    console.log("");
    const shareUrl = buildShareUrl(
      result.issues,
      result.score?.value ?? null,
      result.project.projectName,
    );
    console.log(`  ${highlighter.bold("→ Share your results:")} ${highlighter.info(shareUrl)}`);
  }
  if (flags.verbose && result.score && result.issues.length > 0)
    printVerboseScoreBreakdown(result.issues, result.score.value);
  printSkippedChecksWarning(result);
  console.log("");
  printReactReviewCta();
};
const toAggregateJsonReport = (results) => {
  const reports = results.map(buildReactDoctorJsonReport);
  const issues = results.flatMap((result) => result.issues);
  const checks = results.flatMap((result) => result.checks);
  const affectedFiles = new Set(
    issues.flatMap((issue) => (issue.location?.filePath ? [issue.location.filePath] : [])),
  );
  const scores = results
    .map((result) => result.score?.value)
    .filter((score) => typeof score === "number");
  const worstScore = scores.length ? Math.min(...scores) : null;
  const worstScoreLabel =
    results.find((result) => result.score?.value === worstScore)?.score?.label ?? null;
  return {
    schemaVersion: 1,
    ok: reports.every((report) => report.ok),
    projects: reports.map((report) => ({
      project: report.project,
      issues: report.issues,
      checks: report.checks,
      summary: report.summary,
      startedAt: report.startedAt,
      completedAt: report.completedAt,
      durationMilliseconds: report.durationMilliseconds,
    })),
    issues,
    checks,
    summary: {
      errorCount: issues.filter((issue) => issue.severity === "error").length,
      warningCount: issues.filter((issue) => issue.severity === "warning").length,
      affectedFileCount: affectedFiles.size,
      totalIssueCount: issues.length,
      score: worstScore,
      scoreLabel: worstScoreLabel,
    },
    startedAt: results[0]?.startedAt,
    completedAt: results.at(-1)?.completedAt,
    durationMilliseconds: results.reduce((total, result) => total + result.durationMilliseconds, 0),
  };
};
const printInspectionResults = (results, flags, isOffline) => {
  if (results.length === 1) {
    printInspectionResult(results[0], flags, isOffline);
    return;
  }
  if (flags.json) {
    const report = toAggregateJsonReport(results);
    process.stdout.write(
      `${flags.jsonCompact ? JSON.stringify(report) : JSON.stringify(report, null, 2)}\n`,
    );
    return;
  }
  for (const result of results) {
    printProjectHeader(result);
    printProjectDetection(result);
    if (result.issues.length === 0) {
      console.log(`${highlighter.success("✔")} No React Doctor issues found.`);
      console.log("");
    } else printIssueSections(result.issues, flags.verbose);
    printResultScoreBlock(result);
    if (result.issues.length > 0) {
      printCountsSummaryLine(
        result.issues,
        result.project.sourceFileCount,
        result.durationMilliseconds,
      );
      console.log("");
    }
    if (flags.verbose && result.score && result.issues.length > 0)
      printVerboseScoreBreakdown(result.issues, result.score.value);
    printSkippedChecksWarning(result);
  }
  const allIssues = results.flatMap((result) => result.issues);
  if (allIssues.length > 0) {
    const diagnosticsDirectory = writeDiagnosticsDirectory(allIssues);
    if (diagnosticsDirectory)
      console.log(highlighter.gray(`  Full diagnostics written to ${diagnosticsDirectory}`));
  }
  if (!isOffline) {
    const scores = results
      .map((result) => result.score?.value)
      .filter((score) => typeof score === "number");
    const shareUrl = buildShareUrl(
      allIssues,
      scores.length ? Math.min(...scores) : null,
      results[0]?.project.projectName ?? "",
    );
    console.log(`  ${highlighter.bold("→ Share your results:")} ${highlighter.info(shareUrl)}`);
    console.log("");
  }
  printReactReviewCta();
};
let isJsonModeActive = false;
let isCompactJsonOutput = false;
let resolvedDirectoryForCancel = null;
let cancelStartTime = 0;
const writeJsonErrorReport = (error, directory, elapsed) => {
  const report = {
    schemaVersion: 1,
    ok: false,
    projects: [],
    issues: [],
    checks: [],
    summary: {
      errorCount: 0,
      warningCount: 0,
      affectedFileCount: 0,
      totalIssueCount: 0,
      score: null,
      scoreLabel: null,
    },
    error: {
      message: error instanceof Error ? error.message || error.name : String(error),
      name: error instanceof Error ? error.name : "Error",
    },
    directory,
    durationMilliseconds: elapsed,
  };
  const serialized = isCompactJsonOutput ? JSON.stringify(report) : JSON.stringify(report, null, 2);
  process.stdout.write(`${serialized}\n`);
};
const exitGracefully = () => {
  if (isJsonModeActive) {
    writeJsonErrorReport(
      /* @__PURE__ */ new Error("Scan cancelled by user (SIGINT/SIGTERM)"),
      resolvedDirectoryForCancel ?? process.cwd(),
      performance.now() - cancelStartTime,
    );
    process.exit(130);
  }
  console.log("");
  console.log("Cancelled.");
  console.log("");
  process.exit(130);
};
process.on("SIGINT", exitGracefully);
process.on("SIGTERM", exitGracefully);
process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") process.exit(0);
});
const coerceDiffValue = (value) => {
  if (value === void 0) return void 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.length === 0) return void 0;
    if (value === "false") return false;
    if (value === "true") return true;
    return value;
  }
  process.stderr.write(
    `[react-doctor] invalid diff value (expected boolean or string): ${typeof value}. Falling back to no diff.\n`,
  );
};
const validateModeFlags = (flags) => {
  const coercedDiff = coerceDiffValue(flags.diff);
  const exclusiveModes = [
    flags.staged ? "--staged" : null,
    flags.unstaged ? "--unstaged" : null,
    flags.changed ? "--changed" : null,
    coercedDiff !== void 0 && coercedDiff !== false ? "--diff" : null,
  ].filter((modeName) => modeName !== null);
  if (exclusiveModes.length > 1)
    throw new Error(`Cannot combine ${exclusiveModes.join(" and ")}; pick one mode.`);
  if (flags.yes && flags.full) throw new Error("Cannot combine --yes and --full; pick one.");
  if (flags.score && flags.json)
    throw new Error("Cannot combine --score and --json; pick one output mode.");
  if (flags.annotations && (flags.json || flags.score))
    throw new Error("--annotations cannot be combined with --json or --score.");
  if (flags.explain !== void 0 && flags.why !== void 0)
    throw new Error("Use --explain or --why, not both — they're aliases of the same flag.");
  if (
    (flags.explain ?? flags.why) !== void 0 &&
    (flags.json || flags.score || flags.annotations || flags.staged)
  )
    throw new Error(
      "--explain cannot be combined with --json, --score, --annotations, or --staged.",
    );
};
const resolveDiffMode = async (diffInfo, effectiveDiff, shouldSkipPrompts, isQuiet) => {
  if (effectiveDiff !== void 0 && effectiveDiff !== false) {
    if (diffInfo) return true;
    if (!isQuiet) {
      console.log(
        highlighter.warn("No feature branch or uncommitted changes detected. Running full scan."),
      );
      console.log("");
    }
    return false;
  }
  if (effectiveDiff === false || !diffInfo) return false;
  const changedSourceFiles = filterSourceFiles(diffInfo.changedFiles);
  if (changedSourceFiles.length === 0) return false;
  if (shouldSkipPrompts) return false;
  if (isQuiet) return false;
  const { shouldScanChangedOnly } = await prompts({
    type: "confirm",
    name: "shouldScanChangedOnly",
    message: diffInfo.isCurrentChanges
      ? `Found ${changedSourceFiles.length} uncommitted changed files. Only scan those?`
      : `On branch ${diffInfo.currentBranch} (${changedSourceFiles.length} files changed vs ${diffInfo.baseBranch}). Only scan changed files?`,
    initial: true,
  });
  return Boolean(shouldScanChangedOnly);
};
const parseFileLineArgument = (argument) => {
  const lastColonIndex = argument.lastIndexOf(":");
  if (lastColonIndex === -1) throw new Error(`Expected file:line format, got "${argument}".`);
  const filePath = path.resolve(argument.slice(0, lastColonIndex));
  const line = Number.parseInt(argument.slice(lastColonIndex + 1), 10);
  if (Number.isNaN(line) || line <= 0) throw new Error(`Invalid line number in "${argument}".`);
  return {
    filePath,
    line,
  };
};
const runExplain = async (fileLineArgument, rootDirectory, config, projectFlag) => {
  const { filePath, line } = parseFileLineArgument(fileLineArgument);
  let targetDirectory = rootDirectory;
  if (projectFlag) {
    const matched = await selectProjects(
      await discoverProjects(rootDirectory, false, false),
      rootDirectory,
      projectFlag,
      true,
      true,
    );
    if (matched.length === 0)
      throw new Error(`--project resolved to no projects. Cannot run --explain.`);
    if (matched.length > 1)
      throw new Error(
        `--explain takes a single project; --project resolved to ${matched.length} projects.`,
      );
    targetDirectory = matched[0];
  }
  const matchingIssues = (
    await createReactDoctor({ rootDirectory: targetDirectory }).inspect({
      offline: true,
      config,
    })
  ).issues.filter(
    (issue) =>
      issue.location?.line === line &&
      issue.location?.filePath &&
      path.resolve(targetDirectory, issue.location.filePath) === filePath,
  );
  if (matchingIssues.length === 0) {
    console.log(`No react-doctor diagnostics at ${filePath}:${line}.`);
    return;
  }
  for (const issue of matchingIssues) {
    const severitySymbol = issue.severity === "error" ? "✗" : "⚠";
    const colorizeRule = issue.severity === "error" ? highlighter.error : highlighter.warn;
    const severityLabel = colorizeRule(issue.severity);
    console.log(
      `${severitySymbol} ${colorizeRule(issue.title)} ${highlighter.dim(`(${severityLabel})`)} — ${issue.message}`,
    );
    if (issue.category) console.log(highlighter.dim(`  Category: ${issue.category}`));
    if (issue.recommendation) console.log(highlighter.dim(`  ${issue.recommendation}`));
    console.log(
      highlighter.dim(
        "  Add a react-doctor-disable-next-line comment immediately above this line to suppress.",
      ),
    );
    console.log("");
  }
};
const runInstall = async (installOptions) => {
  let agentInstall = null;
  try {
    agentInstall = await import("./dist-Ct16PbPQ.js");
  } catch {
    console.error(
      highlighter.error(
        'The "agent-install" package is required for the install command. Run: npm install -g agent-install',
      ),
    );
    process.exitCode = 1;
    return;
  }
  const { installSkillsFromSource, SKILL_MANIFEST_FILE, getSkillAgentTypes } = agentInstall;
  const { detectInstalledSkillAgents } = agentInstall;
  const { existsSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const distDirectory = path.dirname(fileURLToPath(import.meta.url));
  const sourceDir = path.join(distDirectory, "skills", "react-doctor");
  if (!existsSync(path.join(sourceDir, SKILL_MANIFEST_FILE))) {
    console.error(
      highlighter.error("Could not locate the react-doctor skill bundled with this package."),
    );
    process.exitCode = 1;
    return;
  }
  const detectedAgents = await detectInstalledSkillAgents();
  if (detectedAgents.length === 0) {
    console.error(highlighter.error("No supported coding agents detected."));
    console.error(
      highlighter.dim(
        "  Looked for config dirs in $HOME (~/.claude, ~/.cursor, ~/.codex, ~/.gemini, ...).",
      ),
    );
    process.exitCode = 1;
    return;
  }
  const skipPrompts = Boolean(installOptions.yes) || !process.stdin.isTTY;
  const allAgentTypes = getSkillAgentTypes().filter(
    (agent) => agent !== "universal" && detectedAgents.includes(agent),
  );
  const selectedAgents = skipPrompts
    ? allAgentTypes
    : ((
        await prompts({
          type: "multiselect",
          name: "agents",
          message: `Install the ${highlighter.info("react-doctor")} skill for:`,
          choices: allAgentTypes.map((agent) => ({
            title: String(agent),
            value: agent,
            selected: true,
          })),
          instructions: false,
          min: 1,
        })
      ).agents ?? []);
  if (selectedAgents.length === 0) return;
  if (installOptions.dryRun) {
    console.log("Dry run — would install react-doctor skill for:");
    for (const agent of selectedAgents) console.log(highlighter.dim(`  - ${String(agent)}`));
    console.log(highlighter.dim(`  Source: ${sourceDir}`));
    return;
  }
  console.log("Installing react-doctor skill...");
  const installResult = await installSkillsFromSource({
    source: sourceDir,
    agents: selectedAgents,
    cwd: process.cwd(),
    mode: "copy",
  });
  if (installResult.failed?.length > 0) {
    console.error(highlighter.error("Some installations failed:"));
    for (const failure of installResult.failed)
      console.error(highlighter.error(`  ${failure.agent}: ${failure.error}`));
    process.exitCode = 1;
    return;
  }
  console.log(
    `${highlighter.success("✔")} react-doctor skill installed for ${selectedAgents.join(", ")}.`,
  );
};
const program = new Command()
  .name("react-doctor")
  .description("Diagnose React codebase health")
  .version(VERSION, "-v, --version", "display the version number")
  .argument("[directory]", "project directory to scan", ".")
  .option("--lint", "enable linting")
  .option("--no-lint", "skip oxlint checks")
  .option("--dead-code", "enable dead code detection")
  .option("--no-dead-code", "skip codebase graph checks")
  .option("--verbose", "show every rule and per-file details (default shows top 3 rules)")
  .option("--custom-rules-only", "run only react-doctor custom oxlint rules")
  .option("--staged", "only inspect staged source files (materializes git index snapshot)")
  .option("--unstaged", "only inspect unstaged and untracked source files")
  .option("--changed", "only inspect source files changed since HEAD")
  .option(
    "--diff [base]",
    "scan only files changed vs base branch (pass `false` to disable; overridden by --full)",
  )
  .option("--json", "output a single structured JSON report (suppresses other output)")
  .option("--json-compact", "with --json, emit compact JSON (no indentation)")
  .option("--offline", "skip telemetry (anonymous, not stored, only used to calculate score)")
  .option("--project <name>", "select workspace project (comma-separated for multiple)")
  .option("-y, --yes", "skip prompts, scan all workspace projects")
  .option("--score", "output only the score")
  .option("--full", "force a full scan (overrides any `diff` value in config or `--diff`)")
  .option("--annotations", "output diagnostics as GitHub Actions annotations")
  .option("--fail-on <level>", "exit with error code on diagnostics: error, warning, none", "error")
  .option("--explain <file:line>", "diagnose why a rule fired at a specific location")
  .option("--why <file:line>", "alias for --explain")
  .option(
    "--respect-inline-disables",
    "respect inline `// eslint-disable*` / `// oxlint-disable*` comments (default)",
  )
  .option(
    "--no-respect-inline-disables",
    "audit mode: neutralize inline lint suppressions before scanning",
  )
  .action(async (directory, flags, command) => {
    const isScoreOnly = flags.score;
    const isJsonMode = flags.json;
    const isQuiet = isScoreOnly || isJsonMode;
    const rootDirectory = path.resolve(directory);
    const jsonStartTime = performance.now();
    isJsonModeActive = isJsonMode;
    isCompactJsonOutput = Boolean(flags.jsonCompact);
    resolvedDirectoryForCancel = rootDirectory;
    cancelStartTime = jsonStartTime;
    try {
      validateModeFlags(flags);
      const config = (await loadReactDoctorConfig(rootDirectory))?.config ?? {};
      const explainArgument = flags.explain ?? flags.why;
      if (explainArgument !== void 0) {
        await runExplain(explainArgument, rootDirectory, config, flags.project);
        return;
      }
      if (!isQuiet) {
        console.log(`react-doctor ${highlighter.dim(`v${VERSION}`)}`);
        console.log("");
      }
      if (!flags.offline && isCiEnvironment() && !isQuiet) {
        console.log(highlighter.dim("CI detected — scoring locally."));
        console.log("");
      }
      const effectiveFlags = {
        ...flags,
        verbose:
          command.getOptionValueSource("verbose") === "cli"
            ? Boolean(flags.verbose)
            : Boolean(config.verbose ?? flags.verbose),
        diff: flags.full
          ? false
          : command.getOptionValueSource("diff") === "cli"
            ? flags.diff
            : (config.diff ?? flags.diff),
      };
      const failOn =
        command.getOptionValueSource("failOn") === "cli"
          ? normalizeFailOnLevel(flags.failOn)
          : normalizeFailOnLevel(config.failOn ?? flags.failOn);
      const shouldSkipPrompts =
        flags.yes ||
        flags.full ||
        isJsonMode ||
        isNonInteractiveEnvironment() ||
        !process.stdin.isTTY;
      const isOffline = flags.offline || (config.offline ?? false) || isCiEnvironment();
      if (effectiveFlags.staged) {
        const stagedFiles = getStagedSourceFiles(rootDirectory);
        if (stagedFiles.length === 0) {
          if (isJsonMode) {
            const emptyReport = {
              schemaVersion: 1,
              ok: true,
              projects: [],
              issues: [],
              checks: [],
              summary: {
                errorCount: 0,
                warningCount: 0,
                affectedFileCount: 0,
                totalIssueCount: 0,
                score: null,
                scoreLabel: null,
              },
              mode: "staged",
              durationMilliseconds: performance.now() - jsonStartTime,
            };
            process.stdout.write(
              `${flags.jsonCompact ? JSON.stringify(emptyReport) : JSON.stringify(emptyReport, null, 2)}\n`,
            );
          } else if (!isScoreOnly) console.log(highlighter.dim("No staged source files found."));
          return;
        }
        if (!isQuiet) {
          console.log(`Scanning ${highlighter.info(`${stagedFiles.length}`)} staged files...`);
          console.log("");
        }
        let tempDirectory = null;
        let cleanupSnapshot = null;
        try {
          tempDirectory = mkdtempSync(path.join(tmpdir(), "react-doctor-staged-"));
          const snapshot = materializeStagedFiles(rootDirectory, stagedFiles, tempDirectory);
          cleanupSnapshot = snapshot.cleanup;
          const result = await createReactDoctor({
            rootDirectory: snapshot.tempDirectory,
            includePaths: snapshot.stagedFiles,
          }).inspect({
            lint: resolveBooleanInspectOption(command, "lint", flags.lint, config.lint, true),
            deadCode: resolveBooleanInspectOption(
              command,
              "deadCode",
              flags.deadCode,
              config.deadCode,
              true,
            ),
            customRulesOnly: resolveBooleanInspectOption(
              command,
              "customRulesOnly",
              flags.customRulesOnly,
              config.customRulesOnly,
              false,
            ),
            offline: isOffline,
            respectInlineDisables: resolveBooleanInspectOption(
              command,
              "respectInlineDisables",
              flags.respectInlineDisables,
              config.respectInlineDisables,
              true,
            ),
            config,
          });
          const remappedResult = {
            ...result,
            project: {
              ...result.project,
              rootDirectory,
            },
            issues: result.issues.map((issue) => ({
              ...issue,
              location: issue.location
                ? {
                    ...issue.location,
                    filePath: issue.location.filePath?.replaceAll(
                      snapshot.tempDirectory,
                      rootDirectory,
                    ),
                  }
                : issue.location,
            })),
          };
          printInspectionResults([remappedResult], effectiveFlags, isOffline);
          if (flags.annotations) printAnnotations(remappedResult.issues, isJsonMode);
          if (shouldFailForIssues(remappedResult.issues, failOn)) process.exitCode = 1;
        } finally {
          cleanupSnapshot?.();
        }
        return;
      }
      const effectiveDiff = coerceDiffValue(effectiveFlags.diff);
      const diffInfo =
        (effectiveDiff !== void 0 && effectiveDiff !== false) || (!shouldSkipPrompts && !isQuiet)
          ? getDiffInfo(rootDirectory, typeof effectiveDiff === "string" ? effectiveDiff : void 0)
          : null;
      const isDiffMode = await resolveDiffMode(diffInfo, effectiveDiff, shouldSkipPrompts, isQuiet);
      let includePaths;
      if (isDiffMode && diffInfo) {
        includePaths = filterSourceFiles(diffInfo.changedFiles);
        if (!isQuiet) {
          if (diffInfo.isCurrentChanges) console.log("Scanning uncommitted changes");
          else
            console.log(
              `Scanning changes: ${highlighter.info(diffInfo.currentBranch)} → ${highlighter.info(diffInfo.baseBranch)}`,
            );
          console.log("");
        }
      } else if (!effectiveFlags.staged)
        includePaths = resolveIncludePaths(rootDirectory, effectiveFlags);
      const shouldSkipSourceChecks =
        isChangedFileMode(effectiveFlags) && includePaths?.length === 0;
      const projectDirectories = await selectProjects(
        await discoverProjects(rootDirectory, Boolean(config.rootDir), shouldSkipSourceChecks),
        rootDirectory,
        flags.project,
        shouldSkipPrompts,
        isJsonMode,
      );
      const inspectOptions = {
        lint: shouldSkipSourceChecks
          ? false
          : resolveBooleanInspectOption(command, "lint", flags.lint, config.lint, true),
        deadCode: shouldSkipSourceChecks
          ? false
          : resolveBooleanInspectOption(command, "deadCode", flags.deadCode, config.deadCode, true),
        customRulesOnly: resolveBooleanInspectOption(
          command,
          "customRulesOnly",
          flags.customRulesOnly,
          config.customRulesOnly,
          false,
        ),
        offline: isOffline,
        respectInlineDisables: resolveBooleanInspectOption(
          command,
          "respectInlineDisables",
          flags.respectInlineDisables,
          config.respectInlineDisables,
          true,
        ),
        config,
      };
      const results = await Promise.all(
        projectDirectories.map((projectDirectory) =>
          createReactDoctor({
            rootDirectory: projectDirectory,
            includePaths: shouldSkipSourceChecks ? void 0 : includePaths,
          }).inspect(inspectOptions),
        ),
      );
      const allIssues = results.flatMap((result) => result.issues);
      if (flags.annotations) printAnnotations(allIssues, isJsonMode);
      if (flags.score) {
        const scores = results.map((result) => result.score).filter((score) => score !== null);
        const worstScore =
          scores.length > 0 ? Math.min(...scores.map((score) => score.value)) : 100;
        const worstLabel = scores.find((score) => score.value === worstScore)?.label ?? "Great";
        console.log(`${worstScore} / 100 ${worstLabel}`);
      } else printInspectionResults(results, effectiveFlags, isOffline);
      if (shouldFailForIssues(allIssues, failOn)) process.exitCode = 1;
    } catch (error) {
      if (isJsonModeActive) {
        writeJsonErrorReport(
          error,
          resolvedDirectoryForCancel ?? rootDirectory,
          performance.now() - jsonStartTime,
        );
        process.exitCode = 1;
        return;
      }
      handleCliError(error);
    }
  })
  .addHelpText(
    "after",
    `
${highlighter.dim("Configuration:")}
  Place a ${highlighter.info("react-doctor.config.json")} (or ${highlighter.info('"reactDoctor"')} key in your package.json) in the project root.
  CLI flags always override config values. See the README for the full schema.

${highlighter.dim("Learn more:")}
  ${highlighter.info(CANONICAL_GITHUB_URL)}
`,
  );
program
  .command("install")
  .description("Install the react-doctor skill into your coding agents")
  .option("-y, --yes", "skip prompts, install for all detected agents")
  .option("--dry-run", "show what would be installed without writing files")
  .action(async (options) => {
    try {
      await runInstall(options);
    } catch (error) {
      handleCliError(error);
    }
  });
program.parseAsync().catch((error) => {
  if (isJsonModeActive) {
    try {
      writeJsonErrorReport(
        error,
        resolvedDirectoryForCancel ?? process.cwd(),
        performance.now() - cancelStartTime,
      );
    } catch {
      process.stdout.write(
        '{"schemaVersion":1,"ok":false,"error":{"message":"Internal error","name":"Error"}}\n',
      );
    }
    process.exit(1);
  }
  handleCliError(error);
});
//#endregion
export {};

//# sourceMappingURL=cli.js.map
