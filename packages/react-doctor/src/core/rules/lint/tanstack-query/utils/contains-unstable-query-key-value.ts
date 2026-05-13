import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const containsUnstableQueryKeyValue = (node: EsTreeNode | undefined): string | null => {
  if (!node) return null;
  let unstableSource: string | null = null;
  walkAst(node, (child) => {
    if (unstableSource) return false;
    if (
      isNodeOfType(child, "FunctionExpression") ||
      isNodeOfType(child, "ArrowFunctionExpression")
    ) {
      unstableSource = "function value";
      return false;
    }
    if (
      isNodeOfType(child, "NewExpression") &&
      isNodeOfType(child.callee, "Identifier") &&
      child.callee.name === "Date"
    ) {
      unstableSource = "new Date()";
      return false;
    }
    if (
      isNodeOfType(child, "CallExpression") &&
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      isNodeOfType(child.callee.property, "Identifier")
    ) {
      const receiverName = child.callee.object.name;
      const methodName = child.callee.property.name;
      if (receiverName === "Date" && methodName === "now") unstableSource = "Date.now()";
      if (receiverName === "Math" && methodName === "random") unstableSource = "Math.random()";
      if (receiverName === "crypto" && methodName === "randomUUID")
        unstableSource = "crypto.randomUUID()";
      if (unstableSource) return false;
    }
  });
  return unstableSource;
};
