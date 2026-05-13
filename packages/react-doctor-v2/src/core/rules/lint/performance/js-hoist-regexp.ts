import { defineRule } from "../../registry.js";
import { createLoopAwareVisitors, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const isDynamicPattern = (node: EsTreeNode): boolean => {
  const patternArgument = node.arguments?.[0];
  if (!patternArgument) return false;
  if (isNodeOfType(patternArgument, "Identifier")) return true;
  if (
    isNodeOfType(patternArgument, "TemplateLiteral") &&
    (patternArgument.expressions?.length ?? 0) > 0
  ) {
    return true;
  }
  return false;
};

export const jsHoistRegexp = defineRule<Rule>({
  recommendation:
    "Hoist RegExp construction out of loops, renders, and hot functions when the pattern is constant.",
  examples: [
    {
      before: `items.filter((item) => /react/i.test(item.name));`,
      after: `const REACT_PATTERN = /react/i;
items.filter((item) => REACT_PATTERN.test(item.name));`,
    },
  ],
  create: (context: RuleContext) =>
    createLoopAwareVisitors({
      NewExpression(node: EsTreeNode) {
        if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "RegExp") {
          if (isDynamicPattern(node)) return;
          context.report({
            node,
            message: "new RegExp() inside a loop - hoist to a module-level constant",
          });
        }
      },
    }),
});
