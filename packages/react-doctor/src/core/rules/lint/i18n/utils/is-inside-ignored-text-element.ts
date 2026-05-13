import type { EsTreeNode } from "../../utils/index.js";
import { NON_USER_TEXT_ELEMENTS } from "./non-user-text-elements.js";
import { TRANSLATION_COMPONENT_NAMES } from "./translation-component-names.js";
import { getJsxName, isNodeOfType } from "../../utils/index.js";

export const isInsideIgnoredTextElement = (node: EsTreeNode): boolean => {
  let currentNode = node.parent;
  while (currentNode) {
    if (isNodeOfType(currentNode, "JSXElement")) {
      const elementName = getJsxName(currentNode.openingElement?.name);
      if (elementName && TRANSLATION_COMPONENT_NAMES.has(elementName)) return true;
      if (elementName && NON_USER_TEXT_ELEMENTS.has(elementName)) return true;
    }
    currentNode = currentNode.parent;
  }
  return false;
};
