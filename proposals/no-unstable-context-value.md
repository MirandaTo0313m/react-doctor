# Proposal: `react-doctor/no-unstable-context-value`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                  |
| --------------------------- | -------------------------------- |
| Category                    | `performance`                    |
| Severity                    | `warn`                           |
| Source cluster              | `NEW::no-unstable-context-value` |
| Independent draft proposals | 1                                |
| Backing evidence units      | 1                                |

## Why the bug exists

> The developer assumed that recreating an equivalent object for a Context provider was harmless. React compares context values by reference, so a new object identity invalidates every consumer even when the contained fields did not meaningfully change.

## Generality check

> Any React app that passes objects, arrays, functions, or class instances through Context can trigger avoidable consumer rerenders by constructing the provider value inline. This pattern is independent of the component library, platform, or business domain.

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. Pipeline:

```
OSS repo -> Vercel Sandbox miner -> EvidenceUnit -> DraftAgent (LLM, gpt-5.5, xhigh reasoning) -> RuleDedupe -> THIS PR
```

### Backing evidence

- [`GeekyAnts/NativeBase` - `src/components/primitives/Checkbox/CheckboxGroup.tsx` (FixCommitMeta)](https://github.com/GeekyAnts/NativeBase/commit/ffbc6023565485d99734383d2c575aaa72d7f767)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Verify that the JSX element is a real React Context provider and that the `value` expression creates a new object, array, function, class instance, or JSX node during render. Two common false positives are a custom component exposed as `.Provider` that is not React Context, and code intentionally using a fresh value as a per-render invalidation token for all consumers.

## Fix prompt

> Make the provider value stable across renders unless one of its actual dependencies changes. For example: `const contextValue = useMemo(() => ({ value, setValue }), [value, setValue]); return <Context.Provider value={contextValue} />;`. If the value never depends on props or state, hoist it outside the component instead.

## Positive fixture (SHOULD trigger)

```tsx
import { createContext, useState } from "react";

const Context = createContext(null);

export function Component() {
  const [value, setValue] = useState("");
  return <Context.Provider value={{ value, setValue }} />;
}
```

## Negative fixture (should NOT trigger)

```tsx
import { createContext, useMemo, useState } from "react";

const Context = createContext(null);

export function Component() {
  const [value, setValue] = useState("");
  const contextValue = useMemo(() => ({ value, setValue }), [value, setValue]);
  return <Context.Provider value={contextValue} />;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/performance/no-unstable-context-value.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isAstNode } from "../../utils/is-ast-node.js";
import { isInsideFunctionScope } from "../../utils/is-inside-function-scope.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { stripParenExpression } from "../../utils/strip-paren-expression.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const MESSAGE =
  "Context Provider `value` prop is constructed during render; memoize it with `useMemo`/`useCallback` or hoist a stable value to avoid re-rendering every consumer.";

const isConstructedContextValue = (expression: unknown): boolean => {
  if (!isAstNode(expression)) return false;

  const strippedExpression = stripParenExpression(expression);

  if (
    isNodeOfType(strippedExpression, "ObjectExpression") ||
    isNodeOfType(strippedExpression, "ArrayExpression") ||
    isNodeOfType(strippedExpression, "ArrowFunctionExpression") ||
    isNodeOfType(strippedExpression, "FunctionExpression") ||
    isNodeOfType(strippedExpression, "ClassExpression") ||
    isNodeOfType(strippedExpression, "NewExpression") ||
    isNodeOfType(strippedExpression, "JSXElement") ||
    isNodeOfType(strippedExpression, "JSXFragment")
  ) {
    return true;
  }

  if (isNodeOfType(strippedExpression, "ConditionalExpression")) {
    return (
      isConstructedContextValue(strippedExpression.consequent) ||
      isConstructedContextValue(strippedExpression.alternate)
    );
  }

  if (isNodeOfType(strippedExpression, "LogicalExpression")) {
    return (
      isConstructedContextValue(strippedExpression.left) ||
      isConstructedContextValue(strippedExpression.right)
    );
  }

  if (isNodeOfType(strippedExpression, "SequenceExpression")) {
    return isConstructedContextValue(strippedExpression.expressions.at(-1));
  }

  return false;
};

const isContextProviderName = (name: EsTreeNodeOfType<"JSXOpeningElement">["name"]): boolean => {
  if (!isNodeOfType(name, "JSXMemberExpression")) return false;
  return name.property.name === "Provider";
};

export const noUnstableContextValue = defineRule<Rule>({
  id: "no-unstable-context-value",
  tags: ["react-jsx-only", "test-noise"],
  severity: "warn",
  category: "Performance",
  recommendation:
    "Memoize context provider values with `useMemo`/`useCallback`, or hoist static values outside render.",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      if (!isContextProviderName(node.name)) return;
      if (!isInsideFunctionScope(node)) return;

      for (const attribute of node.attributes) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        if (attribute.name.name !== "value") continue;

        const attributeValue = attribute.value;
        if (!isNodeOfType(attributeValue, "JSXExpressionContainer")) continue;
        if (!isConstructedContextValue(attributeValue.expression)) continue;

        context.report({ node: attribute, message: MESSAGE });
      }
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (v2 prompt: WHY-reasoning + generality check + explicit abstain). See [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline. Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only.
</sub>
