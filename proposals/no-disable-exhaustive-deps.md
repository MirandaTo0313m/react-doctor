# Proposal: `react-doctor/no-disable-exhaustive-deps`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                   |
| --------------------------- | --------------------------------- |
| Category                    | `state-and-effects`               |
| Severity                    | `warn`                            |
| Source clusters             | `NEW::no-disable-exhaustive-deps` |
| Independent draft proposals | 2                                 |
| Backing evidence units      | 2                                 |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/components/completion-modal.tsx` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/1837c2c6699277b1b2a1597f95a71171efdc9519)
- [`facebook/react` — `fixtures/eslint-v10/index.js` (DisableChurnMeta)](https://github.com/facebook/react/commit/e8c6362678c8bc86a02b8444d2c3f597b3dc4e22)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Treat this as a real suppression only when the file contains a React hook with a dependency array and the comment actually disables `react-hooks/exhaustive-deps`. Typical false positives are test fixtures, codemods, generated files, or temporary migration code where the disable is clearly deliberate and isolated. If the effect already uses refs, memoized callbacks, or an Effect Event pattern, the comment may be stale rather than a bug.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Remove the suppression and make the effect self-consistent. If a value should not be reactive, move that logic into a ref or cleanup instead of silencing the rule. For example:

```tsx
useEffect(() => {
  const url = URL.createObjectURL(blob);
  setDownloadURL(url);
  return () => URL.revokeObjectURL(url);
}, [blob]);
```

## Positive fixture (SHOULD trigger)

```tsx
import { useEffect } from "react";

export function Example({ value }) {
  useEffect(() => {
    console.log(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useEffect } from "react";

export function Example({ value }) {
  useEffect(() => {
    console.log(value);
  }, [value]);

  return null;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/state-and-effects/no-disable-exhaustive-deps.ts`:

```ts
import { HOOKS_WITH_DEPS } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";

interface CommentLike {
  value: string;
}

interface SourceCodeLike {
  getAllComments: () => ReadonlyArray<CommentLike>;
}

interface CommentAwareRuleContext extends RuleContext {
  sourceCode?: SourceCodeLike;
}

const EXHAUSTIVE_DEPS_RULE_NAME = "react-hooks/exhaustive-deps";
const DISABLE_DIRECTIVE_PATTERN = /(?:eslint|oxlint)-disable(?:-next-line|-line)?/;

const hasHookWithDepsCall = (programNode: EsTreeNode): boolean => {
  let didFindHookWithDeps = false;

  walkAst(programNode, (child: EsTreeNode) => {
    if (didFindHookWithDeps) return false;
    if (!isNodeOfType(child, "CallExpression")) return;
    if (!isHookCall(child, HOOKS_WITH_DEPS)) return;
    if (child.arguments.length < 2) return;
    if (!isNodeOfType(child.arguments[1], "ArrayExpression")) return;

    didFindHookWithDeps = true;
    return false;
  });

  return didFindHookWithDeps;
};

const getProgramComments = (
  context: RuleContext,
  programNode: EsTreeNode,
): ReadonlyArray<CommentLike> => {
  const sourceCode = (context as CommentAwareRuleContext).sourceCode;
  if (sourceCode?.getAllComments) return sourceCode.getAllComments();

  const programComments = (programNode as EsTreeNode & { comments?: ReadonlyArray<CommentLike> })
    .comments;
  return programComments ?? [];
};

const isExhaustiveDepsDisableComment = (commentValue: string): boolean =>
  DISABLE_DIRECTIVE_PATTERN.test(commentValue) && commentValue.includes(EXHAUSTIVE_DEPS_RULE_NAME);

export const noDisableExhaustiveDeps = defineRule<Rule>({
  id: "no-disable-exhaustive-deps",
  tags: ["test-noise"],
  severity: "warn",
  recommendation:
    "Make the hook dependency list accurate instead of suppressing react-hooks/exhaustive-deps. If a value should not be reactive, move it behind a ref, memo, or Effect Event; otherwise include it and let the effect re-run when it changes.",
  create: (context: RuleContext) => ({
    Program(programNode: EsTreeNodeOfType<"Program">) {
      if (!hasHookWithDepsCall(programNode)) return;

      for (const comment of getProgramComments(context, programNode)) {
        if (!isExhaustiveDepsDisableComment(comment.value)) continue;
        context.report({
          node: programNode,
          message:
            "Do not disable react-hooks/exhaustive-deps — fix the hook dependencies or refactor the effect instead",
        });
        return;
      }
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
