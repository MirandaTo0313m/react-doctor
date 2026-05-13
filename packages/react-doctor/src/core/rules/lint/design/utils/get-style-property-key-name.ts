import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getStylePropertyKeyName = (objectProperty: EsTreeNode): string | null => {
  if (!isNodeOfType(objectProperty, "Property")) return null;
  if (isNodeOfType(objectProperty.key, "Identifier")) return objectProperty.key.name;
  if (isNodeOfType(objectProperty.key, "Literal") && typeof objectProperty.key.value === "string") {
    return objectProperty.key.value;
  }
  return null;
};
