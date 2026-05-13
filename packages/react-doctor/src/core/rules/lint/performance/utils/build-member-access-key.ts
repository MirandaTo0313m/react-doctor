import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const buildMemberAccessKey = (node: EsTreeNode): string | null => {
  if (isNodeOfType(node, "Identifier")) return node.name;
  if (isNodeOfType(node, "ThisExpression")) return "this";
  if (!isNodeOfType(node, "MemberExpression") || node.computed) return null;
  const objectKey = buildMemberAccessKey(node.object);
  if (!objectKey) return null;
  if (!isNodeOfType(node.property, "Identifier")) return null;
  return `${objectKey}.${node.property.name}`;
};
