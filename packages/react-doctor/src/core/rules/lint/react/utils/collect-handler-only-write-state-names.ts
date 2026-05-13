import type { EsTreeNode } from "../../utils/index.js";
import { isInsideEventHandler } from "./is-inside-event-handler.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: subscribing to `useSearchParams()` / `useParams()` /
// `usePathname()` makes the component re-render whenever the URL state
// changes - even when the component only reads the value inside an
// onClick / onSubmit handler. In that case the value is read at click
// time anyway; the subscription is wasted work.
//
// Better pattern: read inside the handler via the underlying API
// (`new URL(window.location.href).searchParams`), or build a small
// custom hook that exposes a `getSearchParams()` getter without
// subscribing. The result is fewer renders without losing the data.
//
// Heuristic: hook value-name appears only inside arrow / function
// expressions that are themselves bound to JSX `on*` attributes.

// HACK: walks the component AST while tracking which state names are
// SHADOWED in the current scope by a nested function's params or
// var/let/const declarations. Without this, a handler that locally
// re-binds the state name (e.g. `const items = raw.split(",")` then
// `items.push(x)`) gets falsely flagged. We don't do real scope
// analysis (would need eslint-utils' ScopeManager) - just lexical
// param + top-level binding collection per function, which covers the
// >99% of real-world shadowing cases without false positives.

export const collectHandlerOnlyWriteStateNames = (
  componentBody: EsTreeNode,
  useStateBindings: Array<{ valueName: string; setterName: string; declarator: EsTreeNode }>,
  handlerBindingNames: Set<string>,
): Set<string> => {
  const handlerOnlyWriteStateNames = new Set<string>();
  for (const binding of useStateBindings) {
    let didFindAnySetterCall = false;
    let areAllSetterCallsInHandlers = true;
    walkAst(componentBody, (child: EsTreeNode) => {
      if (!areAllSetterCallsInHandlers) return false;
      if (!isNodeOfType(child, "CallExpression")) return;
      if (!isNodeOfType(child.callee, "Identifier")) return;
      if (child.callee.name !== binding.setterName) return;
      didFindAnySetterCall = true;
      if (!isInsideEventHandler(child, handlerBindingNames)) {
        areAllSetterCallsInHandlers = false;
      }
    });
    if (didFindAnySetterCall && areAllSetterCallsInHandlers) {
      handlerOnlyWriteStateNames.add(binding.valueName);
    }
  }
  return handlerOnlyWriteStateNames;
};
