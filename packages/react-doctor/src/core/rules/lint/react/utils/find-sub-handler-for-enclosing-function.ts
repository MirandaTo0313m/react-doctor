import type { EsTreeNode } from "../../utils/index.js";
import { getEnclosingFunctionBindingName } from "./get-enclosing-function-binding-name.js";
import { isCallExpressionWithSubHandlerCallee } from "./is-call-expression-with-sub-handler-callee.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const findSubHandlerForEnclosingFunction = (
  enclosingFunction: EsTreeNode,
  effectCallback: EsTreeNode,
): EsTreeNode | null => {
  const directParent = enclosingFunction.parent;
  if (
    isNodeOfType(directParent, "CallExpression") &&
    directParent.arguments?.includes(enclosingFunction) &&
    isCallExpressionWithSubHandlerCallee(directParent)
  ) {
    return directParent;
  }

  const localName = getEnclosingFunctionBindingName(enclosingFunction);
  if (localName === null) return null;

  let matchingSubHandlerCall: EsTreeNode | null = null;
  walkAst(effectCallback, (child: EsTreeNode) => {
    if (matchingSubHandlerCall) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    if (!isCallExpressionWithSubHandlerCallee(child)) return;
    for (const argument of child.arguments ?? []) {
      if (isNodeOfType(argument, "Identifier") && argument.name === localName) {
        matchingSubHandlerCall = child;
        return false;
      }
    }
  });
  return matchingSubHandlerCall;
};
