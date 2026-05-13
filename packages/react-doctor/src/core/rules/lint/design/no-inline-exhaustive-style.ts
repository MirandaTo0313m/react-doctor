import { defineRule } from "../../registry.js";
import {
  INLINE_STYLE_PROPERTY_THRESHOLD,
  OG_IMAGE_FILE_PATTERN,
  OG_ROUTE_PATTERN,
  getInlineStyleExpression,
  isNodeOfType,
} from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

export const noInlineExhaustiveStyle = defineRule<Rule>({
  recommendation:
    "Move large inline style objects to classes, CSS variables, or focused style helpers so design tokens remain reusable.",
  examples: [
    {
      before: `<div style={{ display: "flex", gap: 8, padding: 12 }} />`,
      after: `<div className="flex gap-2 p-3" />`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const isOgImageFile = OG_IMAGE_FILE_PATTERN.test(filename) || OG_ROUTE_PATTERN.test(filename);

    return {
      JSXAttribute(node: EsTreeNode) {
        if (isOgImageFile) return;
        const expression = getInlineStyleExpression(node);
        if (!expression) return;

        const propertyCount =
          expression.properties?.filter((property: EsTreeNode) =>
            isNodeOfType(property, "Property"),
          ).length ?? 0;

        if (propertyCount >= INLINE_STYLE_PROPERTY_THRESHOLD) {
          context.report({
            node: expression,
            message: `${propertyCount} inline style properties - extract to a CSS class, CSS module, or styled component for maintainability and reuse`,
          });
        }
      },
    };
  },
});
