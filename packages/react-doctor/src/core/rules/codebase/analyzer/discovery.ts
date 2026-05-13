import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { IGNORED_DIRECTORY_NAMES } from "./constants.js";
import { buildLineStarts, isSourceFilePath, matchesGlob, toRelativePath } from "./path-utils.js";
import { findWorkspaceForFile } from "./workspace.js";
import type { CodebaseAnalysisConfig, ProjectFile, WorkspaceInfo } from "./types.js";

interface GitignorePattern {
  pattern: string;
  isNegated: boolean;
}

const shouldSkipDirectory = (directoryName: string): boolean =>
  IGNORED_DIRECTORY_NAMES.has(directoryName);

const discoverSourceFilePaths = async (
  directoryPath: string,
  config: CodebaseAnalysisConfig,
  signal?: AbortSignal,
): Promise<string[]> => {
  signal?.throwIfAborted();
  let entries: Dirent[];
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const filePaths: string[] = [];
  for (const entry of entries) {
    signal?.throwIfAborted();
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        filePaths.push(...(await discoverSourceFilePaths(entryPath, config, signal)));
      }
      continue;
    }
    if (entry.isFile() && isSourceFilePath(entryPath)) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
};

const patternToRegExp = (pattern: string): RegExp => {
  const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`(^|/)${escapedPattern}($|/)`);
};

const matchesAnyPattern = (relativePath: string, patterns: string[]): boolean =>
  patterns.some((pattern) => patternToRegExp(pattern).test(relativePath));

const toExtendedGitignorePatterns = (pattern: string): string[] => {
  if (pattern === "*" || pattern === "**" || pattern.endsWith("/*")) return [pattern];
  return [pattern, `${pattern}/**`];
};

const toGitignorePattern = (line: string): GitignorePattern | null => {
  const trimmedLine = line.trim();
  if (!trimmedLine || (trimmedLine.startsWith("#") && !trimmedLine.startsWith("\\#"))) return null;
  const unescapedLine = trimmedLine.replace(/^\\(?=#)/, "");
  const isNegated = unescapedLine.startsWith("!");
  let pattern = isNegated ? unescapedLine.slice(1) : unescapedLine;
  if (!pattern) return null;
  if (pattern.endsWith("/")) pattern = pattern.slice(0, -1);
  if (pattern.startsWith("/")) {
    pattern = pattern.slice(1);
  } else if (!pattern.startsWith("**/")) {
    pattern = `**/${pattern}`;
  }
  return { pattern, isNegated };
};

const readGitignorePatterns = async (rootDirectory: string): Promise<GitignorePattern[]> => {
  try {
    const sourceText = await fs.readFile(path.join(rootDirectory, ".gitignore"), "utf8");
    return sourceText
      .split(/\r?\n/)
      .map(toGitignorePattern)
      .filter((pattern): pattern is GitignorePattern => Boolean(pattern));
  } catch {
    return [];
  }
};

const isGitignored = (relativePath: string, patterns: GitignorePattern[]): boolean => {
  let isIgnored = false;
  for (const item of patterns) {
    if (
      toExtendedGitignorePatterns(item.pattern).some((pattern) =>
        matchesGlob(relativePath, pattern),
      )
    ) {
      isIgnored = !item.isNegated;
    }
  }
  return isIgnored;
};

const isIncluded = (relativePath: string, includePaths: string[]): boolean =>
  includePaths.some((includePath) => {
    if (includePath === ".") return true;
    return (
      relativePath === includePath || relativePath.startsWith(`${includePath.replace(/\/$/, "")}/`)
    );
  });

const isUnderDirectory = (filePath: string, directory: string): boolean => {
  const relativePath = path.relative(directory, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};

const isGeneratedOutputFile = (filePath: string, workspaces: WorkspaceInfo[]): boolean =>
  workspaces.some((workspace) =>
    workspace.sourceMaps.some(
      (sourceMap) =>
        isUnderDirectory(filePath, sourceMap.outputDirectory) &&
        !isUnderDirectory(filePath, sourceMap.sourceDirectory),
    ),
  );

export const discoverSourceFiles = async (
  config: CodebaseAnalysisConfig,
  workspaces: WorkspaceInfo[],
  signal?: AbortSignal,
): Promise<ProjectFile[]> => {
  const filePathSet = new Set<string>();
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
      ) {
        filePathSet.add(filePath);
      }
    }
  }
  const filePaths = [...filePathSet].sort((first, second) => first.localeCompare(second));
  const sourceFiles: ProjectFile[] = [];

  for (const filePath of filePaths) {
    signal?.throwIfAborted();
    const sourceText = await fs.readFile(filePath, "utf8");
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
