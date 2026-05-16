import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const isThisIsMountedCall = (node: EsTreeNodeOfType<"CallExpression">): boolean => {
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "ThisExpression")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return node.callee.property.name === "isMounted";
};

// Walks ancestors until we find a class method or createReactClass-style
// object property, matching oxc's "this call is in a class method" check.
const isInsideClassOrObjectMethod = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (isNodeOfType(current, "MethodDefinition")) return true;
    if (
      isNodeOfType(current, "Property") &&
      (isNodeOfType(current.value, "FunctionExpression") ||
        isNodeOfType(current.value, "ArrowFunctionExpression"))
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

// Ported from oxc's `react/no-is-mounted`. `this.isMounted()` was
// removed from class components in React 16.0; using it on function
// components has never worked. Anything that still calls it is buggy.
export const reactNoIsMounted = defineRule<Rule>({
  id: "react-no-is-mounted",
  severity: "warn",
  recommendation:
    "Track mount state explicitly (a ref toggled in `componentDidMount` / `componentWillUnmount`, or a cleanup-flagged ref in a `useEffect`)",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isThisIsMountedCall(node)) return;
      if (!isInsideClassOrObjectMethod(node)) return;
      context.report({ node, message: "Do not use `isMounted`." });
    },
  }),
});
