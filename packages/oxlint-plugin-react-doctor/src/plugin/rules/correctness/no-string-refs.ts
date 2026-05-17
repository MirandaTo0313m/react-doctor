import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const MESSAGE = "Using string refs is deprecated — use useRef() or React.createRef() instead";

export const noStringRefs = defineRule<Rule>({
  id: "no-string-refs",
  severity: "warn",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "ref") return;
      if (!node.value) return;
      if (isNodeOfType(node.value, "Literal") && typeof node.value.value === "string") {
        context.report({ node, message: MESSAGE });
        return;
      }
      if (
        isNodeOfType(node.value, "JSXExpressionContainer") &&
        isNodeOfType(node.value.expression, "Literal") &&
        typeof node.value.expression.value === "string"
      ) {
        context.report({ node, message: MESSAGE });
        return;
      }
      if (
        isNodeOfType(node.value, "JSXExpressionContainer") &&
        isNodeOfType(node.value.expression, "TemplateLiteral")
      ) {
        context.report({ node, message: MESSAGE });
      }
    },
    MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
      if (
        isNodeOfType(node.object, "MemberExpression") &&
        isNodeOfType(node.object.object, "ThisExpression") &&
        isNodeOfType(node.object.property, "Identifier") &&
        node.object.property.name === "refs"
      ) {
        context.report({ node, message: MESSAGE });
      }
    },
  }),
});
