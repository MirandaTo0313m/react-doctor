import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const hasJsxSpreadAttribute = (attributes: EsTreeNode[]): boolean =>
  attributes.some((attribute) => isNodeOfType(attribute, "JSXSpreadAttribute"));
