import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getRootIdentifierName = (node: EsTreeNode | undefined): string | null => {
  if (!node) return null;
  if (isNodeOfType(node, "Identifier")) return node.name;
  if (isNodeOfType(node, "MemberExpression")) return getRootIdentifierName(node.object);
  return null;
};
