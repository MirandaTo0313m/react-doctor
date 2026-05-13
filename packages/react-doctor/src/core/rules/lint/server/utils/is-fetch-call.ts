import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isFetchCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  return isNodeOfType(node.callee, "Identifier") && node.callee.name === "fetch";
};
