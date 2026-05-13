import type { EsTreeNode } from "../../utils/index.js";
import { ELLIPSIS_EXCLUDED_TAG_NAMES } from "../../constants.js";
import { findJsxAttribute } from "../../utils/index.js";
import { getOpeningElementTagName } from "./get-opening-element-tag-name.js";
import { isNodeOfType } from "../../utils/index.js";

export const isInsideExcludedAncestor = (jsxTextNode: EsTreeNode): boolean => {
  let cursor = jsxTextNode.parent;
  while (cursor) {
    if (isNodeOfType(cursor, "JSXElement")) {
      const tagName = getOpeningElementTagName(cursor.openingElement);
      if (tagName && ELLIPSIS_EXCLUDED_TAG_NAMES.has(tagName.toLowerCase())) return true;
      const translateAttribute = findJsxAttribute(
        cursor.openingElement?.attributes ?? [],
        "translate",
      );
      if (
        isNodeOfType(translateAttribute?.value, "Literal") &&
        translateAttribute.value.value === "no"
      ) {
        return true;
      }
    }
    cursor = cursor.parent;
  }
  return false;
};
