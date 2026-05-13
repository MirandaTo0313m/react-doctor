import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

const isJsxComment = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "JSXExpressionContainer") &&
  isNodeOfType(node.expression, "JSXEmptyExpression");

export const getMeaningfulJsxChildren = (node: EsTreeNode): EsTreeNode[] =>
  (node.children ?? []).filter((child: EsTreeNode) => {
    if (isNodeOfType(child, "JSXText")) return child.value.trim().length > 0;
    if (isJsxComment(child)) return false;
    return true;
  });
