import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const containsEarlyReturn = (ifStatement: EsTreeNode): boolean => {
  const consequent = ifStatement.consequent;
  if (!consequent) return false;
  if (isNodeOfType(consequent, "ReturnStatement")) return true;
  if (!isNodeOfType(consequent, "BlockStatement")) return false;
  for (const stmt of consequent.body ?? []) {
    if (isNodeOfType(stmt, "ReturnStatement")) return true;
  }
  return false;
};
