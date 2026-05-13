import type { EsTreeNode } from "../../utils/index.js";
import { LIST_ROW_PRESS_HANDLER_PROPS } from "./list-row-press-handler-props.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: virtualized lists key off referential equality of `data`. Passing
// `data={items.map(...)}` allocates a fresh array on every parent render,
// which forces the list to re-key every row and bust its memo cache,
// destroying scroll perf. Hoist the transform into a useMemo at list
// scope or do the projection earlier in the parent.

// HACK: useAnimatedReaction with a body that does nothing but assign to
// another shared value (`sv2.value = current`) is essentially what
// useDerivedValue is for. useDerivedValue is shorter, opts into the
// proper Reanimated dependency tracking, and avoids the side-effect
// gloss that useAnimatedReaction implies (it's meant for cross-thread
// reactions like calling runOnJS, not value derivation).

export const detectInlineRowHandlers = (renderItemFn: EsTreeNode): EsTreeNode[] => {
  const inlineHandlers: EsTreeNode[] = [];
  walkAst(renderItemFn.body, (child: EsTreeNode) => {
    if (!isNodeOfType(child, "JSXAttribute")) return;
    if (!isNodeOfType(child.name, "JSXIdentifier")) return;
    if (!LIST_ROW_PRESS_HANDLER_PROPS.has(child.name.name)) return;
    if (!isNodeOfType(child.value, "JSXExpressionContainer")) return;
    const expression = child.value.expression;
    if (
      isNodeOfType(expression, "ArrowFunctionExpression") ||
      isNodeOfType(expression, "FunctionExpression")
    ) {
      inlineHandlers.push(child);
    }
  });
  return inlineHandlers;
};
