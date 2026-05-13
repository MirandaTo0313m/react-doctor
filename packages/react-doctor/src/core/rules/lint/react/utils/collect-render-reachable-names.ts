import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// Single source of truth for "does this CallExpression release a
// previously-acquired effect resource?". Used by both
// `effectNeedsCleanup` and `prefer-use-sync-external-store` so the
// two rules can never disagree on what a cleanup looks like.

export const collectRenderReachableNames = (returnExpressions: EsTreeNode[]): Set<string> => {
  const names = new Set<string>();
  for (const expression of returnExpressions) {
    walkAst(expression, (child: EsTreeNode) => {
      if (isNodeOfType(child, "Identifier")) names.add(child.name);
    });
  }
  return names;
};
