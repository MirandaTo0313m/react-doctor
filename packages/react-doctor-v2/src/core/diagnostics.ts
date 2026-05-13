import path from "node:path";
import { isTestFilePath } from "./is-test-file-path.js";
import { getReactDoctorRuleTags } from "./rules/lint/config.js";
import type { ReactDoctorConfig, ReactDoctorIssue } from "./types.js";

const TEST_NOISE_TAG = "test-noise";
const WRAPPED_RULE_ID_PATTERN = /^([a-zA-Z][\w-]*)\(([^)]+)\)$/;
const REACT_BUILTIN_RULE_PREFIX = /^(?:react|jsx-a11y)\//;
const JSX_A11Y_RULE_PREFIX = "jsx-a11y/";
const OG_IMAGE_FILE_PATTERN = /\/(?:opengraph-image|twitter-image|icon|apple-icon)\.[jt]sx?$/;
const OG_JSX_FILE_PATTERN =
  /\/(?:api\/)?og(?:\/|$)|\/(?:opengraph-image|twitter-image|icon|apple-icon)\.[jt]sx?$/;
const NON_REACT_JSX_IMPORT_PATTERN = /(?:^|\n)\s*import\s.*from\s+['"](?:solid-js|preact)/;
const NON_REACT_JSX_SOURCES = new Set(["preact", "solid-js", "vue", "svelte"]);
const EMOTION_IMPORT_PATTERN = /(?:^|\n)\s*import\s.*from\s+['"]@emotion\/react['"]/;
const IMAGE_RESPONSE_IMPORT_PATTERN =
  /(?:^|\n)\s*import\s.*\bImageResponse\b.*from\s+['"](?:next\/og|@vercel\/og)['"]/;
const SATORI_TW_PROP_PATTERN = /\btw\s*=/;
const EMOTION_CSS_PROP_PATTERN = /\bcss\s*=/;

const toMetadataRuleKey = (issue: ReactDoctorIssue): string | null => {
  const ruleId = issue.source?.ruleId;
  if (!ruleId) return null;
  const wrapped = WRAPPED_RULE_ID_PATTERN.exec(ruleId);
  if (wrapped) return `${wrapped[1]}/${wrapped[2]}`;
  if (issue.source?.pluginName && !ruleId.includes("/")) {
    return `${issue.source.pluginName}/${ruleId}`;
  }
  return ruleId;
};

const isAutoSuppressedTestNoise = (issue: ReactDoctorIssue, relativeFilePath: string): boolean => {
  if (!relativeFilePath) return false;
  const ruleKey = toMetadataRuleKey(issue);
  if (!ruleKey) return false;
  if (!getReactDoctorRuleTags(ruleKey).has(TEST_NOISE_TAG)) return false;
  return isTestFilePath(relativeFilePath);
};

interface CompiledIgnoreOverride {
  files: string[];
  rules: Set<string> | null;
}

interface ComponentMatch {
  innerText: string;
  startIndex: number;
  endIndex: number;
}

const RN_NO_RAW_TEXT_RULE_ID = "rn-no-raw-text";

const normalizePath = (filePath: string): string => filePath.replace(/\\/g, "/");

const normalizeRuleId = (issue: ReactDoctorIssue): string => {
  if (issue.source?.pluginName && issue.source.ruleId) {
    return `${issue.source.pluginName}/${issue.source.ruleId}`;
  }
  return issue.source?.ruleId ?? issue.id;
};

const stripRuleNamespace = (ruleId: string): string => ruleId.split("/").at(-1) ?? ruleId;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesRule = (issue: ReactDoctorIssue, rulePatterns: ReadonlySet<string>): boolean => {
  const ruleId = normalizeRuleId(issue);
  return rulePatterns.has(ruleId) || rulePatterns.has(stripRuleNamespace(ruleId));
};

const matchesPathPattern = (filePath: string, pattern: string): boolean => {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern).replace(/^\.\//, "");
  if (normalizedPattern.endsWith("/**")) {
    const directoryPattern = normalizedPattern.slice(0, -3);
    return (
      normalizedFilePath === directoryPattern ||
      normalizedFilePath.startsWith(`${directoryPattern}/`)
    );
  }
  if (normalizedPattern.includes("*")) {
    const expression = new RegExp(
      `^${normalizedPattern
        .split("*")
        .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    );
    return expression.test(normalizedFilePath);
  }
  return (
    normalizedFilePath === normalizedPattern ||
    normalizedFilePath.startsWith(`${normalizedPattern}/`)
  );
};

const toRelativeIssuePath = (issue: ReactDoctorIssue, rootDirectory: string): string => {
  const filePath = issue.location?.filePath;
  if (!filePath) return "";
  if (!path.isAbsolute(filePath)) return normalizePath(filePath);
  return normalizePath(path.relative(rootDirectory, filePath));
};

const compileOverrides = (config: ReactDoctorConfig): CompiledIgnoreOverride[] =>
  (config.ignore?.overrides ?? []).map((override) => ({
    files: override.files,
    rules: override.rules ? new Set(override.rules) : null,
  }));

const isIgnoredByOverride = (
  issue: ReactDoctorIssue,
  filePath: string,
  overrides: CompiledIgnoreOverride[],
): boolean => {
  for (const override of overrides) {
    if (!override.files.some((pattern) => matchesPathPattern(filePath, pattern))) continue;
    if (!override.rules || matchesRule(issue, override.rules)) return true;
  }
  return false;
};

const isDisabledByInlineComment = (
  issue: ReactDoctorIssue,
  sourceLines: string[] | undefined,
): boolean => {
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
  ) {
    return true;
  }
  if (
    previousLine.includes("eslint-disable-next-line") ||
    previousLine.includes("oxlint-disable-next-line")
  ) {
    if (previousLine.includes(ruleId)) return true;
    const baseRuleName = ruleId.replace(
      /^(?:nextjs|rn|tailwind|query|swr|mobx|shadcn|radix|rhf|r3f|storybook|testing)-/,
      "",
    );
    if (baseRuleName !== ruleId && previousLine.includes(baseRuleName)) return true;
  }
  return false;
};

const toLineStartIndex = (sourceLines: string[], line: number): number => {
  let startIndex = 0;
  for (let lineIndex = 0; lineIndex < line - 1; lineIndex++) {
    startIndex += (sourceLines[lineIndex] ?? "").length + 1;
  }
  return startIndex;
};

const findComponentMatches = (sourceText: string, componentName: string): ComponentMatch[] => {
  const escapedComponentName = escapeRegExp(componentName);
  const componentPattern = new RegExp(
    `<${escapedComponentName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedComponentName}>`,
    "g",
  );
  const matches: ComponentMatch[] = [];
  for (const match of sourceText.matchAll(componentPattern)) {
    if (match.index === undefined) continue;
    matches.push({
      innerText: match[1] ?? "",
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  return matches;
};

const isStringOnlyWrapperContent = (innerText: string): boolean => {
  const trimmedInnerText = innerText.trim();
  return trimmedInnerText.length > 0 && !/[<{]/.test(trimmedInnerText);
};

const isInsideComponentMatch = (issueIndex: number, match: ComponentMatch): boolean =>
  issueIndex >= match.startIndex && issueIndex <= match.endIndex;

const isSuppressedRnRawTextIssue = (
  issue: ReactDoctorIssue,
  config: ReactDoctorConfig,
  sourceLines: string[] | undefined,
): boolean => {
  if (stripRuleNamespace(normalizeRuleId(issue)) !== RN_NO_RAW_TEXT_RULE_ID) return false;
  const line = issue.location?.line;
  if (!line || !sourceLines) return false;

  const sourceText = sourceLines.join("\n");
  const issueIndex = toLineStartIndex(sourceLines, line);
  for (const componentName of config.textComponents ?? []) {
    if (
      findComponentMatches(sourceText, componentName).some((match) =>
        isInsideComponentMatch(issueIndex, match),
      )
    ) {
      return true;
    }
  }
  for (const componentName of config.rawTextWrapperComponents ?? []) {
    if (
      findComponentMatches(sourceText, componentName).some(
        (match) =>
          isInsideComponentMatch(issueIndex, match) && isStringOnlyWrapperContent(match.innerText),
      )
    ) {
      return true;
    }
  }
  return false;
};

const isSuppressedUnknownPropertyIssue = (
  issue: ReactDoctorIssue,
  relativeFilePath: string,
  sourceLines: string[] | undefined,
): boolean => {
  const ruleKey = toMetadataRuleKey(issue) ?? normalizeRuleId(issue);
  if (ruleKey !== "react/no-unknown-property") return false;
  if (!sourceLines) return false;
  const line = issue.location?.line;
  if (!line) return false;
  const sourceLine = sourceLines[line - 1] ?? "";
  const sourceHeader = sourceLines.slice(0, 30).join("\n");
  if (
    SATORI_TW_PROP_PATTERN.test(sourceLine) &&
    (OG_JSX_FILE_PATTERN.test(relativeFilePath) || IMAGE_RESPONSE_IMPORT_PATTERN.test(sourceHeader))
  ) {
    return true;
  }
  if (EMOTION_CSS_PROP_PATTERN.test(sourceLine) && EMOTION_IMPORT_PATTERN.test(sourceHeader)) {
    return true;
  }
  return sourceLine.includes("<style") && sourceLine.includes("jsx");
};

export interface FilterReactDoctorIssuesOptions {
  jsxImportSource?: string;
}

export const filterReactDoctorIssues = (
  issues: ReactDoctorIssue[],
  config: ReactDoctorConfig,
  rootDirectory: string,
  readSourceLines?: (filePath: string) => string[] | undefined,
  options?: FilterReactDoctorIssuesOptions,
): ReactDoctorIssue[] => {
  const ignoredRules = new Set(config.ignore?.rules ?? []);
  const ignoredFiles = config.ignore?.files ?? [];
  const overrides = compileOverrides(config);

  const isNonReactJsxProject =
    options?.jsxImportSource !== undefined && NON_REACT_JSX_SOURCES.has(options.jsxImportSource);
  const nonReactJsxFileCache = new Map<string, boolean>();
  const isNonReactJsxFile = (relPath: string): boolean => {
    const cached = nonReactJsxFileCache.get(relPath);
    if (cached !== undefined) return cached;
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
    const sourceLines = relativeFilePath ? readSourceLines?.(relativeFilePath) : undefined;
    if (
      REACT_BUILTIN_RULE_PREFIX.test(unwrappedRuleId) &&
      (isNonReactJsxProject || (relativeFilePath && isNonReactJsxFile(relativeFilePath)))
    ) {
      return false;
    }
    if (
      relativeFilePath &&
      isSuppressedUnknownPropertyIssue(issue, relativeFilePath, sourceLines)
    ) {
      return false;
    }
    if (
      unwrappedRuleId.startsWith(JSX_A11Y_RULE_PREFIX) &&
      relativeFilePath &&
      OG_IMAGE_FILE_PATTERN.test(relativeFilePath)
    ) {
      return false;
    }

    if (matchesRule(issue, ignoredRules)) return false;
    if (
      relativeFilePath &&
      ignoredFiles.some((pattern) => matchesPathPattern(relativeFilePath, pattern))
    ) {
      return false;
    }
    if (isIgnoredByOverride(issue, relativeFilePath, overrides)) return false;
    if (
      config.respectInlineDisables !== false &&
      relativeFilePath &&
      isDisabledByInlineComment(issue, sourceLines)
    ) {
      return false;
    }
    if (relativeFilePath && isSuppressedRnRawTextIssue(issue, config, sourceLines)) {
      return false;
    }
    return true;
  });

  const seen = new Set<string>();

  const EFFECT_RULE_ALIASES: ReadonlyMap<string, string> = new Map([
    ["react-doctor/effect-no-event-handler", "effect-event-handler"],
    ["react-doctor/no-effect-event-handler", "effect-event-handler"],
    ["effect/no-event-handler", "effect-event-handler"],
    ["react-doctor/effect-no-derived-state", "effect-derived-state"],
    ["react-doctor/no-derived-state-effect", "effect-derived-state"],
    ["effect/no-derived-state", "effect-derived-state"],
    ["react-doctor/effect-no-chain-state-updates", "effect-chain-state"],
    ["react-doctor/no-effect-chain", "effect-chain-state"],
    ["effect/no-chain-state-updates", "effect-chain-state"],
    ["react-doctor/effect-no-adjust-state-on-prop-change", "effect-adjust-prop"],
    ["effect/no-adjust-state-on-prop-change", "effect-adjust-prop"],
    ["react-doctor/effect-no-initialize-state", "effect-init-state"],
    ["effect/no-initialize-state", "effect-init-state"],
    ["react-doctor/effect-no-pass-data-to-parent", "effect-pass-parent"],
    ["effect/no-pass-data-to-parent", "effect-pass-parent"],
    ["react-doctor/effect-no-pass-live-state-to-parent", "effect-pass-live-state"],
    ["effect/no-pass-live-state-to-parent", "effect-pass-live-state"],
    ["react-doctor/effect-no-reset-all-state-on-prop-change", "effect-reset-state"],
    ["effect/no-reset-all-state-on-prop-change", "effect-reset-state"],
  ]);

  const toCanonicalEffectKey = (ruleId: string): string | null =>
    EFFECT_RULE_ALIASES.get(ruleId) ?? null;

  return filtered.filter((issue) => {
    const loc = issue.location;
    if (!loc?.filePath || loc.line === undefined) return true;

    const unwrapped = toMetadataRuleKey(issue) ?? normalizeRuleId(issue);
    const baseKey = `${loc.filePath}:${loc.line}`;
    const dedupeKey = `${baseKey}:${unwrapped}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);

    const canonicalEffect = toCanonicalEffectKey(unwrapped);
    if (canonicalEffect) {
      const effectCanonKey = `${baseKey}:effect-canonical:${canonicalEffect}`;
      if (seen.has(effectCanonKey)) return false;
      seen.add(effectCanonKey);
    }

    return true;
  });
};
