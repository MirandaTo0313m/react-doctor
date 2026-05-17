import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import {
  findDownstreamNodes,
  getDownstreamRefs,
  getUpstreamRefs,
} from "../../utils/scope-traversal.js";
import {
  getEffectFnRefs,
  hasCleanup,
  isProp,
  isState,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

export const scopeNoEventHandler = defineRule<Rule>({
  id: "scope-no-event-handler",
  severity: "warn",
  recommendation:
    "Avoid using state and effects as an event handler. Instead, call the event handling code directly when the event occurs. See https://react.dev/learn/you-might-not-need-an-effect#sharing-logic-between-event-handlers",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node) || hasCleanup(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      if (!effectFnRefs) return;

      const ifTestRefs = findDownstreamNodes(context, node, "IfStatement")
        .filter((ifNode) => {
          const ifRecord = ifNode as unknown as Record<string, unknown>;
          return !ifRecord.alternate;
        })
        .flatMap((ifNode) => {
          const ifRecord = ifNode as unknown as Record<string, unknown>;
          const test = ifRecord.test;
          if (!test || typeof test !== "object" || !("type" in test)) return [];
          return getDownstreamRefs(
            context,
            test as import("../../utils/es-tree-node.js").EsTreeNode,
          ).flatMap((ref) => getUpstreamRefs(context, ref));
        });

      for (const ref of ifTestRefs) {
        if (isState(ref)) {
          context.report({
            node: ref.identifier,
            message:
              "Avoid using state and effects as an event handler. Instead, call the event handling code directly when the event occurs.",
          });
        }
      }

      for (const ref of ifTestRefs) {
        if (isProp(context, ref)) {
          context.report({
            node: ref.identifier,
            message:
              "Avoid using props and effects as an event handler. Instead, move the handler to the parent component.",
          });
        }
      }
    },
  }),
});
