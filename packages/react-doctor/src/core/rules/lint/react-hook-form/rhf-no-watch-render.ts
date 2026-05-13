import { defineRule } from "../../registry.js";
import { isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const REACT_HOOK_FORM_IMPORT_PATTERN = /^react-hook-form$/;

export const rhfNoWatchRender = defineRule<Rule>({
  recommendation:
    "Use useWatch for render-time React Hook Form subscriptions; watch() in render subscribes broadly and can rerender the whole form.",
  examples: [
    {
      before: `const value = watch("email");`,
      after: `const value = useWatch({ control, name: "email" });`,
    },
  ],
  create: (context: RuleContext) => {
    let hasReactHookFormImport = false;

    return {
      ImportDeclaration(node: EsTreeNode) {
        const source = node.source?.value;
        if (typeof source === "string" && REACT_HOOK_FORM_IMPORT_PATTERN.test(source)) {
          hasReactHookFormImport = true;
        }
      },
      CallExpression(node: EsTreeNode) {
        if (!hasReactHookFormImport) return;
        if (!isNodeOfType(node.callee, "Identifier") || node.callee.name !== "watch") return;
        context.report({
          node,
          message:
            "watch() called during render - use useWatch({ control, name }) for a focused subscription",
        });
      },
    };
  },
});
