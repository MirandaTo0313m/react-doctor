# Proposal: `react-doctor/no-focus-on-mount`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                          |
| --------------------------- | ------------------------ |
| Category                    | `state-and-effects`      |
| Severity                    | `warn`                   |
| Source clusters             | `NEW::no-focus-on-mount` |
| Independent draft proposals | 1                        |
| Backing evidence units      | 1                        |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `e2e/editor.spec.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/bdbdad5e326f8908d53312bb2bc32d9c45777aba)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Only treat this as a bug when the focus runs during initial mount or from an empty-deps effect. Common false positives are modal/dialog initial-focus patterns, restoring focus after navigation, and effects gated by an explicit `isOpen` or `ready` flag. If the focus is triggered by a user action or a later dependency change, it is probably intentional.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Move the focus into the user action that opens the UI, or gate it on explicit readiness instead of mounting it immediately. For example:

```tsx
useEffect(() => {
  if (isOpen) inputRef.current?.focus();
}, [isOpen]);
```

## Positive fixture (SHOULD trigger)

```tsx
import { useEffect, useRef } from "react";

export function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useEffect, useRef } from "react";

export function SearchBox({ isOpen }: { isOpen: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return <input ref={inputRef} />;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/state-and-effects/no-focus-on-mount.ts`:

````ts
import { EFFECT_HOOK_NAMES } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getEffectCallback } from "../../utils/get-effect-callback.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { walkAst } from "../../utils/walk-ast.js";

const unwrapChainExpression = (node: EsTreeNode): EsTreeNode =>
  isNodeOfType(node, "ChainExpression") ? node.expression : node;

const hasEmptyDependencyArray = (node: EsTreeNode): boolean => {
  const depsNode = node.arguments?.[1];
  return isNodeOfType(depsNode, "ArrayExpression") && (depsNode.elements?.length ?? 0) === 0;
};

const isFocusCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = unwrapChainExpression(node.callee);
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (callee.computed) return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  return callee.property.name === "focus";
};

const effectCallbackContainsFocusCall = (callback: EsTreeNode): boolean => {
  let didFindFocusCall = false;
  walkAst(callback, (child: EsTreeNode) => {
    if (didFindFocusCall) return false;
    if (isFocusCall(child)) didFindFocusCall = true;
  });
  return didFindFocusCall;
};

export const noFocusOnMount = defineRule<Rule>({
  id: "no-focus-on-mount",
  severity: "warn",
  recommendation:
    "Move the focus into the user action that opens the UI, or gate it on an explicit ready/open state instead of running it on mount.\n\n```tsx\nuseEffect(() => {\n  if (isOpen) inputRef.current?.focus();\n}, [isOpen]);\n```",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isHookCall(node, EFFECT_HOOK_NAMES)) return;
      if (!hasEmptyDependencyArray(node)) return;
      const callback = getEffectCallback(node);
      if (!callback) return;
      if (!effectCallbackContainsFocusCall(callback)) return;
      context.report({
        node,
        message:
          "focus() in a mount effect can steal focus before the UI is ready - move it behind a user action or an explicit open state",
      });
    },
  }),
});
````

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
