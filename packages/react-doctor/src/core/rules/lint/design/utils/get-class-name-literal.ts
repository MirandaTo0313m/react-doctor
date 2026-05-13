import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getClassNameLiteral = (classAttribute: EsTreeNode): string | null => {
  if (!classAttribute.value) return null;
  if (
    isNodeOfType(classAttribute.value, "Literal") &&
    typeof classAttribute.value.value === "string"
  ) {
    return classAttribute.value.value;
  }
  if (isNodeOfType(classAttribute.value, "JSXExpressionContainer")) {
    const expression = classAttribute.value.expression;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
      return expression.value;
    }
    if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1) {
      return expression.quasis[0].value?.raw ?? null;
    }
  }
  return null;
};
