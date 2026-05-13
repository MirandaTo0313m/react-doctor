interface ParsedOxlintRuleCode {
  pluginName: string;
  ruleId: string;
  ruleKey: string;
}

const WRAPPED_RULE_CODE_PATTERN = /^(.+)\((.+)\)$/;

const normalizePluginName = (pluginName: string): string =>
  pluginName.replace(/^eslint-plugin-/, "");

export const parseOxlintRuleCode = (code: string): ParsedOxlintRuleCode => {
  const wrappedRuleCode = WRAPPED_RULE_CODE_PATTERN.exec(code);
  if (wrappedRuleCode) {
    const pluginName = normalizePluginName(wrappedRuleCode[1]);
    const ruleId = wrappedRuleCode[2];
    return { pluginName, ruleId, ruleKey: `${pluginName}/${ruleId}` };
  }

  const separatorIndex = code.indexOf("/");
  if (separatorIndex < 0) {
    return { pluginName: "oxlint", ruleId: code, ruleKey: code };
  }

  const pluginName = normalizePluginName(code.slice(0, separatorIndex));
  const ruleId = code.slice(separatorIndex + 1);
  return { pluginName, ruleId, ruleKey: `${pluginName}/${ruleId}` };
};
