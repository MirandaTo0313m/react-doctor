import type { EsTreeNode } from "../../utils/index.js";
import { containsReleaseLikeCall } from "./contains-release-like-call.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSubscribeLikeCallExpression } from "./is-subscribe-like-call-expression.js";

// HACK: variables bound to a subscribe-like or timer-like call inside
// an effect body are CLEANUP TARGETS - `return X` or `() => X()` /
// `() => clearTimeout(X)` releases the resource. Collecting them here
// lets the shared release predicate accept user-named bindings
// (`const unsub = ...; return unsub`) without falling back to the
// previous "any Identifier is fine" behavior.

export const isCleanupReturn = (
  returnedValue: EsTreeNode | null | undefined,
  knownBoundReleaseNames: ReadonlySet<string>,
): boolean => {
  if (!returnedValue) return false;
  if (isNodeOfType(returnedValue, "Identifier")) {
    return knownBoundReleaseNames.has(returnedValue.name);
  }
  if (isSubscribeLikeCallExpression(returnedValue)) return true;
  if (
    isNodeOfType(returnedValue, "ArrowFunctionExpression") ||
    isNodeOfType(returnedValue, "FunctionExpression")
  ) {
    return containsReleaseLikeCall(returnedValue, knownBoundReleaseNames);
  }
  return false;
};
