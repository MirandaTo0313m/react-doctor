import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getStylePropertyNumericValue = (objectProperty: EsTreeNode): number | null => {
  const valueNode = objectProperty.value;
  if (!valueNode) return null;
  if (isNodeOfType(valueNode, "Literal") && typeof valueNode.value === "number")
    return valueNode.value;
  if (isNodeOfType(valueNode, "Literal") && typeof valueNode.value === "string") {
    const parsed = parseFloat(valueNode.value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
