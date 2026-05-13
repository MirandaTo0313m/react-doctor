import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getStylePropertyKey = (property: EsTreeNode): string | null => {
  if (!isNodeOfType(property, "Property")) return null;
  if (isNodeOfType(property.key, "Identifier")) return property.key.name;
  if (isNodeOfType(property.key, "Literal") && typeof property.key.value === "string")
    return property.key.value;
  return null;
};
