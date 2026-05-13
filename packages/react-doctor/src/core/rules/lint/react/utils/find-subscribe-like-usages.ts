import type { EsTreeNode } from "../../utils/index.js";
import type { SubscribeLikeUsage } from "./subscribe-like-usage.js";
import { SUBSCRIPTION_METHOD_NAMES } from "../../constants.js";
import { TIMER_CALLEE_NAMES_REQUIRING_CLEANUP } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: §1 of "You Might Not Need an Effect" - mirroring a prop into
// local state with a useEffect that re-syncs it. The combined shape
// is the most common form of derived-state-effect in real codebases:
//
//   function Form({ value }) {
//     const [draft, setDraft] = useState(value);
//     useEffect(() => { setDraft(value); }, [value]);
//     // ...
//   }
//
// Both `noDerivedStateEffect` and `noDerivedUseState` independently
// nudge at parts of this. This rule produces a single, more
// actionable diagnostic that names the prop and recommends deleting
// both the useState and the effect.
//
// Detector pre-conditions:
//   (1) `[X, setX] = useState(<propExpr>)` where <propExpr> is a
//       prop Identifier or a MemberExpression rooted in a prop
//   (2) `useEffect(() => setX(<propExpr'>), [<propRoot>])` where
//       <propExpr'> is structurally identical to <propExpr> from (1)
// Follow call chains so a prop-rooted method call counts:
// `useState(value.toUpperCase())` resolves to root "value". Safe for
// mirror-detection because the structural-equality check on the setter
// argument still requires the SAME call shape - it won't match
// `setX(value.toLowerCase())`.

export const findSubscribeLikeUsages = (callback: EsTreeNode): SubscribeLikeUsage[] => {
  const usages: SubscribeLikeUsage[] = [];
  // HACK: timer/subscribe calls inside the EFFECT'S CLEANUP RETURN
  // are not new registrations - they're the disposal step. The old
  // walker traversed the full callback including any returned
  // cleanup function, so a `setTimeout` inside `return () => { ... }`
  // got counted as a usage. Detect and skip the cleanup ReturnStatement's
  // argument body during the walk.
  let cleanupArgument: EsTreeNode | null = null;
  if (isNodeOfType(callback.body, "BlockStatement")) {
    const callbackStatements = callback.body.body ?? [];
    const lastCallbackStatement = callbackStatements[callbackStatements.length - 1];
    if (isNodeOfType(lastCallbackStatement, "ReturnStatement") && lastCallbackStatement.argument) {
      cleanupArgument = lastCallbackStatement.argument;
    }
  }

  walkAst(callback, (child: EsTreeNode) => {
    if (child === cleanupArgument) return false;
    if (!isNodeOfType(child, "CallExpression")) return;

    if (
      isNodeOfType(child.callee, "Identifier") &&
      TIMER_CALLEE_NAMES_REQUIRING_CLEANUP.has(child.callee.name)
    ) {
      usages.push({
        kind: "timer",
        resourceName: child.callee.name,
      });
      return;
    }

    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.property, "Identifier") &&
      SUBSCRIPTION_METHOD_NAMES.has(child.callee.property.name)
    ) {
      usages.push({
        kind: "subscribe",
        resourceName: child.callee.property.name,
      });
    }
  });
  return usages;
};
