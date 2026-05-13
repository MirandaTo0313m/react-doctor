import {
  a as PACKAGE_JSON_FILENAME,
  i as PACKAGE_JSON_CONFIG_KEY,
  n as getScoreLabel,
  o as REACT_DOCTOR_CONFIG_FILENAME,
  r as FETCH_TIMEOUT_MS,
  s as SCORE_API_URL,
  t as calculateScore,
} from "./score-C2C2ephU.js";
import {
  A as ReactDoctorRunnerUnavailableError,
  P as toReactDoctorErrorInfo,
  a as DEPENDENCIES_RULE_ID,
  f as readPackageJson,
  h as SOURCE_FILE_EXTENSIONS,
  i as REACT_ARCHITECTURE_RULE_ID,
  m as PACKAGE_JSON_FILENAME$1,
  n as createRuleRegistry,
  o as DEAD_CODE_RULE_ID,
  p as IGNORED_DIRECTORY_NAMES,
  s as runCodebaseAnalysis,
  w as ReactDoctorInvalidConfigError,
  y as ReactDoctorCheckFailedError,
} from "./rules-k6al64g-.js";
import {
  _ as createReactDoctorOxlintConfig,
  r as reactDoctorOxlintRuleMetadata,
  v as getReactDoctorRuleTags,
} from "./metadata-pW35UeI4.js";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import fs$1, { existsSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
//#region src/core/config.ts
const configCache = /* @__PURE__ */ new Map();
const isRecord$1 = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const pathExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
const isDirectory = async (filePath) => {
  try {
    return (await fs.stat(filePath)).isDirectory();
  } catch {
    return false;
  }
};
const parseJsonFile = async (filePath) => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
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
  const packageJsonPath = path.join(directory, PACKAGE_JSON_FILENAME);
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
const clearReactDoctorConfigCache = () => {
  configCache.clear();
};
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
const stripYamlValue = (value) =>
  stripYamlComment(value)
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
    const line = stripYamlComment(rawLine);
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
      await fs.readFile(path.join(directory, PNPM_WORKSPACE_FILENAME), "utf8"),
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
        packageJsonPath: path.join(currentDirectory, PACKAGE_JSON_FILENAME$1),
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
    return await fs.readFile(filePath, "utf8");
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
    await fs.access(path.join(directory, entryName));
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
      entries = await fs.readdir(directory, { withFileTypes: true });
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
const hasFile = async (filePath) => {
  try {
    return (await fs.stat(filePath)).isFile();
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
  return hasFile(path.join(directory, PNPM_WORKSPACE_FILENAME));
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
    return (await hasFile(path.join(directory, "package.json"))) ? [directory] : [];
  }
  const prefix = normalized.slice(0, wildcardIndex).replace(/\/$/, "");
  const suffix = normalized.slice(wildcardIndex + 1).replace(/^\//, "");
  const baseDirectory = path.resolve(rootDirectory, prefix || ".");
  let entries;
  try {
    entries = await fs.readdir(baseDirectory, { withFileTypes: true });
  } catch {
    return [];
  }
  const directories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || IGNORED_DIRECTORY_NAMES.has(entry.name)) continue;
    const candidate = path.join(baseDirectory, entry.name, suffix);
    if (await hasFile(path.join(candidate, "package.json"))) directories.push(candidate);
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
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const escapedComponentName = escapeRegExp(componentName);
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
    content = fs$1.readFileSync(filePath, "utf-8");
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
    content = fs$1.readFileSync(filePath, "utf-8");
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
    if (fs$1.existsSync(path.join(currentDirectory, ".git"))) break;
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
  const configDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "react-doctor-oxlint-"));
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
  await fs.writeFile(configPath, JSON.stringify(config), { mode: 384 });
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
      await fs.writeFile(combinedIgnorePath, `${combinedPatterns.join("\n")}\n`);
      args.push("--ignore-path", combinedIgnorePath);
    }
    args.push(...(options.includePaths?.length ? options.includePaths : ["."]));
    const { stdout, stderr } = await spawnOxlint(args, options.rootDirectory, options.signal);
    return parseOxlintOutput(stdout, options.rootDirectory, stderr);
  } finally {
    await fs.rm(configDirectory, {
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
    return fs$1.readFileSync(path.resolve(rootDirectory, filePath), "utf8").split(/\r?\n/);
  } catch {
    return;
  }
};
const readJsxImportSource = (rootDirectory) => {
  try {
    const tsconfigPath = path.resolve(rootDirectory, "tsconfig.json");
    const cleaned = fs$1
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
//#region src/sdk/compat.ts
const toDiagnostic = (issue) => ({
  filePath: issue.location?.filePath ?? "",
  plugin: issue.source?.pluginName ?? issue.source?.checkId ?? "react-doctor",
  rule: issue.source?.ruleId ?? issue.id,
  severity: issue.severity === "error" ? "error" : "warning",
  message: issue.message,
  help: issue.recommendation ?? "",
  line: issue.location?.line ?? 0,
  column: issue.location?.column ?? 0,
  category: issue.category,
});
const toScoreResult = (score) =>
  score
    ? {
        score: score.value,
        label: score.label,
      }
    : null;
const toProjectInfo = (result) => ({
  rootDirectory: result.project.rootDirectory,
  projectName: result.project.projectName || path.basename(result.project.rootDirectory),
  reactVersion: result.project.reactVersion,
  tailwindVersion: result.project.tailwindVersion,
  framework: result.project.framework,
  hasTypeScript: result.project.hasTypeScript,
  hasReactCompiler: result.project.hasReactCompiler,
  hasTanStackQuery: result.project.hasTanStackQuery,
  sourceFileCount: result.project.sourceFileCount,
});
const toInspectOptions = (directory, options) => ({
  rootDirectory: directory,
  includePaths: options.includePaths,
  signal: options.signal,
});
/**
 * @deprecated Use `createReactDoctor({ rootDirectory }).inspect()` from the main SDK instead.
 */
const diagnose = async (directory, options = {}) => {
  const result = await inspectReactProjectCore({
    ...toInspectOptions(directory, options),
    lint: options.lint,
    deadCode: options.deadCode,
    respectInlineDisables: options.respectInlineDisables,
  });
  return {
    diagnostics: result.issues.map(toDiagnostic),
    score: toScoreResult(result.score),
    project: toProjectInfo(result),
    elapsedMilliseconds: result.durationMilliseconds,
  };
};
const clearCaches = () => {
  clearReactDoctorConfigCache();
};
//#endregion
export {
  runOxlint as a,
  parseReactMajorVersion as c,
  calculateReactDoctorScore as d,
  summarizeReactDoctorResult as f,
  resolveConfigRootDirectory as h,
  OXLINT_CHECK_ID as i,
  toOxlintProjectInfo as l,
  loadReactDoctorConfig as m,
  diagnose as n,
  filterReactDoctorIssues as o,
  clearReactDoctorConfigCache as p,
  inspectReactProjectCore as r,
  discoverReactProject as s,
  clearCaches as t,
  buildReactDoctorJsonReport as u,
};

//# sourceMappingURL=compat-CAnuRQqf.js.map
