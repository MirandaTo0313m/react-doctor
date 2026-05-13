import { reactDoctorOxlintRuleMetadata, reactDoctorOxlintPlugin } from "./core/rules/index.js";
import type { RuleContext, RuleVisitors } from "./core/rules/lint/utils/index.js";

interface EslintRuleDefinition {
  meta: {
    docs: {
      description: string;
      recommended: boolean;
    };
    type: "problem" | "suggestion";
  };
  create: (context: RuleContext) => RuleVisitors;
}

interface EslintPlugin {
  meta: {
    name: string;
  };
  rules: Record<string, EslintRuleDefinition>;
}

const rules: Record<string, EslintRuleDefinition> = {};

for (const metadata of reactDoctorOxlintRuleMetadata) {
  const rule = reactDoctorOxlintPlugin.rules[metadata.oxlintRuleName];
  if (!rule) continue;
  rules[metadata.oxlintRuleName] = {
    meta: {
      docs: {
        description: metadata.description,
        recommended: metadata.defaultEnabled,
      },
      type: metadata.severity === "error" ? "problem" : "suggestion",
    },
    create: rule.create,
  };
}

export const reactDoctorEslintPlugin: EslintPlugin = {
  meta: { name: "eslint-plugin-react-doctor" },
  rules,
};

export default reactDoctorEslintPlugin;
