import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isMotionElement = (attributeNode: EsTreeNode): boolean => {
  const openingElement = attributeNode.parent;
  if (!openingElement || !isNodeOfType(openingElement, "JSXOpeningElement")) return false;

  const elementName = openingElement.name;
  if (
    isNodeOfType(elementName, "JSXMemberExpression") &&
    isNodeOfType(elementName.object, "JSXIdentifier") &&
    (elementName.object.name === "motion" || elementName.object.name === "m")
  )
    return true;

  if (isNodeOfType(elementName, "JSXIdentifier") && elementName.name.startsWith("Motion"))
    return true;

  return false;
};
