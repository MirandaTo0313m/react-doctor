import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isInsideClassBody = (node: EsTreeNode): boolean => {
  let current = node.parent;
  while (current) {
    if (isNodeOfType(current, "ClassBody")) return true;
    if (
      isNodeOfType(current, "FunctionDeclaration") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "ArrowFunctionExpression")
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
};
