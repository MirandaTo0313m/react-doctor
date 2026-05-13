import type { EsTreeNode } from "../../utils/index.js";
import { findJsxAttribute } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const hasTruthyAsChild = (openingElement: EsTreeNode): boolean => {
  const asChild = findJsxAttribute(openingElement.attributes ?? [], "asChild");
  if (!asChild) return false;
  if (!asChild.value) return true;
  if (isNodeOfType(asChild.value, "Literal")) return asChild.value.value !== false;
  const expression = asChild.value.expression;
  if (isNodeOfType(expression, "Literal")) return expression.value !== false;
  return Boolean(expression);
};
