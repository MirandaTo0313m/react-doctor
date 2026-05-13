import type { EsTreeNode } from "../../utils/index.js";
import { CONTINUOUS_VALUE_HOOK_PATTERN } from "./continuous-value-hook-pattern.js";
import { isNodeOfType } from "../../utils/index.js";
import { isThresholdComparison } from "./is-threshold-comparison.js";

export const findThresholdDerivedBindings = (
  componentBody: EsTreeNode,
): Array<{ continuousName: string; hookName: string; declarator: EsTreeNode }> => {
  const out: Array<{ continuousName: string; hookName: string; declarator: EsTreeNode }> = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return out;
  const statements = componentBody.body ?? [];

  for (let outerIndex = 0; outerIndex < statements.length; outerIndex++) {
    const outerStatement = statements[outerIndex];
    if (!isNodeOfType(outerStatement, "VariableDeclaration")) continue;

    for (const declarator of outerStatement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      const init = declarator.init;
      if (!isNodeOfType(init, "CallExpression")) continue;
      if (!isNodeOfType(init.callee, "Identifier")) continue;
      if (!CONTINUOUS_VALUE_HOOK_PATTERN.test(init.callee.name)) continue;

      const continuousName = declarator.id.name;
      const hookName = init.callee.name;

      // Look at the next statement(s) for a derived threshold binding.
      for (let innerIndex = outerIndex + 1; innerIndex < statements.length; innerIndex++) {
        const innerStatement = statements[innerIndex];
        if (!isNodeOfType(innerStatement, "VariableDeclaration")) break;
        let foundThreshold = false;
        for (const innerDecl of innerStatement.declarations ?? []) {
          if (innerDecl.init && isThresholdComparison(innerDecl.init, continuousName)) {
            foundThreshold = true;
            break;
          }
        }
        if (foundThreshold) {
          out.push({ continuousName, hookName, declarator });
          break;
        }
      }
    }
  }
  return out;
};
