import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { ScopeReference } from "../../utils/scope-types.js";
import { getCallExpr, getDownstreamRefs, getUpstreamRefs } from "../../utils/scope-traversal.js";
import {
  findContainingNode,
  getEffectDepsRefs,
  getEffectFnRefs,
  getUseStateDecl,
  isCustomHook,
  isProp,
  isState,
  isStateSetterCall,
  isUseEffect,
} from "../../utils/react-scope-helpers.js";

const isSetStateToInitialValue = (context: RuleContext, setterRef: ScopeReference): boolean => {
  const callExprNode = getCallExpr(setterRef);
  if (!callExprNode) return false;
  const callExprRecord = callExprNode as unknown as Record<string, unknown>;
  const callArgs = callExprRecord.arguments as EsTreeNode[] | undefined;
  const setStateToValue = callArgs?.[0];

  const useStateNode = getUseStateDecl(context, setterRef);
  if (!useStateNode) return false;
  const useStateRecord = useStateNode as unknown as Record<string, unknown>;
  const initNode = useStateRecord.init as EsTreeNode | undefined;
  if (!initNode) return false;
  const initRecord = initNode as unknown as Record<string, unknown>;
  const initArgs = initRecord.arguments as EsTreeNode[] | undefined;
  const stateInitialValue = initArgs?.[0];

  const isUndefined = (node: EsTreeNode | undefined): boolean => {
    if (!node) return true;
    const nodeRecord = node as unknown as Record<string, unknown>;
    return nodeRecord.name === "undefined";
  };

  if (isUndefined(setStateToValue) && isUndefined(stateInitialValue)) return true;
  if (!setStateToValue && !stateInitialValue) return true;
  if ((setStateToValue && !stateInitialValue) || (!setStateToValue && stateInitialValue))
    return false;
  if (!context.sourceCode || !setStateToValue || !stateInitialValue) return false;

  return (
    context.sourceCode.getText(setStateToValue) === context.sourceCode.getText(stateInitialValue)
  );
};

const countUseStates = (context: RuleContext, componentNode: EsTreeNode | undefined): number => {
  if (!componentNode) return 0;
  return getDownstreamRefs(context, componentNode).filter((ref) => isState(ref)).length;
};

export const scopeNoResetAllStateOnPropChange = defineRule<Rule>({
  id: "scope-no-reset-all-state-on-prop-change",
  severity: "warn",
  recommendation:
    "Avoid resetting all state when a prop changes. Instead, pass the prop as `key` so React resets the component's state. See https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!context.sourceCode) return;
      if (!isUseEffect(node)) return;
      const effectFnRefs = getEffectFnRefs(context, node);
      const depsRefs = getEffectDepsRefs(context, node);
      if (!effectFnRefs || !depsRefs) return;

      const containingNode = findContainingNode(context, node);
      if (containingNode && isCustomHook(containingNode)) return;

      const stateSetterRefs = effectFnRefs.filter((ref) => isStateSetterCall(context, ref));
      if (stateSetterRefs.length === 0) return;

      const isAllStateReset =
        stateSetterRefs.every((ref) => isSetStateToInitialValue(context, ref)) &&
        stateSetterRefs.length === countUseStates(context, findContainingNode(context, node));

      if (!isAllStateReset) return;

      const propRef = depsRefs
        .flatMap((ref) => getUpstreamRefs(context, ref))
        .find((ref) => isProp(context, ref));

      if (propRef) {
        const propName = (propRef.identifier as unknown as Record<string, unknown>).name as string;
        context.report({
          node,
          message: `Avoid resetting all state when a prop changes. Instead, if "${propName}" is a key, pass it as \`key\` so React will reset the component's state.`,
        });
      }
    },
  }),
});
