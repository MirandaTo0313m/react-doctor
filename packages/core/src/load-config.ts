import fs from "node:fs";
import path from "node:path";
import type { ReactDoctorConfig } from "@react-doctor/types";
import { isFile, isMonorepoRoot, isPlainObject } from "@react-doctor/project-info";
import { logger } from "./logger.js";
import { mergeReactDoctorConfigs } from "./merge-configs.js";
import { validateConfigTypes } from "./validate-config-types.js";

const CONFIG_FILENAME = "react-doctor.config.json";
const PACKAGE_JSON_CONFIG_KEY = "reactDoctor";

// HACK: extends chains are flattened depth-first; a cycle guard caps
// recursion at this depth in case `validate-config-types` accidentally
// passes through a self-referential `extends`. Picked high enough to
// cover the deepest realistic monorepo layout
// (`packages/<x>/configs/<y>/react-doctor.config.json` extending two
// or three ancestors) while still catching pathological loops.
const MAX_EXTENDS_DEPTH = 16;

interface LoadedReactDoctorConfig {
  config: ReactDoctorConfig;
  /**
   * Absolute path of the directory that contained the resolved config
   * file (or `package.json` with the `reactDoctor` key). Path-valued
   * config fields like `rootDir` are resolved relative to this
   * directory, never the CWD.
   */
  sourceDirectory: string;
}

