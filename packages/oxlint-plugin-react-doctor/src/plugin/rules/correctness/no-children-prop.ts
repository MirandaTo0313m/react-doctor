import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const MESSAGE = "Do not pass children as props — use JSX nesting instead: <Component>children</Component>";

export const noChildrenProp = defineRule<Rule>({
  id: "no-children-prop",
  severity: "warn",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "children") return;
      context.report({ node, message: MESSAGE });
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isNodeOfType(node.callee, "MemberExpression")) return;
      if (!isNodeOfType(node.callee.object, "Identifier") || node.callee.object.name !== "React") return;
      if (!isNodeOfType(node.callee.property, "Identifier") || node.callee.property.name !== "createElement") return;
      const propsArgument = node.arguments?.[1];
      if (!propsArgument || !isNodeOfType(propsArgument, "ObjectExpression")) return;
      for (const property of propsArgument.properties) {
        if (
          isNodeOfType(property, "Property") &&
          isNodeOfType(property.key, "Identifier") &&
          property.key.name === "children"
        ) {
          context.report({ node: property, message: MESSAGE });
        }
      }
    },
  }),
});
