import path from "node:path";
import { DEFAULT_CONDITION_NAMES, DEFAULT_INCLUDE_PATHS } from "./constants.js";
import type { CodebaseAnalysisConfig, CodebaseAnalysisOptions } from "./types.js";

export const createCodebaseAnalysisConfig = (
  options: CodebaseAnalysisOptions,
): CodebaseAnalysisConfig => ({
  rootDirectory: path.resolve(options.rootDirectory),
  includePaths: options.includePaths?.length ? options.includePaths : DEFAULT_INCLUDE_PATHS,
  excludePatterns: options.excludePatterns ?? [],
  conditionNames: DEFAULT_CONDITION_NAMES,
  production: false,
});
