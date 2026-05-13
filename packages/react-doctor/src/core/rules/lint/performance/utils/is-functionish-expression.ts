import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: `for (const x of items) { await fetch(x); }` runs the fetches
// sequentially - each one waits for the previous to finish before
// starting. If the calls are independent (which they almost always are
// in a list-iteration loop), the total latency is N × per-call latency
// instead of just per-call. `await Promise.all(items.map(fetch))` runs
// them all concurrently. We flag any `await` inside `for…of`,
// `for…in`, classic `for`, `while`, or `.forEach`/`.map` callback
// bodies where `await` appears at the top level of the loop body.
//
// Notable exceptions we INTENTIONALLY do not exempt:
//  - `for await (const x of asyncIterable)` - that's a different
//    AST node (ForOfStatement with `await: true`); we skip those.
//  - Loops where the next iteration depends on the previous result
//    (e.g. paginated fetch). The plugin can't tell - accept some
//    false positives in exchange for catching the common waterfall.

export const isFunctionishExpression = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "ArrowFunctionExpression") || isNodeOfType(node, "FunctionExpression");
