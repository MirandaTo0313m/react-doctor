import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSentinelIdentifier } from "./is-sentinel-identifier.js";

export const getTriggerGuardRootName = (testNode: EsTreeNode): string | null => {
  if (!testNode) return null;
  if (isNodeOfType(testNode, "Identifier")) return testNode.name;
  if (isNodeOfType(testNode, "BinaryExpression")) {
    if (!["!==", "===", "!=", "=="].includes(testNode.operator)) return null;
    for (const side of [testNode.left, testNode.right]) {
      if (isNodeOfType(side, "Identifier") && !isSentinelIdentifier(side)) {
        return side.name;
      }
    }
    return null;
  }
  if (
    isNodeOfType(testNode, "MemberExpression") &&
    isNodeOfType(testNode.property, "Identifier") &&
    testNode.property.name === "length"
  ) {
    if (isNodeOfType(testNode.object, "Identifier")) return testNode.object.name;
  }
  if (isNodeOfType(testNode, "UnaryExpression") && testNode.operator === "!") {
    return getTriggerGuardRootName(testNode.argument);
  }
  return null;
};
