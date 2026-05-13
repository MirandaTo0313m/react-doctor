import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: `const x = await something(); if (skip) return defaultValue;` -
// the early-return doesn't depend on the awaited value, so the await
// blocked the function for nothing on the skip path. Move the await
// after the cheap synchronous guard so we only pay the latency when we
// actually need the data.
//
// Heuristic: an awaited VariableDeclaration immediately followed by an
// IfStatement whose test references no identifiers from the awaited
// declaration. We require the if to be the very next statement to
// stay precise (intervening statements would imply the awaited binding
// is being prepared for use).

export const isInlineReference = (node: EsTreeNode): string | null => {
  if (
    isNodeOfType(node, "ArrowFunctionExpression") ||
    isNodeOfType(node, "FunctionExpression") ||
    (isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      node.callee.property?.name === "bind")
  )
    return "functions";

  if (isNodeOfType(node, "ObjectExpression")) return "objects";
  if (isNodeOfType(node, "ArrayExpression")) return "Arrays";
  if (isNodeOfType(node, "JSXElement") || isNodeOfType(node, "JSXFragment")) return "JSX";

  return null;
};
