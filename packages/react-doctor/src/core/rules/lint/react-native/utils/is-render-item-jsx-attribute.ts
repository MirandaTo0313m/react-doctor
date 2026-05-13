import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isRenderItemJsxAttribute = (parent: EsTreeNode | null | undefined): boolean => {
  if (!isNodeOfType(parent, "JSXAttribute")) return false;
  const attrName = isNodeOfType(parent.name, "JSXIdentifier") ? parent.name.name : null;
  return attrName === "renderItem";
};
