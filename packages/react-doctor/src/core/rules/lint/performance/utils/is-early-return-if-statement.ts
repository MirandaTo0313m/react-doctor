import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isEarlyReturnIfStatement = (statement: EsTreeNode): boolean => {
  if (!isNodeOfType(statement, "IfStatement")) return false;
  const consequent = statement.consequent;
  if (!consequent) return false;
  if (isNodeOfType(consequent, "ReturnStatement")) return true;
  if (!isNodeOfType(consequent, "BlockStatement")) return false;
  for (const inner of consequent.body ?? []) {
    if (isNodeOfType(inner, "ReturnStatement")) return true;
  }
  return false;
};
