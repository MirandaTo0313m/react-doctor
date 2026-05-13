import { u as reactDoctorOxlintRules } from "./rules-k6al64g-.js";
import { createRequire } from "node:module";
//#region src/core/rules/lint/config.ts
const esmRequire = createRequire(import.meta.url);
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
const CURATED_OXLINT_RULES = {
  ...BUILTIN_REACT_OXLINT_RULES,
  ...BUILTIN_A11Y_OXLINT_RULES,
  ...REACT_COMPILER_OXLINT_RULES,
  ...REACT_DOCTOR_CUSTOM_OXLINT_RULES,
};
const ALL_REACT_DOCTOR_OXLINT_RULE_KEYS = new Set(Object.keys(REACT_DOCTOR_CUSTOM_OXLINT_RULES));
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
    const pluginModule = esmRequire(pluginSpecifier);
    const rules = pluginModule.rules ?? pluginModule.default?.rules;
    return rules ? new Set(Object.keys(rules)) : /* @__PURE__ */ new Set();
  } catch {
    return /* @__PURE__ */ new Set();
  }
};
const resolveOptionalJsPlugin = (namespace, pluginSpecifier) => {
  try {
    const resolvedSpecifier = esmRequire.resolve(pluginSpecifier);
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
export {
  createReactDoctorOxlintConfig as _,
  BUILTIN_A11Y_OXLINT_RULES as a,
  shouldEnableReactDoctorOxlintRule as b,
  CURATED_OXLINT_RULES as c,
  REACT_COMPILER_OXLINT_RULES as d,
  REACT_DOCTOR_CUSTOM_OXLINT_RULES as f,
  buildReactDoctorOxlintCapabilities as g,
  TANSTACK_START_OXLINT_RULES as h,
  ALL_REACT_DOCTOR_OXLINT_RULE_KEYS as i,
  GLOBAL_REACT_DOCTOR_OXLINT_RULES as l,
  TANSTACK_QUERY_OXLINT_RULES as m,
  REACT_DOCTOR_OXLINT_RULE_ID_PREFIX as n,
  BUILTIN_OXLINT_RULES as o,
  REACT_NATIVE_OXLINT_RULES as p,
  reactDoctorOxlintRuleMetadata as r,
  BUILTIN_REACT_OXLINT_RULES as s,
  REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE as t,
  NEXTJS_OXLINT_RULES as u,
  getReactDoctorRuleTags as v,
  reactPeerRangeMinMajor as y,
};

//# sourceMappingURL=metadata-pW35UeI4.js.map
