# Proposal: `react-doctor/no-unsafe-mock-member-access`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                     |
| --------------------------- | ----------------------------------- |
| Category                    | `correctness`                       |
| Severity                    | `warn`                              |
| Source clusters             | `NEW::no-unsafe-mock-member-access` |
| Independent draft proposals | 1                                   |
| Backing evidence units      | 1                                   |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `api/src/routes/protected/socrates.test.ts` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/2906599befba604e893e6b8717fb8d955737c083)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Check whether the property access is on a value that came from `mock.calls` or `mock.results`, not on an already-typed object. Common false positives are harmless reads like `mock.calls.length`, direct tuple indexing (`mock.calls[0]`), or code that explicitly types the mock tuple with `vi.fn<...>()` or narrows it with a guard before dereferencing.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Don’t suppress `no-unsafe-member-access`; type the mocked call tuple or narrow it first. For example:

```ts
const mockedFetch = vi.fn<Promise<Response>, [RequestInfo, RequestInit?]>();
const firstCall = mockedFetch.mock.calls[0];
const requestInit = firstCall?.[1];
if (requestInit && typeof requestInit === "object") {
  const body = requestInit.body;
}
```

If the shape is known, prefer a typed tuple or interface so the property access is safe without a disable comment.

## Positive fixture (SHOULD trigger)

```tsx
import { vi } from "vitest";

const mockedFetch = vi.fn();

export function Example() {
  const firstCall = mockedFetch.mock.calls[0]!;
  const body = firstCall[1].body;
  return <div>{body}</div>;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { vi } from "vitest";

const mockedFetch = vi.fn();

export function Example() {
  return <div>{mockedFetch.mock.calls.length}</div>;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-unsafe-mock-member-access.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { findVariableInitializer } from "../../utils/find-variable-initializer.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { stripParenExpression } from "../../utils/strip-paren-expression.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const MOCK_COLLECTION_NAMES: ReadonlySet<string> = new Set(["calls", "results"]);
const MOCK_OBJECT_PROPERTY_NAME = "mock";

const isMockCollectionMemberExpression = (node: EsTreeNode): boolean => {
  const stripped = stripParenExpression(node);
  if (!isNodeOfType(stripped, "MemberExpression")) return false;
  if (!isNodeOfType(stripped.property, "Identifier")) return false;
  if (!MOCK_COLLECTION_NAMES.has(stripped.property.name)) return false;
  if (!isNodeOfType(stripped.object, "MemberExpression")) return false;
  if (!isNodeOfType(stripped.object.property, "Identifier")) return false;
  return stripped.object.property.name === MOCK_OBJECT_PROPERTY_NAME;
};

const resolveBindingInitializer = (node: EsTreeNode): EsTreeNode | null => {
  const stripped = stripParenExpression(node);
  if (!isNodeOfType(stripped, "Identifier")) return null;
  const binding = findVariableInitializer(stripped, stripped.name);
  return binding?.initializer ?? null;
};

const isMockTupleExpression = (node: EsTreeNode): boolean => {
  const stripped = stripParenExpression(node);
  if (isMockCollectionMemberExpression(stripped)) return false;

  if (isNodeOfType(stripped, "Identifier")) {
    const initializer = resolveBindingInitializer(stripped);
    if (!initializer) return false;
    return isMockTupleExpression(initializer);
  }

  if (isNodeOfType(stripped, "MemberExpression")) {
    if (stripped.computed && isMockCollectionMemberExpression(stripped.object)) return true;
    return isMockTupleExpression(stripped.object);
  }

  return false;
};

const isUnsafeMockTuplePropertyAccess = (node: EsTreeNodeOfType<"MemberExpression">): boolean => {
  if (node.computed) return false;
  if (!isNodeOfType(node.property, "Identifier")) return false;
  return isMockTupleExpression(node.object);
};

export const noUnsafeMockMemberAccess = defineRule<Rule>({
  id: "no-unsafe-mock-member-access",
  severity: "warn",
  recommendation:
    "Type the mocked call tuple before dereferencing it, or narrow it with a guard and destructure the value into a typed variable.",
  create: (context: RuleContext) => ({
    MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
      if (!isUnsafeMockTuplePropertyAccess(node)) return;
      context.report({
        node,
        message:
          "Property access on a value derived from `mock.calls`/`mock.results` — narrow the tuple before reading object fields.",
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
