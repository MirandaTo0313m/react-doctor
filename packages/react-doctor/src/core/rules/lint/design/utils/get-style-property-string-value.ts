import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getStylePropertyStringValue = (property: EsTreeNode): string | null => {
  if (isNodeOfType(property.value, "Literal") && typeof property.value.value === "string") {
    return property.value.value;
  }
  return null;
};
