# Proposal: `react-doctor/no-debounce-in-use-ref`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                               |
| --------------------------- | ----------------------------- |
| Category                    | `state-and-effects`           |
| Severity                    | `warn`                        |
| Source clusters             | `NEW::no-debounce-in-use-ref` |
| Independent draft proposals | 1                             |
| Backing evidence units      | 1                             |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/utils/fetch-all-curriculum-data.test.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ec06a99fdb3d7f21f292da9bc2882832f96d7692)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag this only when a React component creates a debounced callback with `useRef(debounce(...))`, since that hides timer state in the component and freezes the initial callback closure. Do not flag custom hooks that intentionally own their own debounce behavior, non-component utility modules, or refs that store unrelated values like DOM nodes, booleans, or timeout IDs. Also ignore cases where `debounce` is just a differently named helper and not a stateful debounce wrapper.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Move the debounce state into the hook that owns the action, or replace the ref-wrapped debounce with a dedicated hook that manages per-instance timer state and cleanup. That keeps each instance isolated and avoids stale callback capture.

```tsx
function useSubmit() {
  const lockedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    timeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
      timeoutRef.current = null;
    }, 1000);
  };
}
```

## Positive fixture (SHOULD trigger)

```tsx
import { useRef } from "react";
import { debounce } from "lodash-es";

function Editor() {
  const onSubmit = () => {};
  const submitRef = useRef(debounce(onSubmit, 1000));

  return <button onClick={submitRef.current}>Submit</button>;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useRef } from "react";

function Editor() {
  const submitLockRef = useRef(false);

  return <button onClick={() => {}}>Submit</button>;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/state-and-effects/no-debounce-in-use-ref.ts`:

```ts
import { UPPERCASE_PATTERN } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import { isComponentAssignment } from "../../utils/is-component-assignment.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const isDebounceCall = (node: EsTreeNode | null | undefined): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (isNodeOfType(callee, "Identifier")) return callee.name === "debounce";
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
    return callee.property.name === "debounce";
  }
  return false;
};

const isDebounceWrappedUseRef = (node: EsTreeNode | null | undefined): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isHookCall(node, "useRef")) return false;
  const firstArgument = node.arguments?.[0];
  return isDebounceCall(firstArgument);
};

const checkComponent = (componentBody: EsTreeNode, context: RuleContext): void => {
  if (!isNodeOfType(componentBody, "BlockStatement")) return;

  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator, "VariableDeclarator")) continue;
      if (!isDebounceWrappedUseRef(declarator.init)) continue;

      context.report({
        node: declarator.init,
        message:
          "Don't wrap debounce() in useRef inside a component. Move the debounce state into the hook that owns the action so each instance keeps its own timer and cleanup.",
      });
    }
  }
};

export const noDebounceInUseRef = defineRule<Rule>({
  id: "no-debounce-in-use-ref",
  severity: "warn",
  recommendation:
    "Move the debounce logic into the hook that owns the action, or use a small custom hook that manages the timer and cleanup per instance",
  create: (context: RuleContext) => ({
    FunctionDeclaration(node: EsTreeNodeOfType<"FunctionDeclaration">) {
      if (node.id?.name && UPPERCASE_PATTERN.test(node.id.name)) {
        checkComponent(node.body, context);
      }
    },
    VariableDeclarator(node: EsTreeNodeOfType<"VariableDeclarator">) {
      if (!isComponentAssignment(node)) return;
      if (
        !isNodeOfType(node.init, "ArrowFunctionExpression") &&
        !isNodeOfType(node.init, "FunctionExpression")
      ) {
        return;
      }
      checkComponent(node.init.body, context);
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
