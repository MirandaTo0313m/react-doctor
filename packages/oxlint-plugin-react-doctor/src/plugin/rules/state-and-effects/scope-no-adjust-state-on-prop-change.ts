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
  getEffectDepsRefs,
  getEffectFn,
  getEffectFnRefs,
  isProp,
  isStateSetterCall,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

export const scopeNoAdjustStateOnPropChange = defineRule<Rule>({
  id: "scope-no-adjust-state-on-prop-change",
  severity: "warn",
  recommendation:
    "Avoid adjusting state when a prop changes. Instead, adjust the state directly during render, or refactor your state to avoid this need entirely. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      const depsRefs = getEffectDepsRefs(context, node);
      if (!effectFnRefs || !depsRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      const isSomeDepsProps = depsRefs
        .flatMap((ref) => getUpstreamRefs(context, ref))
        .some((ref) => isProp(context, ref));

      for (const ref of effectFnRefs) {
        if (!isStateSetterCall(context, ref)) continue;
        if (!isSynchronous(ref.identifier, effectFn)) continue;

        const callExpr = getCallExpr(ref);
        if (!callExpr) continue;

        const isSomeArgsProps = getArgsUpstreamRefs(context, ref).some((argRef) =>
          isProp(context, argRef),
        );

        if (isSomeDepsProps && !isSomeArgsProps) {
          context.report({
            node: callExpr,
            message:
              "Avoid adjusting state when a prop changes. Instead, adjust the state directly during render, or refactor your state to avoid this need entirely.",
          });
        }
      }
    },
  }),
});
