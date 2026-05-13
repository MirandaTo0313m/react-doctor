import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: `useMemo(() => <jsx/>)` followed by an early return wastes the
// memoization - the useMemo callback runs every render even when the
// component bails out (loading, gated, etc.). Better to extract the JSX
// into a memoized child component so the parent's early return
// short-circuits before the child renders.

export const findOpeningElementOfChild = (jsxNode: EsTreeNode): EsTreeNode | null => {
  let cursor: EsTreeNode | null = jsxNode.parent ?? null;
  while (cursor) {
    if (isNodeOfType(cursor, "JSXElement")) return cursor.openingElement;
    if (isNodeOfType(cursor, "JSXFragment")) return null;
    cursor = cursor.parent ?? null;
  }
  return null;
};
