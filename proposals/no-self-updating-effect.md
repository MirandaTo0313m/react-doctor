# Proposal: `react-doctor/no-self-updating-effect`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                |
| --------------------------- | ------------------------------ |
| Category                    | `state-and-effects`            |
| Severity                    | `warn`                         |
| Source clusters             | `NEW::no-self-updating-effect` |
| Independent draft proposals | 1                              |
| Backing evidence units      | 1                              |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`facebook/react` — `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js` (FixCommitMeta)](https://github.com/facebook/react/commit/fef12a01c826ce5b8458e82240c659bf51108a46)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the effect directly calls a local `useState` setter and that the same state variable appears in the hook's dependency array. Ignore mount-only effects with `[]`, setters nested inside timers/subscriptions/promise callbacks, and guarded updates that reach a fixed point. This rule is meant for feedback loops that exhaustive-deps does not catch because the dependency array is present.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Remove the feedback loop by deriving the value during render, moving the write into an event handler, or guarding the update so it only runs when the target value actually changes. For example:

```tsx
useLayoutEffect(() => {
  if (count !== nextCount) {
    setCount(nextCount);
  }
}, [count, nextCount]);
```

If the value is purely derived, delete the state and compute it directly instead.

## Positive fixture (SHOULD trigger)

```tsx
import { useLayoutEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    setCount((value) => value + 1);
  }, [count]);

  return null;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useLayoutEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    setCount((value) => value + 1);
  }, []);

  return null;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/state-and-effects/no-self-updating-effect.ts`:

```ts
import { EFFECT_HOOK_NAMES } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import { getCallbackStatements } from "../../utils/get-callback-statements.js";
import { getEffectCallback } from "../../utils/get-effect-callback.js";
import { isComponentAssignment } from "../../utils/is-component-assignment.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isUppercaseName } from "../../utils/is-uppercase-name.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { collectUseStateBindings } from "./utils/collect-use-state-bindings.js";

const getDirectSetterCall = (
  statement: EsTreeNode,
  setterNames: ReadonlySet<string>,
): EsTreeNodeOfType<"CallExpression"> | null => {
  const expression = isNodeOfType(statement, "ExpressionStatement")
    ? statement.expression
    : statement;
  if (!isNodeOfType(expression, "CallExpression")) return null;
  if (!isNodeOfType(expression.callee, "Identifier")) return null;
  if (!setterNames.has(expression.callee.name)) return null;
  return expression;
};

const hasStateNameInDeps = (depsNode: EsTreeNode, stateName: string): boolean => {
  if (!isNodeOfType(depsNode, "ArrayExpression")) return false;
  return (depsNode.elements ?? []).some(
    (element) => isNodeOfType(element, "Identifier") && element.name === stateName,
  );
};

export const noSelfUpdatingEffect = defineRule<Rule>({
  id: "no-self-updating-effect",
  severity: "warn",
  recommendation:
    "Remove the feedback loop: derive the value during render, move the write into an event handler, or guard the update so it reaches a fixed point.",
  create: (context: RuleContext) => {
    const checkComponent = (componentBody: EsTreeNode | null | undefined): void => {
      if (!componentBody || !isNodeOfType(componentBody, "BlockStatement")) return;
      const useStateBindings = collectUseStateBindings(componentBody);
      if (useStateBindings.length === 0) return;

      const setterNameToStateName = new Map<string, string>();
      const setterNames = new Set<string>();
      for (const binding of useStateBindings) {
        setterNameToStateName.set(binding.setterName, binding.valueName);
        setterNames.add(binding.setterName);
      }

      for (const statement of componentBody.body ?? []) {
        if (!isNodeOfType(statement, "ExpressionStatement")) continue;
        const effectCall = statement.expression;
        if (!isNodeOfType(effectCall, "CallExpression")) continue;
        if (!isHookCall(effectCall, EFFECT_HOOK_NAMES)) continue;
        if ((effectCall.arguments?.length ?? 0) < 2) continue;
        const depsNode = effectCall.arguments[1];
        if (!isNodeOfType(depsNode, "ArrayExpression")) continue;

        const callback = getEffectCallback(effectCall);
        if (!callback) continue;
        const callbackStatements = getCallbackStatements(callback);
        if (callbackStatements.length === 0) continue;

        for (const callbackStatement of callbackStatements) {
          const setterCall = getDirectSetterCall(callbackStatement, setterNames);
          if (!setterCall || !isNodeOfType(setterCall.callee, "Identifier")) continue;
          const stateName = setterNameToStateName.get(setterCall.callee.name);
          if (!stateName) continue;
          if (!hasStateNameInDeps(depsNode, stateName)) continue;

          context.report({
            node: setterCall,
            message: `${setterCall.callee.name}() inside a React effect depends on \`${stateName}\` and feeds the same state back into the effect — this causes a render loop. Remove the self-dependency or guard the update so it settles.`,
          });
        }
      }
    };

    return {
      FunctionDeclaration(node: EsTreeNodeOfType<"FunctionDeclaration">) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkComponent(node.body);
      },
      VariableDeclarator(node: EsTreeNodeOfType<"VariableDeclarator">) {
        if (!isComponentAssignment(node)) return;
        if (
          !isNodeOfType(node.init, "ArrowFunctionExpression") &&
          !isNodeOfType(node.init, "FunctionExpression")
        ) {
          return;
        }
        checkComponent(node.init.body);
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
