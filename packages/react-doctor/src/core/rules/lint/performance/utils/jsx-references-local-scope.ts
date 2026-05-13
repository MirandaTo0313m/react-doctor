import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const jsxReferencesLocalScope = (jsxNode: EsTreeNode): boolean => {
  let referencesScope = false;
  walkAst(jsxNode, (child: EsTreeNode) => {
    if (referencesScope) return;
    if (
      isNodeOfType(child, "JSXExpressionContainer") &&
      !isNodeOfType(child.expression, "JSXEmptyExpression")
    ) {
      referencesScope = true;
    }
    if (isNodeOfType(child, "JSXSpreadAttribute")) {
      referencesScope = true;
    }
  });
  return referencesScope;
};
