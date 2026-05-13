import type { EsTreeNode } from "../../utils/index.js";
import { TIMER_CALLEE_NAMES_REQUIRING_CLEANUP } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSubscribeLikeCallExpression } from "./is-subscribe-like-call-expression.js";

// HACK: §7 of "You Might Not Need an Effect" - chains of computations:
//
//   useEffect(() => { if (card.gold) setGoldCardCount(c => c + 1); }, [card]);
//   useEffect(() => { if (goldCardCount > 3) setRound(r => r + 1); }, [goldCardCount]);
//   useEffect(() => { if (round > 5) setIsGameOver(true); }, [round]);
//
// Each link adds one extra render to the tree below the component.
// More importantly, the chain is rigid: setting `card` to a value from
// the past re-fires every downstream effect.
//
// `noCascadingSetState` (already shipped) catches multi-setter calls
// inside ONE effect; it does NOT see across effects. This rule
// complements it by detecting the cross-effect dependence.
//
// Detector (per component body):
//   1. Collect every top-level useEffect call and, for each:
//        - depNames: Identifier names in the dep array
//        - writtenStateNames: state names whose setter is called in the body
//        - isExternalSync: body returns cleanup OR contains a recognized
//          external-system call (subscribe / addEventListener / fetch /
//          setInterval / new MutationObserver / etc.) OR mutates a ref
//   2. For every ordered pair (A, B) of distinct effects:
//        edge iff (writes(A) ∩ deps(B)) ≠ ∅  AND  ¬isExternalSync(A)
//                                            AND  ¬isExternalSync(B)
//   3. Report on every effect B that is the target of any edge,
//      naming the chained state and the upstream effect's writer.
//
// The article calls out one legitimate "chain" - a multi-step network
// cascade where each effect re-fetches based on the previous step's
// result. Those effects all have `isExternalSync = true` because they
// contain `fetch`, so the rule won't fire.

export const collectReleasableBindingNames = (effectCallback: EsTreeNode): Set<string> => {
  const releasableNames = new Set<string>();
  if (!isNodeOfType(effectCallback.body, "BlockStatement")) return releasableNames;
  for (const statement of effectCallback.body.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      const init = declarator.init;
      if (!init || !isNodeOfType(init, "CallExpression")) continue;
      if (isSubscribeLikeCallExpression(init)) {
        releasableNames.add(declarator.id.name);
        continue;
      }
      if (
        isNodeOfType(init.callee, "Identifier") &&
        TIMER_CALLEE_NAMES_REQUIRING_CLEANUP.has(init.callee.name)
      ) {
        releasableNames.add(declarator.id.name);
      }
    }
  }
  return releasableNames;
};
