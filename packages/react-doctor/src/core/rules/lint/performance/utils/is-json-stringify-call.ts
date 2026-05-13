import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isJsonStringifyCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "Identifier")) return false;
  if (node.callee.object.name !== "JSON") return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return node.callee.property.name === "stringify";
};
