import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import {
  getArgsUpstreamRefs,
  getCallExpr,
  getUpstreamRefs,
  isSynchronous,
} from "../../utils/scope-traversal.js";
import {
  findContainingNode,
  getEffectFn,
  getEffectFnRefs,
  hasCleanup,
  isConstant,
  isCustomHook,
  isProp,
  isPropCall,
  isRefCall,
  isRefCurrent,
  isUseEffect,
  isUseRef,
  isUseState,
} from "../../utils/react-scope-helpers.js";

export const scopeNoPassDataToParent = defineRule<Rule>({
  id: "scope-no-pass-data-to-parent",
  severity: "warn",
  recommendation:
    "Avoid passing data to parents in an effect. Instead, fetch the data in the parent and pass it down as a prop. See https://react.dev/learn/you-might-not-need-an-effect#passing-data-to-the-parent",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node) || hasCleanup(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      if (!effectFnRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      for (const ref of effectFnRefs) {
        if (!isPropCall(context, ref)) continue;
        if (isRefCall(context, ref)) continue;
        if (!isSynchronous(ref.identifier, effectFn)) continue;

        const callExpr = getCallExpr(ref);
        if (!callExpr) continue;

        const argsUpstreamRefs = getArgsUpstreamRefs(context, ref).filter(
          (argRef) => getUpstreamRefs(context, argRef).length === 1,
        );

        const isSomeArgsData = argsUpstreamRefs.some(
          (argRef) =>
            !isUseState(argRef.identifier) &&
            !isProp(context, argRef) &&
            !isUseRef(argRef.identifier) &&
            !isRefCurrent(argRef) &&
            !isConstant(argRef),
        );

        if (isSomeArgsData) {
          const containingNode = findContainingNode(context, node);
          const isInCustomHook = Boolean(containingNode && isCustomHook(containingNode));

          context.report({
            node: callExpr,
            message: isInCustomHook
              ? "Avoid passing data to parents in an effect. Instead, return the data from the hook."
              : "Avoid passing data to parents in an effect. Instead, fetch the data in the parent and pass it down to the child as a prop.",
          });
        }
      }
    },
  }),
});
