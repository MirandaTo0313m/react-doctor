import { defineRule } from "../../registry.js";
import { isMemberProperty, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const isInsideToSortedPolyfill = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "Property") &&
      isNodeOfType(current.key, "Literal") &&
      current.key.value === "toSorted"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

export const jsTosortedImmutable = defineRule<Rule>({
  recommendation:
    "Use toSorted for immutable sorting instead of cloning and mutating arrays with sort.",
  examples: [
    {
      before: `items.sort(sortByName);`,
      after: `const sortedItems = items.toSorted(sortByName);`,
    },
  ],
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNode) {
      if (!isMemberProperty(node.callee, "sort")) return;

      const receiver = node.callee.object;
      if (
        isNodeOfType(receiver, "ArrayExpression") &&
        receiver.elements?.length === 1 &&
        isNodeOfType(receiver.elements[0], "SpreadElement")
      ) {
        if (isInsideToSortedPolyfill(node)) return;
        context.report({
          node,
          message: "[...array].sort() - use array.toSorted() for immutable sorting (ES2023)",
        });
      }
    },
  }),
});
