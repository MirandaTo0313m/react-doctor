import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const handlerMutatesIdentifier = (
  handler: EsTreeNode,
  sharedValueBindings: Set<string>,
): boolean => {
  if (
    !isNodeOfType(handler, "ArrowFunctionExpression") &&
    !isNodeOfType(handler, "FunctionExpression")
  ) {
    return false;
  }
  if (sharedValueBindings.size === 0) return false;
  let didMutate = false;
  walkAst(handler.body, (child: EsTreeNode) => {
    if (didMutate) return;
    if (
      isNodeOfType(child, "AssignmentExpression") &&
      isNodeOfType(child.left, "MemberExpression") &&
      isNodeOfType(child.left.object, "Identifier") &&
      sharedValueBindings.has(child.left.object.name) &&
      isNodeOfType(child.left.property, "Identifier") &&
      child.left.property.name === "value"
    ) {
      didMutate = true;
    }
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      sharedValueBindings.has(child.callee.object.name) &&
      isNodeOfType(child.callee.property, "Identifier") &&
      (child.callee.property.name === "set" || child.callee.property.name === "value")
    ) {
      didMutate = true;
    }
  });
  return didMutate;
};
