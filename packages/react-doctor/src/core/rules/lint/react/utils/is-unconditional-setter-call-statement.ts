import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isUnconditionalSetterCallStatement = (
  statement: EsTreeNode,
  setterNames: ReadonlySet<string>,
): EsTreeNode | null => {
  if (!isNodeOfType(statement, "ExpressionStatement")) return null;
  const expression = statement.expression;
  if (!isNodeOfType(expression, "CallExpression")) return null;
  const callee = expression.callee;
  if (!isNodeOfType(callee, "Identifier")) return null;
  if (!setterNames.has(callee.name)) return null;
  return expression;
};
