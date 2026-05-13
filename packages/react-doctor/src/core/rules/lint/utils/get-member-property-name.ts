import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";

export const getMemberPropertyName = (node: EsTreeNode | undefined): string | null => {
  if (!isNodeOfType(node, "MemberExpression")) return null;
  if (isNodeOfType(node.property, "Identifier")) return node.property.name;
  if (isNodeOfType(node.property, "Literal")) return String(node.property.value);
  return null;
};
