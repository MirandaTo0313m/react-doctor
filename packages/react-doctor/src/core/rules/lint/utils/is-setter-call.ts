import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";
import { isSetterIdentifier } from "./is-setter-identifier.js";

export const isSetterCall = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "Identifier") &&
  isSetterIdentifier(node.callee.name);
