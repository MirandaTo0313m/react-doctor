import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getDerivingMethodName = (node: EsTreeNode): string | null => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  if (!isNodeOfType(node.callee, "MemberExpression")) return null;
  if (!isNodeOfType(node.callee.property, "Identifier")) return null;
  return node.callee.property.name;
};
