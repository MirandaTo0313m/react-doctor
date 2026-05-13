import type { EsTreeNode } from "../../utils/index.js";
import { getCallbackStatements } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSetterIdentifier } from "../../utils/index.js";

export const getSingleSetterCallFromHandler = (
  handler: EsTreeNode,
): { setterName: string; setterArgument: EsTreeNode } | null => {
  const handlerStatements = getCallbackStatements(handler);
  if (handlerStatements.length !== 1) return null;
  const onlyStatement = handlerStatements[0];
  const expression = isNodeOfType(onlyStatement, "ExpressionStatement")
    ? onlyStatement.expression
    : onlyStatement;
  if (!isNodeOfType(expression, "CallExpression")) return null;
  if (!isNodeOfType(expression.callee, "Identifier")) return null;
  if (!isSetterIdentifier(expression.callee.name)) return null;
  if (!expression.arguments?.length) return null;
  return {
    setterName: expression.callee.name,
    setterArgument: expression.arguments[0],
  };
};
