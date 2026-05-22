# Proposal: `react-doctor/no-debounce-hook-callback`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                  |
| --------------------------- | -------------------------------- |
| Category                    | `performance`                    |
| Severity                    | `warn`                           |
| Source clusters             | `NEW::no-debounce-hook-callback` |
| Independent draft proposals | 1                                |
| Backing evidence units      | 1                                |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/classic/editor.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ec06a99fdb3d7f21f292da9bc2882832f96d7692)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag only when `debounce` or `throttle` wraps a callback that came from another hook, especially inside render-time code like `useRef(debounce(...))`. Do not flag module-scope debouncers, inline callbacks that are not hook results, or debouncing implemented inside the hook that owns the callback. Be cautious with ordinary utility functions whose names happen to start with `use` but are not React hooks.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Move the rate limiting into the hook that owns the callback so the timer or lock stays stable across renders. For example:

```tsx
function useSubmit() {
  const lockedRef = useRef(false);
  return () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setTimeout(() => {
      lockedRef.current = false;
    }, 1000);
    submitChallenge();
  };
}
```

Then use `const submit = useSubmit();` directly in the component instead of wrapping it in `debounce(...)` or `throttle(...)` during render.

## Positive fixture (SHOULD trigger)

```tsx
import { debounce } from "lodash-es";
import { useRef } from "react";

function useSubmit() {
  return () => {};
}

function Editor() {
  const submit = useSubmit();
  const submitRef = useRef(debounce(submit, 1000));
  return <button onClick={submitRef.current}>Save</button>;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { debounce } from "lodash-es";
import { useRef } from "react";

function Editor() {
  const submitRef = useRef(debounce(() => {}, 1000));
  return <button onClick={submitRef.current}>Save</button>;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/performance/no-debounce-hook-callback.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { findVariableInitializer } from "../../utils/find-variable-initializer.js";
import { getCalleeName } from "../../utils/get-callee-name.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const RATE_LIMITER_NAMES = new Set(["debounce", "throttle"]);

const isRateLimiterCall = (node: EsTreeNode): boolean => {
  const calleeName = getCalleeName(node);
  return calleeName !== null && RATE_LIMITER_NAMES.has(calleeName);
};

const isHookProducedBinding = (referenceNode: EsTreeNode, bindingName: string): boolean => {
  const binding = findVariableInitializer(referenceNode, bindingName);
  if (!binding || !binding.initializer) return false;
  if (!isNodeOfType(binding.initializer, "CallExpression")) return false;
  const calleeName = getCalleeName(binding.initializer);
  return calleeName !== null && calleeName.startsWith("use");
};

export const noDebounceHookCallback = defineRule<Rule>({
  id: "no-debounce-hook-callback",
  severity: "warn",
  recommendation:
    "Move the debounce/throttle into the hook that owns the callback, or return a stable callback from that hook instead of creating the wrapper in render",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isRateLimiterCall(node)) return;
      const callbackArgument = node.arguments?.[0];
      if (!isNodeOfType(callbackArgument, "Identifier")) return;
      if (!isHookProducedBinding(callbackArgument, callbackArgument.name)) return;
      const calleeName = getCalleeName(node) ?? "debounce";
      context.report({
        node,
        message: `${calleeName}(${callbackArgument.name}, ...) wraps a hook callback during render - move the rate limiting into the hook that owns "${callbackArgument.name}"`,
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