const readParsedJson = (filePath: string): unknown | null => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    logger.warn(
      `Failed to parse ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Resolve path-valued fields against the config file that DECLARED
 * them, before that config is merged into a child. Without this,
 * inherited `rootDir: "../apps/web"` from a parent at
 * `/repo/shared/base.json` would later be resolved against the child's
 * directory (e.g. `/repo/packages/lib/`) and point at the wrong tree.
 */
const absolutizeRelativePaths = (
  config: ReactDoctorConfig,
  sourceDirectory: string,
): ReactDoctorConfig => {
  if (typeof config.rootDir !== "string") return config;
  const trimmed = config.rootDir.trim();
  if (trimmed.length === 0 || path.isAbsolute(trimmed)) return config;
  return { ...config, rootDir: path.resolve(sourceDirectory, trimmed) };
};

const loadConfigFile = (
  configFilePath: string,
  visited: Set<string>,
  depth: number,
): ReactDoctorConfig | null => {
  if (depth >= MAX_EXTENDS_DEPTH) {
    logger.warn(
      `react-doctor config "extends" chain at ${configFilePath} exceeded depth ${MAX_EXTENDS_DEPTH}; ignoring deeper parents.`,
    );
    return null;
  }
  const absoluteConfigPath = resolveVisitedKey(configFilePath);
  if (visited.has(absoluteConfigPath)) {
    logger.warn(
      `react-doctor config "extends" cycle detected at ${configFilePath}; ignoring this branch.`,
    );
    return null;
  }
  visited.add(absoluteConfigPath);

  const parsed = readParsedJson(configFilePath);
  if (!isPlainObject(parsed)) return null;
  const validated = validateConfigTypes(parsed as ReactDoctorConfig);
  const configDirectory = path.dirname(configFilePath);
  const resolved = resolveExtendsChain(validated, configDirectory, visited, depth);
  return absolutizeRelativePaths(resolved, configDirectory);
};

const resolveExtendsChain = (
  config: ReactDoctorConfig,
  configDirectory: string,
  visited: Set<string>,
  depth: number,
): ReactDoctorConfig => {
  const extendsValue = config.extends;
  if (extendsValue === undefined) return config;
  const extendsEntries = Array.isArray(extendsValue) ? extendsValue : [extendsValue];

  let resolvedConfig: ReactDoctorConfig = {};
  for (const entry of extendsEntries) {
    if (typeof entry !== "string" || entry.length === 0) continue;
    const candidatePath = path.isAbsolute(entry) ? entry : path.resolve(configDirectory, entry);
    if (!isFile(candidatePath)) {
      logger.warn(
        `react-doctor config "extends" target "${entry}" not found at ${candidatePath}; ignoring this parent.`,
      );
      continue;
    }
    // Clone the visited set per branch so diamond inheritance works -
    // if Root extends [A, B] and both A and B extend a common Shared
    // parent, sharing one visited set across the loop would make B
    // skip Shared as a "cycle" after A loaded it. The clone gives
    // each top-level extends entry its own cycle window while still
    // catching true cycles within a single chain.
    const branchVisited = new Set(visited);
    const parentConfig = loadConfigFile(candidatePath, branchVisited, depth + 1);
    if (!parentConfig) continue;
    // Documented semantics: later entries override earlier ones for
    // scalar fields (consistent with tsconfig / eslint `extends`),
    // and arrays concat in declaration order. The final
    // `mergeReactDoctorConfigs` call below then layers the current
    // config on top so its values always win over anything it extends.
    resolvedConfig = mergeReactDoctorConfigs(resolvedConfig, parentConfig);
  }

  return mergeReactDoctorConfigs(resolvedConfig, config);
};

// Resolve a config path through the same lens `loadConfigFile` uses
// when deduping the `extends` chain, so the visited set is keyed by
// the realpath when symlinks are involved and the raw path otherwise.
// Without this, a self-referencing `extends` from a symlinked root
// would bypass cycle detection on the first re-entry and only be
// caught by the depth guard.
const resolveVisitedKey = (configFilePath: string): string => {
  try {
    return fs.realpathSync(configFilePath);
  } catch {
    return path.resolve(configFilePath);
  }
};

const loadConfigFromDirectory = (directory: string): LoadedReactDoctorConfig | null => {
  const configFilePath = path.join(directory, CONFIG_FILENAME);

  if (isFile(configFilePath)) {
    const parsed = readParsedJson(configFilePath);
    if (isPlainObject(parsed)) {
      const validated = validateConfigTypes(parsed as ReactDoctorConfig);
      const resolved = resolveExtendsChain(
        validated,
        directory,
        new Set([resolveVisitedKey(configFilePath)]),
        0,
      );
      return { config: resolved, sourceDirectory: directory };
    }
    if (parsed !== null) {
      logger.warn(`${CONFIG_FILENAME} must be a JSON object, ignoring.`);
    }
  }

  const packageJsonPath = path.join(directory, "package.json");
  if (isFile(packageJsonPath)) {
    try {
      const fileContent = fs.readFileSync(packageJsonPath, "utf-8");
      const packageJson: unknown = JSON.parse(fileContent);
      if (isPlainObject(packageJson)) {
        const embeddedConfig = packageJson[PACKAGE_JSON_CONFIG_KEY];
        if (isPlainObject(embeddedConfig)) {
          const validated = validateConfigTypes(embeddedConfig as ReactDoctorConfig);
          const resolved = resolveExtendsChain(
            validated,
            directory,
            // Seed the visited set with the host package.json so a
            // child `extends` chain that eventually points back here
            // is caught by cycle detection on the first re-entry, not
            // only by the depth guard.
            new Set([resolveVisitedKey(packageJsonPath)]),
            0,
          );
          return { config: resolved, sourceDirectory: directory };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
};

// HACK: `.git` exists either as a directory (regular repo) or a file
// (git worktree pointing back to the main .git dir). `fs.existsSync`
// covers both — no need for a separate `isFile` check.
const isProjectBoundary = (directory: string): boolean =>
  fs.existsSync(path.join(directory, ".git")) || isMonorepoRoot(directory);

const cachedConfigs = new Map<string, LoadedReactDoctorConfig | null>();

// HACK: expose a way to clear the module-level config cache so programmatic
// API consumers (watch-mode tools, test runners, agentic CLI flows) can
// re-detect after the user edits react-doctor.config.json or package.json
// between calls. The cache is keyed by absolute directory; without a
// cache-clear hook, repeated diagnose() calls would always hit the stale
// first-resolution result.
export const clearConfigCache = (): void => {
  cachedConfigs.clear();
};

export const loadConfigWithSource = (rootDirectory: string): LoadedReactDoctorConfig | null => {
  const cached = cachedConfigs.get(rootDirectory);
  if (cached !== undefined) return cached;

  const localConfig = loadConfigFromDirectory(rootDirectory);
  if (localConfig) {
    cachedConfigs.set(rootDirectory, localConfig);
    return localConfig;
  }

  if (isProjectBoundary(rootDirectory)) {
    cachedConfigs.set(rootDirectory, null);
    return null;
  }

  let ancestorDirectory = path.dirname(rootDirectory);
  while (ancestorDirectory !== path.dirname(ancestorDirectory)) {
    const ancestorConfig = loadConfigFromDirectory(ancestorDirectory);
    if (ancestorConfig) {
      cachedConfigs.set(rootDirectory, ancestorConfig);
      return ancestorConfig;
    }
    if (isProjectBoundary(ancestorDirectory)) {
      cachedConfigs.set(rootDirectory, null);
      return null;
    }
    ancestorDirectory = path.dirname(ancestorDirectory);
  }

  cachedConfigs.set(rootDirectory, null);
  return null;
};
