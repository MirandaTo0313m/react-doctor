import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isUseFrameCall = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "Identifier") &&
  node.callee.name === "useFrame";
