import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getInlineStyleObjectExpression = (jsxAttribute: EsTreeNode): EsTreeNode | null => {
  if (!isNodeOfType(jsxAttribute.name, "JSXIdentifier") || jsxAttribute.name.name !== "style") {
    return null;
  }
  if (!isNodeOfType(jsxAttribute.value, "JSXExpressionContainer")) return null;
  const expression = jsxAttribute.value.expression;
  if (!isNodeOfType(expression, "ObjectExpression")) return null;
  return expression;
};
