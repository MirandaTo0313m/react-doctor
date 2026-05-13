import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// Identifiers and member-access chains are technically "simple", but memoizing
// them is sometimes intentional (stable reference passing). Only flag arithmetic
// / literal trivial cases to keep false positives low.

export const isMemoCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (isNodeOfType(node.callee, "Identifier") && node.callee.name === "memo") return true;
  if (
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.object, "Identifier") &&
    node.callee.object.name === "React" &&
    isNodeOfType(node.callee.property, "Identifier") &&
    node.callee.property.name === "memo"
  )
    return true;
  return false;
};
