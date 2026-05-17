import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { ScopeReference } from "../../utils/scope-types.js";
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
  getUseStateDecl,
  hasCleanup,
  isProp,
  isState,
  isStateSetterCall,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

const countCalls = (ref: ScopeReference): number =>
  ref.resolved?.references.filter(
    (innerRef) => innerRef.identifier.parent?.type === "CallExpression",
  ).length ?? 0;

export const scopeNoDerivedState = defineRule<Rule>({
  id: "scope-no-derived-state",
  severity: "warn",
  recommendation:
    "Compute derived values directly during render, optionally with `useMemo` if expensive. See https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node) || hasCleanup(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      const depsRefs = getEffectDepsRefs(context, node);
      if (!effectFnRefs || !depsRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      for (const ref of effectFnRefs) {
        if (!isStateSetterCall(context, ref)) continue;
        if (!isSynchronous(ref.identifier, effectFn)) continue;

        const callExpr = getCallExpr(ref);
        if (!callExpr) continue;

        const useStateNode = getUseStateDecl(context, ref);
        const useStateNodeRecord = useStateNode as unknown as Record<string, unknown>;
        const idNode = useStateNodeRecord?.id as Record<string, unknown> | undefined;
        const elements = idNode?.elements as Array<Record<string, unknown> | null> | undefined;
        const stateName = (elements?.[0]?.name ?? elements?.[1]?.name) as string | undefined;

        const argsUpstreamRefs = getArgsUpstreamRefs(context, ref);
        const depsUpstreamRefs = depsRefs.flatMap((depRef) => getUpstreamRefs(context, depRef));
        const isSomeArgsInternal = argsUpstreamRefs.some(
          (argRef) => isState(argRef) || isProp(context, argRef),
        );

        const isAllArgsInDeps =
          argsUpstreamRefs.length > 0 &&
          argsUpstreamRefs.every((argRef) =>
            depsUpstreamRefs.some((depRef) => argRef.resolved === depRef.resolved),
          );
        const isValueAlwaysInSync = isAllArgsInDeps && countCalls(ref) === 1;

        if (isSomeArgsInternal) {
          context.report({
            node: callExpr,
            message: `Avoid storing derived state. Compute "${stateName ?? "state"}" directly during render, optionally with \`useMemo\` if it's expensive.`,
          });
        } else if (isValueAlwaysInSync) {
          context.report({
            node: callExpr,
            message: `Avoid storing derived state. "${stateName ?? "state"}" is only set here, and thus could be computed directly during render.`,
          });
        }
      }
    },
  }),
});
