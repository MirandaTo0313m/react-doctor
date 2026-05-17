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
  hasCleanup,
  isState,
  isStateSetterCall,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

export const scopeNoChainStateUpdates = defineRule<Rule>({
  id: "scope-no-chain-state-updates",
  severity: "warn",
  recommendation:
    "Avoid chaining state changes across effects. When possible, update all relevant state simultaneously. See https://react.dev/learn/you-might-not-need-an-effect#chains-of-computations",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node) || hasCleanup(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      const depsRefs = getEffectDepsRefs(context, node);
      if (!effectFnRefs || !depsRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      const isSomeDepsState = depsRefs
        .flatMap((ref) => getUpstreamRefs(context, ref))
        .some((ref) => isState(ref));

      for (const ref of effectFnRefs) {
        if (!isStateSetterCall(context, ref)) continue;
        if (!isSynchronous(ref.identifier, effectFn)) continue;

        const callExpr = getCallExpr(ref);
        if (!callExpr) continue;

        const isSomeArgsState = getArgsUpstreamRefs(context, ref).some((argRef) => isState(argRef));

        if (isSomeDepsState && !isSomeArgsState) {
          context.report({
            node: callExpr,
            message:
              "Avoid chaining state changes. When possible, update all relevant state simultaneously.",
          });
        }
      }
    },
  }),
});
