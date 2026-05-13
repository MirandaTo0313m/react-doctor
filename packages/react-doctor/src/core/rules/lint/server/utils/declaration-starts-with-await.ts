import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const declarationStartsWithAwait = (declaration: EsTreeNode): boolean => {
  for (const declarator of declaration.declarations ?? []) {
    if (isNodeOfType(declarator.init, "AwaitExpression")) return true;
  }
  return false;
};
