import type { EsTreeNode } from "../../utils/index.js";
import { SUBSCRIPTION_METHOD_NAMES } from "../../constants.js";
import { TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

export const isCallExpressionWithSubHandlerCallee = (callExpression: EsTreeNode): boolean => {
  if (!isNodeOfType(callExpression, "CallExpression")) return false;
  const callee = callExpression.callee;
  if (
    isNodeOfType(callee, "Identifier") &&
    TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES.has(callee.name)
  ) {
    return true;
  }
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.property, "Identifier") &&
    SUBSCRIPTION_METHOD_NAMES.has(callee.property.name)
  ) {
    return true;
  }
  return false;
};
