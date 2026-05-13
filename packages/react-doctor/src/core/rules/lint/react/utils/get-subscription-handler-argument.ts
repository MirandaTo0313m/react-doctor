import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getSubscriptionHandlerArgument = (
  subscribeCall: EsTreeNode,
  effectBodyStatements: EsTreeNode[],
): EsTreeNode | null => {
  for (const argument of subscribeCall.arguments ?? []) {
    if (
      isNodeOfType(argument, "ArrowFunctionExpression") ||
      isNodeOfType(argument, "FunctionExpression")
    ) {
      return argument;
    }
    if (isNodeOfType(argument, "Identifier")) {
      for (const statement of effectBodyStatements) {
        if (!isNodeOfType(statement, "VariableDeclaration")) continue;
        for (const declarator of statement.declarations ?? []) {
          if (!isNodeOfType(declarator.id, "Identifier")) continue;
          if (declarator.id.name !== argument.name) continue;
          const init = declarator.init;
          if (
            isNodeOfType(init, "ArrowFunctionExpression") ||
            isNodeOfType(init, "FunctionExpression")
          ) {
            return init;
          }
        }
      }
    }
  }
  return null;
};
