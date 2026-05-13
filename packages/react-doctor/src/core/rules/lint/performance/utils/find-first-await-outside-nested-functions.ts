import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: detect repeated deep `obj.a.b.c` reads inside the same loop -
// JS engines can sometimes optimize, but reads through proxies, getters,
// or hot user-code paths often benefit from caching the access in a const
// at the top of the loop body. We require a member-expression depth ≥ 2
// (two dots) and ≥ 3 occurrences in the same loop block to fire.

// HACK: when comparing two arrays element-by-element via .every / .some /
// .reduce against another array, a length mismatch is the cheapest possible
// shortcut. e.g. `a.length === b.length && a.every((x, i) => x === b[i])`
// runs the every-loop only when lengths match.

// HACK: `new Intl.NumberFormat()` / `Intl.DateTimeFormat()` is expensive
// (dozens of allocations per locale lookup). Allocating it inside a render
// function or hot loop tanks scroll/list perf. Hoist to module scope or
// wrap in useMemo.

export const findFirstAwaitOutsideNestedFunctions = (block: EsTreeNode): EsTreeNode | null => {
  let firstAwait: EsTreeNode | null = null;
  walkAst(block, (child: EsTreeNode): boolean | void => {
    if (firstAwait) return false;
    if (
      child !== block &&
      (isNodeOfType(child, "FunctionDeclaration") ||
        isNodeOfType(child, "FunctionExpression") ||
        isNodeOfType(child, "ArrowFunctionExpression"))
    ) {
      // Don't descend into nested functions - their `await`s belong to
      // their own async parent, not this loop. (`child !== block` so we
      // still walk the body of the loop callback itself when called with
      // the callback's body.)
      return false;
    }
    if (isNodeOfType(child, "AwaitExpression")) {
      firstAwait = child;
    }
  });
  return firstAwait;
};
