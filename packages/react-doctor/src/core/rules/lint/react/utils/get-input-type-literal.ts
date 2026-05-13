import type { EsTreeNode } from "../../utils/index.js";
import { findJsxAttribute } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getInputTypeLiteral = (attributes: EsTreeNode[]): string | null => {
  const typeAttribute = findJsxAttribute(attributes, "type");
  if (!typeAttribute || !isNodeOfType(typeAttribute.value, "Literal")) return null;
  const value = typeAttribute.value.value;
  return typeof value === "string" ? value : null;
};
