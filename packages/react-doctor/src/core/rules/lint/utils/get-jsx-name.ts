import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";

export const getJsxName = (node: EsTreeNode | undefined): string | null => {
  if (!node) return null;
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXMemberExpression")) {
    const objectName = getJsxName(node.object);
    const propertyName = getJsxName(node.property);
    return objectName && propertyName ? `${objectName}.${propertyName}` : propertyName;
  }
  return null;
};
