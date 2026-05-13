import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isNamespaceCall = (
  node: EsTreeNode,
  namespaceNames: Set<string>,
  importedName: string,
): boolean =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  namespaceNames.has(node.callee.object.name) &&
  isNodeOfType(node.callee.property, "Identifier") &&
  node.callee.property.name === importedName;
