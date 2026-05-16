import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const isReactDomRenderCall = (node: EsTreeNodeOfType<"CallExpression">): boolean => {
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "Identifier")) return false;
  if (node.callee.object.name !== "ReactDOM") return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return node.callee.property.name === "render";
};

// `parent` is the AST parent set by the host walker. We accept any of
// the contexts oxc accepts: assignment / variable init / object
// property value / `return` statement / arrow-expression body.
const isReturnValueConsumed = (callExpression: EsTreeNodeOfType<"CallExpression">): boolean => {
  const parent: EsTreeNode | null | undefined = callExpression.parent;
  if (!parent) return false;
  if (isNodeOfType(parent, "VariableDeclarator")) return parent.init === callExpression;
  if (isNodeOfType(parent, "Property")) return parent.value === callExpression;
  if (isNodeOfType(parent, "ReturnStatement")) return true;
  if (isNodeOfType(parent, "AssignmentExpression")) return parent.right === callExpression;
  if (isNodeOfType(parent, "ArrowFunctionExpression")) return parent.body === callExpression;
  return false;
};

// Ported from oxc's `react/no-render-return-value`. `ReactDOM.render`
// returns the rendered root in legacy React; React 19 removes
// `ReactDOM.render` entirely, so depending on its return value is
// strictly broken.
export const reactNoRenderReturnValue = defineRule<Rule>({
  id: "react-no-render-return-value",
  severity: "warn",
  recommendation:
    "Use a callback ref on the rendered element to capture the DOM node, or migrate to `createRoot` (React 18+) which does not expose the rendered instance",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isReactDomRenderCall(node)) return;
      if (!isReturnValueConsumed(node)) return;
      context.report({
        node: node.callee,
        message: "Do not depend on the return value from `ReactDOM.render`.",
      });
    },
  }),
});
