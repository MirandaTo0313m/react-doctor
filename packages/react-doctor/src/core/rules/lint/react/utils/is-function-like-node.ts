import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isFunctionLikeNode = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "FunctionDeclaration") ||
  isNodeOfType(node, "FunctionExpression") ||
  isNodeOfType(node, "ArrowFunctionExpression");
