import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";
import { isUppercaseName } from "./is-uppercase-name.js";

export const isComponentDeclaration = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "FunctionDeclaration") &&
  Boolean(node.id?.name) &&
  isUppercaseName(node.id.name);
