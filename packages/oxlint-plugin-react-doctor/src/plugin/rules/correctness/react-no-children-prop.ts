import { defineRule } from "../../utils/define-rule.js";
import { isCreateElementCall } from "../../utils/is-create-element-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

// Ported from oxc's `react/no-children-prop`. Children should be passed
// between JSX tags or as additional `React.createElement` arguments —
// passing them through a `children` prop bypasses React's child-flattening
// and key validation.
export const reactNoChildrenProp = defineRule<Rule>({
  id: "react-no-children-prop",
  severity: "warn",
  recommendation:
    'Place children between the opening and closing JSX tags (`<Foo>child</Foo>`) or pass them as extra arguments to `React.createElement` (`React.createElement(Foo, {}, "child")`)',
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      if (node.name.name !== "children") return;
      context.report({ node, message: "Avoid passing children using a prop." });
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isCreateElementCall(node)) return;
      const propsArgument = node.arguments?.[1];
      if (!propsArgument || !isNodeOfType(propsArgument, "ObjectExpression")) return;
      for (const property of propsArgument.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if (property.computed) continue;
        const isChildrenKey =
          (isNodeOfType(property.key, "Identifier") && property.key.name === "children") ||
          (isNodeOfType(property.key, "Literal") && property.key.value === "children");
        if (!isChildrenKey) continue;
        context.report({ node: property, message: "Avoid passing children using a prop." });
      }
    },
  }),
});
