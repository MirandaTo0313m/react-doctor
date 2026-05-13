import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: in `"use server"` files, mutable module-level state (let/var, OR
// const-bound mutable containers like Map/Set/WeakMap/Array) is shared
// across concurrent requests. Different users can read each other's data,
// and serverless cold-starts produce inconsistent state. Per-request data
// must live inside the action, in headers/cookies, or in a request scope
// (React.cache, AsyncLocalStorage, etc.).

// HACK: `cache(fn)` from React keys deduplication on REFERENCE equality
// of the function arguments. Calling the cached function with object
// literals (`getUser({ id: 1 })` then `getUser({ id: 1 })`) creates two
// distinct argument objects per render, so the cache never hits and the
// underlying fetch runs twice per request. Pass primitives (or memoize
// the argument object once at module/route scope).

// HACK: a (object, method) pair counts as "deferrable side effect" when
// it either (a) is a synchronous `console.log/info/warn` (still cheap,
// but the historical behavior of this rule and a real concern when many
// log lines pile up), or (b) is a known analytics/telemetry SDK method
// that genuinely costs a network round trip and IS worth wrapping in
// `after()` so it doesn't delay the user-visible response. Add provider
// names to the analytics object set as new SDKs come up.

export const objectExpressionHasNextRevalidate = (objectExpression: EsTreeNode): boolean => {
  if (!isNodeOfType(objectExpression, "ObjectExpression")) return false;
  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    if (!isNodeOfType(property.key, "Identifier")) continue;
    if (property.key.name === "cache") return true;
    if (property.key.name !== "next") continue;
    if (!isNodeOfType(property.value, "ObjectExpression")) return true;
    for (const innerProperty of property.value.properties ?? []) {
      if (!isNodeOfType(innerProperty, "Property")) continue;
      if (!isNodeOfType(innerProperty.key, "Identifier")) continue;
      if (innerProperty.key.name === "revalidate" || innerProperty.key.name === "tags") {
        return true;
      }
    }
    return true;
  }
  return false;
};
