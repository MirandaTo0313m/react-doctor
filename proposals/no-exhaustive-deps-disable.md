# Proposal: `react-doctor/no-exhaustive-deps-disable`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                   |
| --------------------------- | --------------------------------- |
| Category                    | `state-and-effects`               |
| Severity                    | `warn`                            |
| Source clusters             | `NEW::no-exhaustive-deps-disable` |
| Independent draft proposals | 5                                 |
| Backing evidence units      | 3                                 |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/components/sidebar-panel/use-active-heading.ts` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/f7753e8a22e80b2b7bb28a74527a3009db04df12)
- [`freeCodeCamp/freeCodeCamp` — `client/src/components/sidebar-panel/use-sticky-scroll-offset.ts` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/f7753e8a22e80b2b7bb28a74527a3009db04df12)
- [`facebook/react` — `fixtures/eslint-v10/index.js` (DisableChurnMeta)](https://github.com/facebook/react/commit/e8c6362678c8bc86a02b8444d2c3f597b3dc4e22)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Treat this as a real finding when a shipped component suppresses `react-hooks/exhaustive-deps` instead of fixing the hook. Common false positives are docs, generated fixtures, and test snippets that intentionally demonstrate a broken example, plus migration shims where the suppression is temporary and clearly isolated. If the hook is truly one-shot and does not capture changing values, prefer refactoring until the disable comment is unnecessary.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Remove the `eslint-disable` comment and make the hook's dependencies explicit, or refactor so the hook no longer captures mutable values. For example:

```tsx
useEffect(() => {
  doSomething(foo);
}, [foo]);
```

If the logic should stay stable, move the read into a stable abstraction instead of silencing the lint.

## Positive fixture (SHOULD trigger)

```tsx
import { useEffect } from "react";

function Component({ foo }) {
  useEffect(() => {
    console.log(foo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useEffect } from "react";

function Component({ foo }) {
  useEffect(() => {
    console.log(foo);
  }, [foo]);
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/state-and-effects/no-exhaustive-deps-disable.ts`:

```ts
import { HOOKS_WITH_DEPS } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface CommentLike {
  readonly value?: unknown;
}

const COMMENT_CONTAINER_KEYS = [
  "comments",
  "leadingComments",
  "trailingComments",
  "innerComments",
] as const;
const DISABLE_EXHAUSTIVE_DEPS_COMMENT_PATTERN =
  /eslint-disable(?:-next-line|-line)?\s+react-hooks\/exhaustive-deps/;

const hasDisableExhaustiveDepsComment = (node: EsTreeNode): boolean => {
  const nodeRecord = node as Record<string, unknown>;

  for (const key of COMMENT_CONTAINER_KEYS) {
    const maybeComments = nodeRecord[key];
    if (!Array.isArray(maybeComments)) continue;

    for (const comment of maybeComments as ReadonlyArray<CommentLike>) {
      if (!comment || typeof comment !== "object") continue;
      const commentValue = comment.value;
      if (typeof commentValue !== "string") continue;
      if (DISABLE_EXHAUSTIVE_DEPS_COMMENT_PATTERN.test(commentValue)) return true;
    }
  }

  return false;
};

const hasDisableExhaustiveDepsCommentInAncestors = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node;

  while (current) {
    if (hasDisableExhaustiveDepsComment(current)) return true;
    current = current.parent ?? null;
  }

  return false;
};

export const noExhaustiveDepsDisable = defineRule<Rule>({
  id: "no-exhaustive-deps-disable",
  severity: "warn",
  tags: ["test-noise"],
  recommendation:
    "Remove the `react-hooks/exhaustive-deps` disable and fix the dependency list or refactor the hook so it no longer captures changing values.",
  create: (context: RuleContext) => {
    let sawRelevantHook = false;
    let didReport = false;

    const report = (node: EsTreeNode): void => {
      if (didReport) return;
      didReport = true;
      context.report({
        node,
        message:
          "Do not disable `react-hooks/exhaustive-deps` on React Hooks — fix the dependency array or refactor the hook instead",
      });
    };

    return {
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        if (!isHookCall(node, HOOKS_WITH_DEPS)) return;
        sawRelevantHook = true;
        if (didReport) return;
        if (hasDisableExhaustiveDepsCommentInAncestors(node)) report(node);
      },
      "Program:exit"(programNode: EsTreeNodeOfType<"Program">) {
        if (didReport || !sawRelevantHook) return;
        if (hasDisableExhaustiveDepsComment(programNode)) report(programNode);
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
