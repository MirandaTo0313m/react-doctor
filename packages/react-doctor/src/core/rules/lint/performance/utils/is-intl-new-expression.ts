import type { EsTreeNode } from "../../utils/index.js";
import { INTL_CLASSES } from "./intl-classes.js";
import { isNodeOfType } from "../../utils/index.js";

export const isIntlNewExpression = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "NewExpression")) return false;
  const callee = node.callee;
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.object, "Identifier") &&
    callee.object.name === "Intl" &&
    isNodeOfType(callee.property, "Identifier") &&
    INTL_CLASSES.has(callee.property.name)
  ) {
    return true;
  }
  return false;
};
