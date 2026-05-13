import type { EsTreeNode } from "../../utils/index.js";
import { getMemberPropertyName, isNodeOfType } from "../../utils/index.js";

export const isUserEventCall = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  node.callee.object.name === "userEvent" &&
  Boolean(getMemberPropertyName(node.callee));
