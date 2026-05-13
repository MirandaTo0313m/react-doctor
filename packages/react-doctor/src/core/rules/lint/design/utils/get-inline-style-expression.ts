import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getInlineStyleExpression = (node: EsTreeNode): EsTreeNode | null => {
  if (!isNodeOfType(node.name, "JSXIdentifier") || node.name.name !== "style") return null;
  if (!isNodeOfType(node.value, "JSXExpressionContainer")) return null;
  const expression = node.value.expression;
  if (!isNodeOfType(expression, "ObjectExpression")) return null;
  return expression;
};
