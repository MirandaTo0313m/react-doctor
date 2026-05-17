import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";

const RENDER_METHODS = new Set(["render", "hydrate"]);

const isReactDomRenderCall = (node: EsTreeNodeOfType<"CallExpression">): boolean => {
  const callee = node.callee;
  if (isNodeOfType(callee, "MemberExpression")) {
    if (!isNodeOfType(callee.property, "Identifier") || !RENDER_METHODS.has(callee.property.name))
      return false;
    if (isNodeOfType(callee.object, "Identifier") && callee.object.name === "ReactDOM") return true;
    if (
      isNodeOfType(callee.object, "MemberExpression") &&
      isNodeOfType(callee.object.object, "Identifier") &&
      callee.object.object.name === "ReactDOM"
    )
      return true;
  }
  return false;
};

const isUsedAsValue = (node: EsTreeNode): boolean => {
  const parent = node.parent;
  if (!parent) return false;
  if (isNodeOfType(parent, "VariableDeclarator")) return true;
  if (isNodeOfType(parent, "AssignmentExpression")) return true;
  if (isNodeOfType(parent, "Property")) return true;
  if (isNodeOfType(parent, "ReturnStatement")) return true;
  if (
    isNodeOfType(parent, "ArrowFunctionExpression") &&
    parent.body === node
  )
    return true;
  return false;
};

const MESSAGE =
  "Do not depend on the return value of ReactDOM.render() — it may return undefined in future React versions";

export const noRenderReturnValue = defineRule<Rule>({
  id: "no-render-return-value",
  severity: "warn",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isReactDomRenderCall(node)) return;
      if (!isUsedAsValue(node)) return;
      context.report({ node, message: MESSAGE });
    },
  }),
});
