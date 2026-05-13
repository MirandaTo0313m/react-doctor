import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const resolveJsxElementName = (openingElement: EsTreeNode): string | null => {
  const elementName = openingElement?.name;
  if (!elementName) return null;
  if (isNodeOfType(elementName, "JSXIdentifier")) return elementName.name;
  if (isNodeOfType(elementName, "JSXMemberExpression")) return elementName.property?.name ?? null;
  return null;
};
