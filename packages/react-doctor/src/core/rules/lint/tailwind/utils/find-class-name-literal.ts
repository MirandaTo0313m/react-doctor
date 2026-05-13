import type { EsTreeNode } from "../../utils/index.js";
import type { TailwindClassNameLiteral } from "./tailwind-class-name-literal.js";
import { findJsxAttribute } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const findClassNameLiteral = (
  openingElement: EsTreeNode,
): TailwindClassNameLiteral | null => {
  const classNameAttribute = findJsxAttribute(openingElement.attributes ?? [], "className");
  if (!classNameAttribute?.value) return null;
  if (
    isNodeOfType(classNameAttribute.value, "Literal") &&
    typeof classNameAttribute.value.value === "string"
  ) {
    return { attribute: classNameAttribute, value: classNameAttribute.value.value };
  }
  if (!isNodeOfType(classNameAttribute.value, "JSXExpressionContainer")) return null;
  const expression = classNameAttribute.value.expression;
  if (isNodeOfType(expression, "Literal") && typeof expression.value === "string")
    return { attribute: classNameAttribute, value: expression.value };
  if (isNodeOfType(expression, "TemplateLiteral") && expression.quasis?.length === 1) {
    const value = expression.quasis[0].value?.raw;
    return value ? { attribute: classNameAttribute, value } : null;
  }
  return null;
};
