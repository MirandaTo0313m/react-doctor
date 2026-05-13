import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const hasTopLevelAwait = (statement: EsTreeNode): boolean => {
  if (isNodeOfType(statement, "VariableDeclaration")) {
    return statement.declarations?.some((declarator: EsTreeNode) =>
      isNodeOfType(declarator.init, "AwaitExpression"),
    );
  }
  if (isNodeOfType(statement, "ExpressionStatement")) {
    return (
      isNodeOfType(statement.expression, "AwaitExpression") ||
      (isNodeOfType(statement.expression, "AssignmentExpression") &&
        isNodeOfType(statement.expression.right, "AwaitExpression"))
    );
  }
  if (isNodeOfType(statement, "ReturnStatement")) {
    return isNodeOfType(statement.argument, "AwaitExpression");
  }
  if (isNodeOfType(statement, "ForOfStatement") && statement.await) {
    return true;
  }
  return false;
};
