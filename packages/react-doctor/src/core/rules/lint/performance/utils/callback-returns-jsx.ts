import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const callbackReturnsJsx = (callback: EsTreeNode | undefined): boolean => {
  if (!callback) return false;
  if (
    !isNodeOfType(callback, "ArrowFunctionExpression") &&
    !isNodeOfType(callback, "FunctionExpression")
  ) {
    return false;
  }
  const body = callback.body;
  if (isNodeOfType(body, "JSXElement") || isNodeOfType(body, "JSXFragment")) return true;
  if (!isNodeOfType(body, "BlockStatement")) return false;
  for (const stmt of body.body ?? []) {
    if (
      isNodeOfType(stmt, "ReturnStatement") &&
      (isNodeOfType(stmt.argument, "JSXElement") || isNodeOfType(stmt.argument, "JSXFragment"))
    ) {
      return true;
    }
  }
  return false;
};
