import { createRequire } from "node:module";
import type { OxlintRuleSeverity } from "oxlint-plugin-react-doctor";

const esmRequire = createRequire(import.meta.url);

export interface JsPluginEntry {
  name: string;
  specifier: string;
}

type ReactHooksJsPluginEntry = JsPluginEntry;

interface ResolvedReactHooksJsPlugin {
  entry: ReactHooksJsPluginEntry;
  /** Rule names exported by the loaded plugin (e.g. "void-use-memo"). */
  availableRuleNames: ReadonlySet<string>;
}

interface MaybePluginModule {
  rules?: Record<string, unknown>;
  default?: { rules?: Record<string, unknown> };
}

const readPluginRuleNames = (pluginSpecifier: string): ReadonlySet<string> => {
  // HACK: oxlint resolves the plugin itself at scan time; we just need
  // a fast rule-name listing to filter our config so we don't
  // reference rules that don't exist in the user's installed version
  // (e.g. older eslint-plugin-react-hooks releases do not expose every
  // compiler rule). Failing to read the module is non-fatal - we fall
  // back to enabling every rule we have
  // configured for and let oxlint surface the mismatch (which preserves
  // pre-fix behavior for unknown plugin shapes).
  try {
    const pluginModule: MaybePluginModule = esmRequire(pluginSpecifier);
    const rules = pluginModule.rules ?? pluginModule.default?.rules;
    if (rules === undefined) return new Set();
    return new Set(Object.keys(rules));
  } catch {
    return new Set();
  }
};

export const resolveReactHooksJsPlugin = (
  hasReactCompiler: boolean,
  customRulesOnly: boolean,
): ResolvedReactHooksJsPlugin | null => {
  if (!hasReactCompiler || customRulesOnly) return null;
  let pluginSpecifier: string;
  try {
    pluginSpecifier = esmRequire.resolve("eslint-plugin-react-hooks");
  } catch {
    return null;
  }
  return {
    entry: { name: "react-hooks-js", specifier: pluginSpecifier },
    availableRuleNames: readPluginRuleNames(pluginSpecifier),
  };
};

export const filterRulesToAvailable = (
  rules: Record<string, OxlintRuleSeverity>,
  pluginNamespace: string,
  availableRuleNames: ReadonlySet<string>,
): Record<string, OxlintRuleSeverity> => {
  // Empty `availableRuleNames` means we couldn't introspect the plugin
  // (e.g. exotic export shape). Fall back to the unfiltered rule set so
  // we don't silently disable rules in supported configurations.
  if (availableRuleNames.size === 0) return rules;
  const ruleKeyPrefix = `${pluginNamespace}/`;
  const filtered: Record<string, OxlintRuleSeverity> = {};
  for (const [ruleKey, severity] of Object.entries(rules)) {
    if (!ruleKey.startsWith(ruleKeyPrefix)) {
      filtered[ruleKey] = severity;
      continue;
    }
    const ruleName = ruleKey.slice(ruleKeyPrefix.length);
    if (availableRuleNames.has(ruleName)) {
      filtered[ruleKey] = severity;
    }
  }
  return filtered;
};
