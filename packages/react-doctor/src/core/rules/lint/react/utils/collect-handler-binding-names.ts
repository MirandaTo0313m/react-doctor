import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const collectHandlerBindingNames = (componentBody: EsTreeNode): Set<string> => {
  const handlerNames = new Set<string>();
  walkAst(componentBody, (child: EsTreeNode) => {
    if (!isNodeOfType(child, "JSXAttribute")) return;
    if (!isNodeOfType(child.name, "JSXIdentifier")) return;
    if (!/^on[A-Z]/.test(child.name.name)) return;
    if (!isNodeOfType(child.value, "JSXExpressionContainer")) return;
    const expression = child.value.expression;
    if (isNodeOfType(expression, "Identifier")) handlerNames.add(expression.name);
  });
  return handlerNames;
};
