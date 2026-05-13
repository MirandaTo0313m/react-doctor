import { defineRule } from "../../registry.js";
import {
  OG_IMAGE_FILE_PATTERN,
  OG_ROUTE_PATTERN,
  findJsxAttribute,
  isNodeOfType,
} from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const NON_OPTIMIZABLE_SRC_PATTERN =
  /^(?:data:|blob:)|\.svg(?:[?#].*)?$|(?:^|\/)(?:favicon|icon|logo|mark|badge)(?:[/?#.]|$)/i;

const isNonOptimizableSrc = (openingElement: EsTreeNode): boolean => {
  const srcAttribute = findJsxAttribute(openingElement.attributes ?? [], "src");
  if (!srcAttribute) return false;
  const value = srcAttribute.value;
  if (isNodeOfType(value, "Literal") && typeof value.value === "string") {
    return NON_OPTIMIZABLE_SRC_PATTERN.test(value.value);
  }
  if (
    isNodeOfType(value, "JSXExpressionContainer") &&
    isNodeOfType(value.expression, "Literal") &&
    typeof value.expression.value === "string"
  ) {
    return NON_OPTIMIZABLE_SRC_PATTERN.test(value.expression.value);
  }
  return false;
};

export const nextjsNoImgElement = defineRule<Rule>({
  recommendation:
    "Use next/image for images so sizing, optimization, lazy loading, and responsive formats are handled by Next.js.",
  examples: [
    {
      before: `<img src="/hero.png" alt="Hero" />`,
      after: `<Image src="/hero.png" alt="Hero" width={1200} height={800} />`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const isOgImageFile = OG_ROUTE_PATTERN.test(filename) || OG_IMAGE_FILE_PATTERN.test(filename);

    return {
      JSXOpeningElement(node: EsTreeNode) {
        if (isOgImageFile) return;
        if (isNodeOfType(node.name, "JSXIdentifier") && node.name.name === "img") {
          if (isNonOptimizableSrc(node)) return;
          context.report({
            node,
            message:
              "Use next/image instead of <img> - provides automatic optimization, lazy loading, and responsive srcset",
          });
        }
      },
    };
  },
});
