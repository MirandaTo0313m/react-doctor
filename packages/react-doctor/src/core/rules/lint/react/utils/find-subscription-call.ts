import type { EsTreeNode } from "../../utils/index.js";
import { SUBSCRIPTION_METHOD_NAMES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

export const findSubscriptionCall = (
  effectBodyStatements: EsTreeNode[],
): { call: EsTreeNode; boundUnsubscribeName: string | null } | null => {
  for (const statement of effectBodyStatements) {
    if (isNodeOfType(statement, "VariableDeclaration")) {
      for (const declarator of statement.declarations ?? []) {
        const init = declarator.init;
        if (!isNodeOfType(init, "CallExpression")) continue;
        if (!isNodeOfType(init.callee, "MemberExpression")) continue;
        if (!isNodeOfType(init.callee.property, "Identifier")) continue;
        if (!SUBSCRIPTION_METHOD_NAMES.has(init.callee.property.name)) continue;
        const boundUnsubscribeName = isNodeOfType(declarator.id, "Identifier")
          ? declarator.id.name
          : null;
        return { call: init, boundUnsubscribeName };
      }
    }
    if (isNodeOfType(statement, "ExpressionStatement")) {
      const expression = statement.expression;
      if (!isNodeOfType(expression, "CallExpression")) continue;
      if (!isNodeOfType(expression.callee, "MemberExpression")) continue;
      if (!isNodeOfType(expression.callee.property, "Identifier")) continue;
      if (!SUBSCRIPTION_METHOD_NAMES.has(expression.callee.property.name)) continue;
      return { call: expression, boundUnsubscribeName: null };
    }
  }
  return null;
};
