import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isThresholdComparison = (node: EsTreeNode, valueName: string): boolean => {
  if (!isNodeOfType(node, "BinaryExpression")) return false;
  if (!["<", "<=", ">", ">=", "===", "!==", "==", "!="].includes(node.operator)) return false;
  const referencesContinuous =
    (isNodeOfType(node.left, "Identifier") && node.left.name === valueName) ||
    (isNodeOfType(node.right, "Identifier") && node.right.name === valueName);
  if (!referencesContinuous) return false;
  return isNodeOfType(node.left, "Literal") || isNodeOfType(node.right, "Literal");
};
