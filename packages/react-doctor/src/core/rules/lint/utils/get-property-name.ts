import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";

export const getPropertyName = (property: EsTreeNode): string | null => {
  if (!isNodeOfType(property, "Property")) return null;
  if (isNodeOfType(property.key, "Identifier")) return property.key.name;
  if (isNodeOfType(property.key, "Literal")) return String(property.key.value);
  return null;
};
