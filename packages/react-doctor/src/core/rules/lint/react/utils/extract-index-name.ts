import type { EsTreeNode } from "../../utils/index.js";
import { INDEX_PARAMETER_NAMES } from "../../constants.js";
import { STRING_COERCION_FUNCTIONS } from "./string-coercion-functions.js";
import { isNodeOfType } from "../../utils/index.js";

export const extractIndexName = (node: EsTreeNode): string | null => {
  if (isNodeOfType(node, "Identifier") && INDEX_PARAMETER_NAMES.has(node.name)) return node.name;

  if (isNodeOfType(node, "TemplateLiteral")) {
    const indexExpression = node.expressions?.find(
      (expression: EsTreeNode) =>
        isNodeOfType(expression, "Identifier") && INDEX_PARAMETER_NAMES.has(expression.name),
    );
    if (indexExpression) return indexExpression.name;
  }

  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.object, "Identifier") &&
    INDEX_PARAMETER_NAMES.has(node.callee.object.name) &&
    isNodeOfType(node.callee.property, "Identifier") &&
    node.callee.property.name === "toString"
  )
    return node.callee.object.name;

  if (
    isNodeOfType(node, "CallExpression") &&
    isNodeOfType(node.callee, "Identifier") &&
    STRING_COERCION_FUNCTIONS.has(node.callee.name) &&
    isNodeOfType(node.arguments?.[0], "Identifier") &&
    INDEX_PARAMETER_NAMES.has(node.arguments[0].name)
  )
    return node.arguments[0].name;

  if (
    isNodeOfType(node, "BinaryExpression") &&
    node.operator === "+" &&
    ((isNodeOfType(node.left, "Identifier") &&
      INDEX_PARAMETER_NAMES.has(node.left.name) &&
      isNodeOfType(node.right, "Literal") &&
      node.right.value === "") ||
      (isNodeOfType(node.right, "Identifier") &&
        INDEX_PARAMETER_NAMES.has(node.right.name) &&
        isNodeOfType(node.left, "Literal") &&
        node.left.value === ""))
  ) {
    return isNodeOfType(node.left, "Identifier") ? node.left.name : node.right.name;
  }

  return null;
};
