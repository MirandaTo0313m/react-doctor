import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getEnclosingFunctionBindingName = (enclosingFunction: EsTreeNode): string | null => {
  if (
    isNodeOfType(enclosingFunction, "FunctionDeclaration") &&
    isNodeOfType(enclosingFunction.id, "Identifier")
  ) {
    return enclosingFunction.id.name;
  }
  const directParent = enclosingFunction.parent;
  if (
    isNodeOfType(directParent, "VariableDeclarator") &&
    isNodeOfType(directParent.id, "Identifier")
  ) {
    return directParent.id.name;
  }
  if (
    isNodeOfType(directParent, "AssignmentExpression") &&
    directParent.right === enclosingFunction &&
    isNodeOfType(directParent.left, "Identifier")
  ) {
    return directParent.left.name;
  }
  return null;
};
