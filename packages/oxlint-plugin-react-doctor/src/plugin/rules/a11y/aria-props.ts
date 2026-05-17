import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getJsxAttributeName } from "../../utils/get-jsx-attribute-name.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import { isValidAriaProperty } from "../../constants/aria-properties.js";

const buildMessage = (name: string): string =>
  `\`${name}\` is not a valid ARIA property — check WAI-ARIA spec.`;

// Port of `oxc_linter::rules::jsx_a11y::aria_props`. Reports any
// attribute name starting with `aria-` that isn't a recognized WAI-ARIA
// property.
export const ariaProps = defineRule<Rule>({
  id: "aria-props",
  severity: "error",
  recommendation: "Use only documented `aria-*` attributes.",
  category: "Accessibility",
  create: (context) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const name = getJsxAttributeName(node.name);
      if (!name || !name.startsWith("aria-")) return;
      if (!isValidAriaProperty(name)) {
        context.report({ node: node.name, message: buildMessage(name) });
      }
    },
  }),
});
