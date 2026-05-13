import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const collectJsxLabelText = (jsxElementNode: EsTreeNode): string | null => {
  const childList = jsxElementNode.children ?? [];
  if (childList.length === 0) return null;
  const collectedFragments: string[] = [];
  for (const childNode of childList) {
    if (isNodeOfType(childNode, "JSXText")) {
      collectedFragments.push(typeof childNode.value === "string" ? childNode.value : "");
      continue;
    }
    if (isNodeOfType(childNode, "JSXExpressionContainer")) {
      const expression = childNode.expression;
      if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
        collectedFragments.push(expression.value);
        continue;
      }
      if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1) {
        const rawTemplate = expression.quasis[0].value?.raw;
        if (typeof rawTemplate === "string" && expression.expressions.length === 0) {
          collectedFragments.push(rawTemplate);
          continue;
        }
      }
      // Bail on dynamic content (interpolation, identifiers).
      return null;
    }
    if (isNodeOfType(childNode, "JSXFragment")) {
      // Recurse into <>…</> fragments - they're transparent for label purposes.
      const fragmentLabel = collectJsxLabelText(childNode);
      if (fragmentLabel === null) return null;
      collectedFragments.push(fragmentLabel);
      continue;
    }
    if (isNodeOfType(childNode, "JSXElement")) {
      // Bail on nested elements (icons, spans) - the leading/trailing text alone isn't the full label.
      return null;
    }
  }
  return collectedFragments.join("").trim();
};
