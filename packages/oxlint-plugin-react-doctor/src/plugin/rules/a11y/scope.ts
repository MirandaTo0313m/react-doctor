import { HTML_TAGS } from "../../constants/html-tags.js";
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getElementType } from "../../utils/get-element-type.js";
import { hasJsxProp } from "../../utils/has-jsx-prop.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE = "`scope` attribute is only valid on `<th>` elements — remove it from this element.";

// Port of `oxc_linter::rules::jsx_a11y::scope`. Flags `scope=` on
// non-`<th>` elements.
export const scope = defineRule<Rule>({
  id: "scope",
  severity: "warn",
  recommendation: "Use `scope` only on `<th>` elements.",
  category: "Accessibility",
  create: (context) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      const scopeAttribute = hasJsxProp(node.attributes, "scope");
      if (!scopeAttribute) return;
      const tag = getElementType(node, context.settings);
      // Only flag known HTML elements that aren't <th>. Custom JSX
      // components could resolve to any tag at runtime.
      if (!HTML_TAGS.has(tag)) return;
      if (tag !== "th") {
        context.report({ node: scopeAttribute, message: MESSAGE });
      }
    },
  }),
});
