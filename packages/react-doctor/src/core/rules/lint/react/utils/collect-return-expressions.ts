import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

const containsReturn = (node: EsTreeNode): boolean => {
  if (isNodeOfType(node, "ReturnStatement")) return true;
  if (
    isNodeOfType(node, "FunctionDeclaration") ||
    isNodeOfType(node, "FunctionExpression") ||
    isNodeOfType(node, "ArrowFunctionExpression")
  ) {
    return false;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item?.type && containsReturn(item)) return true;
      }
    } else if (child?.type && containsReturn(child)) {
      return true;
    }
  }
  return false;
};

const collectReturnsAndGuards = (node: EsTreeNode, returns: EsTreeNode[]): void => {
  if (!node || typeof node !== "object") return;
  if (
    isNodeOfType(node, "FunctionDeclaration") ||
    isNodeOfType(node, "FunctionExpression") ||
    isNodeOfType(node, "ArrowFunctionExpression")
  ) {
    return;
  }
  if (isNodeOfType(node, "ReturnStatement") && node.argument) {
    returns.push(node.argument);
    return;
  }
  if (isNodeOfType(node, "IfStatement") && node.test && containsReturn(node)) {
    returns.push(node.test);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item?.type) collectReturnsAndGuards(item, returns);
      }
    } else if (child?.type) {
      collectReturnsAndGuards(child, returns);
    }
  }
};

export const collectReturnExpressions = (componentBody: EsTreeNode): EsTreeNode[] => {
  if (!isNodeOfType(componentBody, "BlockStatement")) return [];
  const returns: EsTreeNode[] = [];
  for (const statement of componentBody.body ?? []) {
    if (isNodeOfType(statement, "ReturnStatement") && statement.argument) {
      returns.push(statement.argument);
      continue;
    }
    collectReturnsAndGuards(statement, returns);
  }
  return returns;
};
