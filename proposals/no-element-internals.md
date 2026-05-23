# Proposal: `react-doctor/no-element-internals`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                             |
| --------------------------- | --------------------------- |
| Category                    | `correctness`               |
| Severity                    | `warn`                      |
| Source cluster              | `NEW::no-element-internals` |
| Independent draft proposals | 1                           |
| Backing evidence units      | 1                           |

## Why the bug exists

> The developer assumed React elements always expose the same internal fields in every React version and build. React element object shapes can differ between development, production, and major versions, so a hand-rolled detector can reject valid elements.

## Generality check

> Many React apps and libraries accept unknown renderable values and try to distinguish React elements from plain data. Any codebase that performs this check by inspecting private element fields can break when React changes its internal element representation.

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. Pipeline:

```
OSS repo -> Vercel Sandbox miner -> EvidenceUnit -> DraftAgent (LLM, gpt-5.5, xhigh reasoning) -> RuleDedupe -> THIS PR
```

### Backing evidence

- [`alibaba/formily` - `packages/json-schema/src/__tests__/shared.spec.ts` (FixCommitMeta)](https://github.com/alibaba/formily/commit/2a474a6d32b685b3a4721bfee4964ae6d0c747d7)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the code is trying to identify or mock React elements by reading fields such as `$$typeof`, `_owner`, or `Symbol.for("react.element")`; those fields are not a stable public API. Typical false positives are code inside React or a renderer/compat package implementing element semantics, and snapshot/test fixtures that intentionally assert serialized element internals. Dismiss the finding if the same property names belong to an unrelated wire format rather than a React element check.

## Fix prompt

> Use `React.isValidElement(value)` instead of reading element object fields, and treat element objects as opaque. If you need to render or pass through the value, branch on the public check. Example:

```tsx
if (React.isValidElement(value)) {
  return value;
}
return null;
```

## Positive fixture (SHOULD trigger)

```tsx
import React from "react";

export function Component({ value }) {
  if (value && "$$typeof" in value && "_owner" in value) {
    return <div />;
  }
  return null;
}
```

## Negative fixture (should NOT trigger)

```tsx
import React from "react";

export function Component({ value }) {
  if (React.isValidElement(value)) {
    return value;
  }
  return null;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-element-internals.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const INTERNAL_ELEMENT_FIELD_NAMES = new Set<string>([
  "$$typeof",
  "_owner",
  "_store",
  "_self",
  "_source",
  "_debugOwner",
  "_debugInfo",
  "_debugStack",
  "_debugTask",
]);

const ELEMENT_SYMBOL_NAMES = new Set<string>(["react.element", "react.transitional.element"]);

const getStaticString = (node: EsTreeNode | null | undefined): string | null => {
  if (!node) return null;
  if (isNodeOfType(node, "Literal") && typeof node.value === "string") return node.value;
  if (!isNodeOfType(node, "TemplateLiteral")) return null;

  const expressions = node.expressions ?? [];
  if (expressions.length > 0) return null;

  const quasi = node.quasis?.[0];
  if (!quasi) return null;
  return typeof quasi.value.cooked === "string" ? quasi.value.cooked : quasi.value.raw;
};

const getStaticMemberPropertyName = (node: EsTreeNodeOfType<"MemberExpression">): string | null => {
  if (node.computed) return getStaticString(node.property);
  if (isNodeOfType(node.property, "Identifier")) return node.property.name;
  return null;
};

const getStaticPropertyKeyName = (node: EsTreeNodeOfType<"Property">): string | null => {
  if (node.computed) return getStaticString(node.key);
  if (isNodeOfType(node.key, "Identifier")) return node.key.name;
  return getStaticString(node.key);
};

const isInternalElementFieldName = (propertyName: string | null): propertyName is string =>
  Boolean(propertyName && INTERNAL_ELEMENT_FIELD_NAMES.has(propertyName));

const isElementSymbolLookup = (node: EsTreeNodeOfType<"CallExpression">): boolean => {
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "Identifier") || node.callee.object.name !== "Symbol") {
    return false;
  }
  if (getStaticMemberPropertyName(node.callee) !== "for") return false;
  return ELEMENT_SYMBOL_NAMES.has(getStaticString(node.arguments?.[0]) ?? "");
};

const reportInternalField = (
  context: RuleContext,
  node: EsTreeNode,
  propertyName: string,
): void => {
  context.report({
    node,
    message: `Do not inspect React element internal field \`${propertyName}\` — use React.isValidElement(value) instead`,
  });
};

export const noElementInternals = defineRule<Rule>({
  id: "no-element-internals",
  severity: "warn",
  recommendation:
    "Treat React element objects as opaque and use React.isValidElement(value) instead of checking $$typeof, _owner, or React element symbols",
  create: (context: RuleContext) => ({
    MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
      const propertyName = getStaticMemberPropertyName(node);
      if (!isInternalElementFieldName(propertyName)) return;
      reportInternalField(context, node, propertyName);
    },
    BinaryExpression(node: EsTreeNodeOfType<"BinaryExpression">) {
      if (node.operator !== "in") return;
      const propertyName = getStaticString(node.left);
      if (!isInternalElementFieldName(propertyName)) return;
      reportInternalField(context, node, propertyName);
    },
    Property(node: EsTreeNodeOfType<"Property">) {
      const propertyName = getStaticPropertyKeyName(node);
      if (!isInternalElementFieldName(propertyName)) return;
      reportInternalField(context, node, propertyName);
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isElementSymbolLookup(node)) return;
      context.report({
        node,
        message:
          "Do not compare against React element symbols directly — use React.isValidElement(value) instead",
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (v2 prompt: WHY-reasoning + generality check + explicit abstain). See [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline. Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only.
</sub>
