import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const isInsideComponentBody = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (isNodeOfType(current, "ClassDeclaration") || isNodeOfType(current, "ClassExpression"))
      return true;
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "Identifier") &&
      current.callee.name === "createReactClass"
    )
      return true;
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "MemberExpression") &&
      isNodeOfType(current.callee.property, "Identifier") &&
      current.callee.property.name === "createReactClass"
    )
      return true;
    current = current.parent;
  }
  return false;
};

const isLiteralRefAttribute = (node: EsTreeNodeOfType<"JSXAttribute">): boolean => {
  if (!isNodeOfType(node.name, "JSXIdentifier")) return false;
  if (node.name.name !== "ref") return false;
  if (!node.value) return false;
  if (isNodeOfType(node.value, "Literal") && typeof node.value.value === "string") return true;
  if (isNodeOfType(node.value, "JSXExpressionContainer")) {
    const expression = node.value.expression;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") return true;
  }
  return false;
};

// Ported from oxc's `react/no-string-refs`. String refs were deprecated
// in React 16.3 and removed entirely in React 19. We flag both forms:
// (1) `ref="hello"` on a JSX element, and (2) `this.refs.x` reads
// inside a component body.
export const reactNoStringRefs = defineRule<Rule>({
  id: "react-no-string-refs",
  severity: "error",
  recommendation:
    "Replace string refs with callback refs (`ref={(el) => { this.hello = el; }}`) or with `React.createRef()` / `useRef()` for function components — string refs are removed in React 19",
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isLiteralRefAttribute(node)) return;
      context.report({
        node,
        message: "Using string literals in ref attributes is deprecated.",
      });
    },
    MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
      if (!isNodeOfType(node.object, "ThisExpression")) return;
      if (!isNodeOfType(node.property, "Identifier")) return;
      if (node.property.name !== "refs") return;
      if (!isInsideComponentBody(node)) return;
      context.report({ node, message: "Using this.refs is deprecated." });
    },
  }),
});
