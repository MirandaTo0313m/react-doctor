import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: React Native v7+ supports the standard CSS `boxShadow` string
// (`"0 2px 8px rgba(0,0,0,0.1)"`) which renders identically on iOS and
// Android. The legacy `shadowColor`/`shadowOffset`/`shadowOpacity`/
// `shadowRadius` keys only work on iOS, and `elevation` is Android-only,
// so cross-platform code historically had to declare both - `boxShadow`
// collapses that into one key.

// HACK: <FlashList recycleItems> (or LegendList) reuses row component
// instances across rows. For HETEROGENEOUS lists (rows of different
// types - section headers, message bubbles, separators), recycling
// without `getItemType` causes wrong-type rows to mount into the
// recycled cells and produces flickers / measurement errors. The fix
// is to provide `getItemType={item => item.kind}` (or similar) so
// FlashList keeps separate recycle pools per type.
//
// Heuristic: <FlashList recycleItems> AND `<FlashList renderItem={...}>`
// where the renderItem return type is varied (multiple JSX element
// names returned via conditional / branching). We approximate by
// flagging any FlashList/LegendList with `recycleItems` and no
// `getItemType` - the user can add `getItemType` if they have one
// item type, in which case the rule is silent.

export const findReturnedObject = (callback: EsTreeNode): EsTreeNode | null => {
  if (
    !isNodeOfType(callback, "ArrowFunctionExpression") &&
    !isNodeOfType(callback, "FunctionExpression")
  ) {
    return null;
  }
  const body = callback.body;
  if (isNodeOfType(body, "ObjectExpression")) return body;
  if (!isNodeOfType(body, "BlockStatement")) return null;
  for (const stmt of body.body ?? []) {
    if (isNodeOfType(stmt, "ReturnStatement") && isNodeOfType(stmt.argument, "ObjectExpression")) {
      return stmt.argument;
    }
  }
  return null;
};
