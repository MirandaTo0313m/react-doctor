import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const handlerCallsSetState = (handler: EsTreeNode): EsTreeNode | null => {
  if (
    !isNodeOfType(handler, "ArrowFunctionExpression") &&
    !isNodeOfType(handler, "FunctionExpression")
  ) {
    return null;
  }
  let setStateCall: EsTreeNode | null = null;
  walkAst(handler.body, (child: EsTreeNode) => {
    if (setStateCall) return;
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "Identifier") &&
      /^set[A-Z]/.test(child.callee.name)
    ) {
      setStateCall = child;
    }
  });
  return setStateCall;
};
