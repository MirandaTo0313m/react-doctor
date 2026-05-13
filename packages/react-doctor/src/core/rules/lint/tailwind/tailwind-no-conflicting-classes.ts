import { defineRule } from "../../registry.js";
import { findClassNameLiteral, findTailwindClassConflict } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

export const tailwindNoConflictingClasses = defineRule<Rule>({
  recommendation:
    "Remove same-variant Tailwind utilities that fight for the same CSS property; keep the one intended final value instead of relying on class order.",
  examples: [
    {
      before: `<div className="flex grid p-2 p-4" />`,
      after: `<div className="grid p-4" />`,
    },
  ],
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNode) {
      const classNameLiteral = findClassNameLiteral(node);
      if (!classNameLiteral) return;
      const conflict = findTailwindClassConflict(classNameLiteral.value);
      if (!conflict) return;
      context.report({
        node: classNameLiteral.attribute,
        message: `Tailwind class "${conflict.token}" conflicts with earlier "${conflict.previousToken}" ${conflict.group} utility - remove the overridden class`,
      });
    },
  }),
});
