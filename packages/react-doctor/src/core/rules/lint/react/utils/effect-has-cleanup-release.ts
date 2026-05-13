import type { EsTreeNode } from "../../utils/index.js";
import { collectReleasableBindingNames } from "./collect-releasable-binding-names.js";
import { isCleanupReturn } from "./is-cleanup-return.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSubscribeLikeCallExpression } from "./is-subscribe-like-call-expression.js";
import { walkInsideStatementBlocks } from "../../utils/index.js";

// HACK: `useEffect(() => parentCallback(state.x), [state.x])` is the
// "lift state up via callback" anti-pattern: the child owns state, then
// fires a parent callback every time the state changes to keep the
// parent in sync. The parent has no real ground-truth state, just a
// stale mirror. The right shape is to lift state into a Provider that
// both child and parent read from; the child then doesn't need an
// effect-driven sync at all.

// HACK: useEffectEvent's identity is intentionally unstable - it captures
// the latest props/state on each call. Listing it in a useEffect/useMemo/
// useCallback dep array fundamentally misuses the API and would cause the
// effect to re-run constantly. The recommended pattern is to call the
// effect-event from inside the effect body without listing it as a dep.
//
// Bindings are scoped per-component using a stack so a `useEffectEvent`
// binding named `onChange` in ComponentA doesn't taint a regular variable
// `onChange` in ComponentB in the same file.

// HACK: a useState whose value is never read in the component's JSX
// return is by definition not visual state - every setState triggers a
// render that produces the same DOM. Use `useRef` (`ref.current = ...`)
// so updates don't trigger re-renders. (For values read inside an
// addEventListener-style callback, a ref also lets the handler always
// see the latest value without re-subscribing each effect run.)

export const effectHasCleanupRelease = (callback: EsTreeNode): boolean => {
  // HACK: expression-body arrows are the dominant shape for trivial
  // subscribe-only effects:
  //
  //   useEffect(() => store.subscribe(handler), []);
  //
  // The arrow's expression body IS the body, and its evaluation
  // result is implicitly returned as the effect's cleanup function.
  // For subscribe-shaped calls we know the return value is the
  // unsubscribe - accept this case before the BlockStatement-only
  // checks below.
  if (!isNodeOfType(callback.body, "BlockStatement")) {
    return isSubscribeLikeCallExpression(callback.body);
  }
  const knownBoundReleaseNames = collectReleasableBindingNames(callback);
  // HACK: scan ALL `return` statements at the effect's own function
  // scope (skipping nested functions via `walkInsideStatementBlocks`),
  // not just the top-level last statement. The last-statement check
  // false-positives on the very common conditional-cleanup shape:
  //
  //   useEffect(() => {
  //     if (!enabled) return;
  //     const sub = subscribe(...);
  //     if (someCondition) {
  //       return () => sub();
  //     }
  //   }, [enabled]);
  //
  // Either accept the conditional cleanup as intentional, or risk
  // ~36% FPs on real codebases (measured: react-grab, excalidraw,
  // textarea/popover patterns). Accepting nested cleanup mirrors how
  // exhaustive-deps treats branched returns: trust the author.
  let didFindCleanupReturn = false;
  walkInsideStatementBlocks(callback.body, (child: EsTreeNode) => {
    if (didFindCleanupReturn) return;
    if (!isNodeOfType(child, "ReturnStatement")) return;
    if (isCleanupReturn(child.argument, knownBoundReleaseNames)) {
      didFindCleanupReturn = true;
    }
  });
  return didFindCleanupReturn;
};
