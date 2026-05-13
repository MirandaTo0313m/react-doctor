import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getSubHandlerCalleeName = (callExpression: EsTreeNode): string | null => {
  if (!isNodeOfType(callExpression, "CallExpression")) return null;
  const callee = callExpression.callee;
  if (isNodeOfType(callee, "Identifier")) return callee.name;
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
    return callee.property.name;
  }
  return null;
};
