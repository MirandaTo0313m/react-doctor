import { defineRule } from "../../registry.js";
import { findJsxAttribute, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const BUTTON_COMPONENT_PATTERN = /Button$/;
const ICON_COMPONENT_PATTERN = /(?:Icon|Spinner|Loader|Glyph)$/;
const KNOWN_SELF_LABELED_BUTTON_COMPONENTS = new Set(["CloseButton"]);
const ICON_PROP_NAMES = new Set([
  "icon",
  "Icon",
  "leftIcon",
  "rightIcon",
  "startIcon",
  "endIcon",
  "prefixIcon",
  "suffixIcon",
]);

const getJsxName = (node: EsTreeNode | undefined): string | null => {
  if (!node) return null;
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXMemberExpression")) return getJsxName(node.property);
  return null;
};

const hasNonEmptyAttributeValue = (attribute: EsTreeNode | undefined): boolean => {
  if (!attribute) return false;
  if (!attribute.value) return false;
  if (isNodeOfType(attribute.value, "Literal")) {
    if (attribute.value.value === false || attribute.value.value === null) return false;
    return String(attribute.value.value ?? "").trim().length > 0;
  }
  const expression = attribute.value.expression;
  if (!expression) return false;
  if (isNodeOfType(expression, "Literal")) {
    if (expression.value === false || expression.value === null) return false;
    return String(expression.value ?? "").trim().length > 0;
  }
  return !isNodeOfType(expression, "Identifier") || expression.name !== "undefined";
};

const TEXT_CONTENT_PROP_NAMES = [
  "aria-label",
  "aria-labelledby",
  "accessibilityLabel",
  "accessibilityLabelledBy",
  "text",
  "label",
];

const hasAccessibleNameAttribute = (openingElement: EsTreeNode): boolean =>
  TEXT_CONTENT_PROP_NAMES.some((propName) =>
    hasNonEmptyAttributeValue(findJsxAttribute(openingElement.attributes ?? [], propName)),
  );

const hasTextContent = (node: EsTreeNode): boolean => {
  for (const child of node.children ?? []) {
    if (isNodeOfType(child, "JSXText") && child.value.trim().length > 0) return true;
    if (isNodeOfType(child, "JSXExpressionContainer")) {
      const expression = child.expression;
      if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
        if (expression.value.trim().length > 0) return true;
        continue;
      }
      if (isNodeOfType(expression, "TemplateLiteral")) return true;
      if (isNodeOfType(expression, "ConditionalExpression")) return true;
      if (isNodeOfType(expression, "Identifier") || isNodeOfType(expression, "MemberExpression"))
        return true;
    }
    if (isNodeOfType(child, "JSXElement") && hasTextContent(child)) return true;
  }
  return false;
};

const hasIconLikeChild = (node: EsTreeNode): boolean =>
  (node.children ?? []).some((child: EsTreeNode) => {
    if (!isNodeOfType(child, "JSXElement")) return false;
    const childName = getJsxName(child.openingElement?.name);
    return childName === "svg" || Boolean(childName && ICON_COMPONENT_PATTERN.test(childName));
  });

const hasIconLikeAttribute = (openingElement: EsTreeNode): boolean =>
  (openingElement.attributes ?? []).some(
    (attribute: EsTreeNode) =>
      isNodeOfType(attribute, "JSXAttribute") &&
      isNodeOfType(attribute.name, "JSXIdentifier") &&
      ICON_PROP_NAMES.has(attribute.name.name) &&
      hasNonEmptyAttributeValue(attribute),
  );

export const noIconOnlyButtonWithoutLabel = defineRule<Rule>({
  recommendation:
    "Give icon-only buttons an explicit accessible name and hide decorative icons from assistive tech; adding a tooltip is not enough because it is not the button name.",
  examples: [
    {
      before: `<button><XIcon /></button>`,
      after: `<button aria-label="Close dialog"><XIcon aria-hidden="true" /></button>`,
    },
  ],
  create: (context: RuleContext) => ({
    JSXElement(node: EsTreeNode) {
      const openingElement = node.openingElement;
      const elementName = getJsxName(openingElement?.name);
      if (elementName !== "button" && !BUTTON_COMPONENT_PATTERN.test(elementName ?? "")) return;
      if (elementName && KNOWN_SELF_LABELED_BUTTON_COMPONENTS.has(elementName)) return;
      if (hasAccessibleNameAttribute(openingElement)) return;
      if (hasTextContent(node)) return;
      const isNativeButton = elementName === "button";
      const hasIconEvidence = hasIconLikeChild(node) || hasIconLikeAttribute(openingElement);
      if (!hasIconEvidence) {
        if (!isNativeButton) return;
        if ((node.children ?? []).length > 0) return;
      }
      context.report({
        node: openingElement,
        message:
          "icon-only button has no accessible name - add aria-label or aria-labelledby and hide decorative icons with aria-hidden",
      });
    },
  }),
});
