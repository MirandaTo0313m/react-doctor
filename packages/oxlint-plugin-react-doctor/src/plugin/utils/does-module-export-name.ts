import fs from "node:fs";

const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const DEFAULT_EXPORT_DECLARATION_PATTERN = /^\s*export\s+default\b/m;
const LINE_COMMENT_PATTERN = /^\s*\/\/.*$/gm;
const NAMED_EXPORT_DECLARATION_PATTERN =
  /^\s*export\s+(?:declare\s+)?(?:(?:async\s+)?function|(?:abstract\s+)?class|const|let|var|enum|interface|type)\s+([\w$]+)/gm;
const LOCAL_EXPORT_SPECIFIER_DECLARATION_PATTERN =
  /^\s*export\s+(?:type\s+)?\{([\s\S]*?)\}(?:\s+from\s+["'][^"']+["'])?\s*;?\s*(?:(?:\/\/[^\n]*)?\s*)/gm;

const stripComments = (sourceText: string): string =>
  sourceText.replace(BLOCK_COMMENT_PATTERN, "").replace(LINE_COMMENT_PATTERN, "");

const getSpecifierName = (rawName: string): string => rawName.replace(/^type\s+/, "").trim();

const getExportedSpecifierName = (specifierText: string): string => {
  const [rawLocalName, rawExportedName] = specifierText.trim().split(/\s+as\s+/);
  return getSpecifierName(rawExportedName ?? rawLocalName ?? "");
};

const doesSourceTextExportName = (sourceText: string, exportedName: string): boolean => {
  const strippedSource = stripComments(sourceText);
  if (exportedName === "default" && DEFAULT_EXPORT_DECLARATION_PATTERN.test(strippedSource)) {
    return true;
  }

  for (const match of strippedSource.matchAll(NAMED_EXPORT_DECLARATION_PATTERN)) {
    if (match[1] === exportedName) return true;
  }

  for (const match of strippedSource.matchAll(LOCAL_EXPORT_SPECIFIER_DECLARATION_PATTERN)) {
    const specifiersText = match[1] ?? "";
    const exportedNames = specifiersText.split(",").map(getExportedSpecifierName).filter(Boolean);
    if (exportedNames.includes(exportedName)) return true;
  }

  return false;
};

export const doesModuleExportName = (filePath: string, exportedName: string): boolean => {
  try {
    return doesSourceTextExportName(fs.readFileSync(filePath, "utf8"), exportedName);
  } catch {
    return false;
  }
};
