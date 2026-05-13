import { defineRule } from "../../registry.js";
import { isMotionElement, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const ANIMATION_STYLE_KEYS = new Set(["transition", "animation", "animationName"]);

const hasAnimationSibling = (properties: EsTreeNode[]): boolean =>
  properties.some(
    (property) =>
      isNodeOfType(property, "Property") &&
      isNodeOfType(property.key, "Identifier") &&
      ANIMATION_STYLE_KEYS.has(property.key.name),
  );

export const noPermanentWillChange = defineRule<Rule>({
  recommendation:
    "Apply will-change only shortly before an animation starts and remove it when the animation ends.",
  examples: [
    {
      before: `.card { will-change: transform; }`,
      after: `.card.animating { will-change: transform; }`,
    },
  ],
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNode) {
      if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return;
      if (!isNodeOfType(node.value, "JSXExpressionContainer")) return;

      const expression = node.value.expression;
      if (!isNodeOfType(expression, "ObjectExpression")) return;

      if (isMotionElement(node)) return;

      const properties = expression.properties ?? [];
      if (hasAnimationSibling(properties)) return;

      for (const property of properties) {
        if (!isNodeOfType(property, "Property")) continue;
        const key = isNodeOfType(property.key, "Identifier") ? property.key.name : null;
        if (key !== "willChange") continue;

        context.report({
          node: property,
          message:
            "Permanent will-change wastes GPU memory - apply only during active animation and remove after",
        });
      }
    },
  }),
});
