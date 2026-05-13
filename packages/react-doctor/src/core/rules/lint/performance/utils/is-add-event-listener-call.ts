import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isAddEventListenerCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  if (node.callee.property.name !== "addEventListener") return false;
  return true;
};
