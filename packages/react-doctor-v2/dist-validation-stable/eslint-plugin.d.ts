import { n as RuleContext, t as RuleVisitors } from "./rule-visitors-BaKMmsBH.js";

//#region src/eslint-plugin.d.ts
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
declare const reactDoctorEslintPlugin: EslintPlugin;
//#endregion
export { reactDoctorEslintPlugin as default, reactDoctorEslintPlugin };
//# sourceMappingURL=eslint-plugin.d.ts.map
