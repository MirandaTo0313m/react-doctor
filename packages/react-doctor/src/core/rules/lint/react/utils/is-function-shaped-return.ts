import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isFunctionShapedReturn = (returnedValue: EsTreeNode): boolean => {
  if (
    isNodeOfType(returnedValue, "ArrowFunctionExpression") ||
    isNodeOfType(returnedValue, "FunctionExpression")
  ) {
    return true;
  }
  // Returning a CallExpression result - most cleanup-returning
  // primitives (subscribe, addEventListener helpers) return a
  // function. Conservatively accept this shape.
  if (isNodeOfType(returnedValue, "CallExpression")) return true;
  // Returning a bare Identifier - could be the unsub binding from a
  // `const unsub = subscribe(...)` line. We can't statically prove
  // it's function-typed without scope analysis, but in idiomatic React
  // this is the dominant cleanup pattern. Accept.
  if (isNodeOfType(returnedValue, "Identifier")) return true;
  return false;
};
