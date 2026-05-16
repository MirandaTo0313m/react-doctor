import { defineRule } from "../../utils/define-rule.js";
import { findJsxAttribute } from "../../utils/find-jsx-attribute.js";
import { isCreateElementCall } from "../../utils/is-create-element-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const DANGEROUSLY_SET_INNER_HTML = "dangerouslySetInnerHTML";

// Ported from oxc's `react/no-danger`. `dangerouslySetInnerHTML`
// injects raw HTML and is the canonical XSS vector in React; flagging
// any usage forces an explicit `// eslint-disable-next-line` audit
// trail at every call site.
export const reactNoDanger = defineRule<Rule>({
  id: "react-no-danger",
  severity: "warn",
  recommendation:
    "Render the dynamic content as text (React escapes it) or pre-sanitize the HTML with a vetted library (DOMPurify) before injecting",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      const dangerAttribute = findJsxAttribute(node.attributes ?? [], DANGEROUSLY_SET_INNER_HTML);
      if (!dangerAttribute) return;
      context.report({
        node: dangerAttribute.name,
        message: "Do not use `dangerouslySetInnerHTML` prop.",
      });
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isCreateElementCall(node)) return;
      const propsArgument = node.arguments?.[1];
      if (!propsArgument || !isNodeOfType(propsArgument, "ObjectExpression")) return;
      for (const property of propsArgument.properties ?? []) {
        if (!isNodeOfType(property, "Property")) continue;
        if (property.computed) continue;
        const isDangerKey =
          (isNodeOfType(property.key, "Identifier") &&
            property.key.name === DANGEROUSLY_SET_INNER_HTML) ||
          (isNodeOfType(property.key, "Literal") &&
            property.key.value === DANGEROUSLY_SET_INNER_HTML);
        if (!isDangerKey) continue;
        context.report({ node: property, message: "Do not use `dangerouslySetInnerHTML` prop." });
      }
    },
  }),
});
