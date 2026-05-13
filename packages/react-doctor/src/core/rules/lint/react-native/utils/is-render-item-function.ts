import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isRenderItemJsxAttribute } from "./is-render-item-jsx-attribute.js";

export const isRenderItemFunction = (node: EsTreeNode): boolean => {
  const parent = node.parent;
  if (!isNodeOfType(parent, "JSXExpressionContainer")) return false;
  return isRenderItemJsxAttribute(parent.parent);
};
