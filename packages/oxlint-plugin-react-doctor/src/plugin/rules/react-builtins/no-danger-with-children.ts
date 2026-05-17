import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { hasJsxPropIgnoreCase } from "../../utils/has-jsx-prop-ignore-case.js";
import { isCreateElementCall } from "../../utils/is-create-element-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE =
  "Only set one of `children` or `dangerouslySetInnerHTML` — React throws a runtime warning when both are present.";

// True when JSXText is whitespace-only with at least one newline (the
// "auto-formatted JSX" line break that doesn't count as a child).
const isLineBreak = (child: EsTreeNode): boolean => {
  if (!isNodeOfType(child, "JSXText")) return false;
  return child.value.trim().length === 0 && child.value.includes("\n");
};

// Port of `oxc_linter::rules::react::no_danger_with_children`. Reports
// when the same JSX element / createElement call has BOTH a `children`
// prop / nested children AND `dangerouslySetInnerHTML`.
export const noDangerWithChildren = defineRule<Rule>({
  id: "no-danger-with-children",
  severity: "error",
  recommendation: "Use either `children` or `dangerouslySetInnerHTML`, never both.",
  category: "Correctness",
  create: (context) => ({
    JSXElement(node: EsTreeNodeOfType<"JSXElement">) {
      const opening = node.openingElement;
      const hasChildrenProp = Boolean(hasJsxPropIgnoreCase(opening.attributes, "children"));
      const hasNestedChildren =
        node.children.length > 0 && !isLineBreak(node.children[0] as EsTreeNode);
      if (!hasChildrenProp && !hasNestedChildren) return;
      if (hasJsxPropIgnoreCase(opening.attributes, "dangerouslySetInnerHTML")) {
        context.report({ node: opening, message: MESSAGE });
      }
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      // createElement calls with <2 args can't have both.
      if (node.arguments.length <= 1) return;
      if (!isCreateElementCall(node as EsTreeNode)) return;
      const propsArgument = node.arguments[1];
      if (!propsArgument || !isNodeOfType(propsArgument, "ObjectExpression")) return;

      // Find dangerouslySetInnerHTML in props.
      let hasDangerously = false;
      let hasChildrenProp = false;
      for (const property of propsArgument.properties) {
        if (!isNodeOfType(property, "Property")) continue;
        if (property.computed) continue;
        const key = property.key;
        let propName: string | null = null;
        if (isNodeOfType(key, "Identifier")) propName = key.name;
        else if (isNodeOfType(key, "Literal") && typeof key.value === "string")
          propName = key.value;
        if (propName === "dangerouslySetInnerHTML") hasDangerously = true;
        if (propName === "children") hasChildrenProp = true;
      }
      if (!hasDangerously) return;

      // 3+ args means createElement(tag, props, ...children) — children
      // are passed positionally.
      const hasPositionalChildren = node.arguments.length >= 3;
      if (hasPositionalChildren || hasChildrenProp) {
        context.report({ node, message: MESSAGE });
      }
    },
  }),
});
