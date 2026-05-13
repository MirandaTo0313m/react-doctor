import type { EsTreeNode } from "../../utils/index.js";
import { EVENT_TRIGGERED_NAVIGATION_METHOD_NAMES } from "../../constants.js";
import { EVENT_TRIGGERED_SIDE_EFFECT_CALLEES } from "../../constants.js";
import { EVENT_TRIGGERED_SIDE_EFFECT_MEMBER_METHODS } from "../../constants.js";
import { NAVIGATION_RECEIVER_NAMES } from "../../constants.js";
import { getRootIdentifierName } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const findTriggeredSideEffectCalleeName = (consequentNode: EsTreeNode): string | null => {
  let foundCalleeName: string | null = null;
  walkAst(consequentNode, (child: EsTreeNode) => {
    if (foundCalleeName) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    const callee = child.callee;
    if (
      isNodeOfType(callee, "Identifier") &&
      EVENT_TRIGGERED_SIDE_EFFECT_CALLEES.has(callee.name)
    ) {
      foundCalleeName = callee.name;
      return;
    }
    if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
      const propertyName = callee.property.name;
      const isUnambiguousMethod = EVENT_TRIGGERED_SIDE_EFFECT_MEMBER_METHODS.has(propertyName);
      const isNavigationMethod = EVENT_TRIGGERED_NAVIGATION_METHOD_NAMES.has(propertyName);
      if (!isUnambiguousMethod && !isNavigationMethod) return;
      const rootName = getRootIdentifierName(callee);
      if (isNavigationMethod && (rootName === null || !NAVIGATION_RECEIVER_NAMES.has(rootName))) {
        return;
      }
      foundCalleeName = rootName ? `${rootName}.${propertyName}` : propertyName;
    }
  });
  return foundCalleeName;
};
