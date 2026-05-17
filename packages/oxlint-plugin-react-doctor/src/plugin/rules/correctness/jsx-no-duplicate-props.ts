import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

export const jsxNoDuplicateProps = defineRule<Rule>({
  id: "jsx-no-duplicate-props",
  severity: "error",
  recommendation: "Remove the duplicate prop — the last value silently wins and the earlier one is ignored",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      const seenProps = new Set<string>();
      for (const attribute of node.attributes) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        const propName = isNodeOfType(attribute.name, "JSXIdentifier")
          ? attribute.name.name
          : isNodeOfType(attribute.name, "JSXNamespacedName")
            ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
            : null;
        if (!propName) continue;
        if (seenProps.has(propName)) {
          context.report({
            node: attribute,
            message: `Duplicate prop "${propName}" — only the last value will be used`,
          });
        }
        seenProps.add(propName);
      }
    },
  }),
});
