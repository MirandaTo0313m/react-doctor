import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getCallExpr, isSynchronous } from "../../utils/scope-traversal.js";
import {
  getEffectDepsRefs,
  getEffectFn,
  getEffectFnRefs,
  getUseStateDecl,
  isStateSetter,
  isStateSetterCall,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

export const scopeNoInitializeState = defineRule<Rule>({
  id: "scope-no-initialize-state",
  severity: "warn",
  recommendation:
    "Avoid initializing state in an effect. Instead, initialize the `useState()` call directly. For SSR hydration, prefer `useSyncExternalStore()`. See https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      const depsRefs = getEffectDepsRefs(context, node);
      if (!effectFnRefs || !depsRefs) return;

      const effectFn = getEffectFn(node);
      if (!effectFn) return;

      const isEffectRunOnlyOnMount = depsRefs.filter((ref) => !isStateSetter(ref)).length === 0;
      if (!isEffectRunOnlyOnMount) return;

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

        const callExprRecord = callExpr as unknown as Record<string, unknown>;
        const callArgs = callExprRecord.arguments as EsTreeNode[] | undefined;
        const argumentText = callArgs?.[0]
          ? (context.sourceCode?.getText(callArgs[0]) ?? "undefined")
          : "undefined";

        context.report({
          node: callExpr,
          message: `Avoid initializing state in an effect. Instead, initialize "${stateName ?? "state"}"'s \`useState()\` with "${argumentText}". For SSR hydration, prefer \`useSyncExternalStore()\`.`,
        });
      }
    },
  }),
});
