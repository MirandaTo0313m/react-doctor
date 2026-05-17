import fs from "node:fs";
import reactDoctorPlugin, {
  BUILTIN_A11Y_RULES,
  BUILTIN_REACT_RULES,
  REACT_COMPILER_RULES,
} from "oxlint-plugin-react-doctor";
import type { OxlintRuleSeverity } from "oxlint-plugin-react-doctor";
import type { ProjectInfo } from "@react-doctor/types";
import { buildCapabilities, shouldEnableRule } from "./capabilities.js";
import { filterRulesToAvailable, resolveReactHooksJsPlugin } from "./plugin-resolution.js";
import type { JsPluginEntry } from "./plugin-resolution.js";

export interface OxlintConfigOptions {
  pluginPath: string;
  project: ProjectInfo;
  customRulesOnly?: boolean;
  extendsPaths?: string[];
  ignoredTags?: ReadonlySet<string>;
  serverAuthFunctionNames?: ReadonlyArray<string>;
}

const resolveSettingsRootDirectory = (rootDirectory: string): string => {
  if (!fs.existsSync(rootDirectory)) return rootDirectory;
  return fs.realpathSync(rootDirectory);
};

export const createOxlintConfig = ({
  pluginPath,
  project,
  customRulesOnly = false,
  extendsPaths = [],
  ignoredTags = new Set<string>(),
  serverAuthFunctionNames,
}: OxlintConfigOptions) => {
  const reactHooksJsPlugin = resolveReactHooksJsPlugin(project.hasReactCompiler, customRulesOnly);
  const reactCompilerRules = reactHooksJsPlugin
    ? filterRulesToAvailable(
        REACT_COMPILER_RULES,
        "react-hooks-js",
        reactHooksJsPlugin.availableRuleNames,
      )
    : {};

  const jsPlugins: JsPluginEntry[] = [];
  if (reactHooksJsPlugin) jsPlugins.push(reactHooksJsPlugin.entry);

  const capabilities = buildCapabilities(project);

  const enabledReactDoctorRules: Record<string, OxlintRuleSeverity> = {};
  for (const [ruleId, rule] of Object.entries(reactDoctorPlugin.rules)) {
    const fullKey = `react-doctor/${ruleId}`;
    // Framework-specific rules MUST opt in via a `requires` capability
    // (e.g. `requires: ["nextjs"]`). Global rules ship without `requires`
    // and activate unconditionally once any tag filters pass.
    if (rule.framework !== "global" && !rule.requires) continue;
    if (!shouldEnableRule(rule.requires, rule.tags, capabilities, ignoredTags)) continue;
    enabledReactDoctorRules[fullKey] = rule.severity;
  }

  return {
    ...(extendsPaths.length > 0 ? { extends: extendsPaths } : {}),
    categories: {
      correctness: "off",
      suspicious: "off",
      pedantic: "off",
      perf: "off",
      restriction: "off",
      style: "off",
      nursery: "off",
    },
    plugins: customRulesOnly ? [] : ["react", "jsx-a11y"],
    jsPlugins: [...jsPlugins, pluginPath],
    settings: {
      "react-doctor": {
        framework: project.framework,
        rootDirectory: resolveSettingsRootDirectory(project.rootDirectory),
        ...(serverAuthFunctionNames && serverAuthFunctionNames.length > 0
          ? { serverAuthFunctionNames: [...serverAuthFunctionNames] }
          : {}),
      },
    },
    rules: {
      ...(customRulesOnly ? {} : BUILTIN_REACT_RULES),
      ...(customRulesOnly ? {} : BUILTIN_A11Y_RULES),
      ...reactCompilerRules,
      ...enabledReactDoctorRules,
    },
  };
};
