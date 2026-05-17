import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getArgsUpstreamRefs, getCallExpr, isSynchronous } from "../../utils/scope-traversal.js";
import {
  findContainingNode,
  getEffectFn,
  getEffectFnRefs,
  isCustomHook,
  isPropCall,
  isState,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

export const scopeNoPassLiveStateToParent = defineRule<Rule>({
  id: "scope-no-pass-live-state-to-parent",
  severity: "warn",
  recommendation:
    "Avoid passing live state to parents in an effect. Instead, lift the state to the parent and pass it down as a prop. See https://react.dev/learn/you-might-not-need-an-effect#notifying-parent-components-about-state-changes",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      if (!effectFnRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      for (const ref of effectFnRefs) {
        if (!isPropCall(context, ref)) continue;
        if (!isSynchronous(ref.identifier, effectFn)) continue;

        const callExpr = getCallExpr(ref);
        if (!callExpr) continue;

        const isStateInArgs = getArgsUpstreamRefs(context, ref).some((argRef) => isState(argRef));

        if (isStateInArgs) {
          const containingNode = findContainingNode(context, node);
          const isInCustomHook = Boolean(containingNode && isCustomHook(containingNode));

          context.report({
            node: callExpr,
            message: isInCustomHook
              ? "Avoid passing live state to parents in an effect. Instead, return the state from the hook."
              : "Avoid passing live state to parents in an effect. Instead, lift the state to the parent and pass it down to the child as a prop.",
          });
        }
      }
    },
  }),
});
