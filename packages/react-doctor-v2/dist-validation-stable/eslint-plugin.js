import { l as reactDoctorOxlintPlugin } from "./rules-k6al64g-.js";
import { r as reactDoctorOxlintRuleMetadata } from "./metadata-pW35UeI4.js";
//#region src/eslint-plugin.ts
const rules = {};
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
const reactDoctorEslintPlugin = {
  meta: { name: "eslint-plugin-react-doctor" },
  rules,
};
//#endregion
export { reactDoctorEslintPlugin as default, reactDoctorEslintPlugin };

//# sourceMappingURL=eslint-plugin.js.map
