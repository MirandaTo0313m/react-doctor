# Proposal: `react-doctor/fieldsets-with-code-must-scroll`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                        |
| --------------------------- | -------------------------------------- |
| Category                    | `react-ui`                             |
| Severity                    | `warn`                                 |
| Source clusters             | `NEW::fieldsets-with-code-must-scroll` |
| Independent draft proposals | 1                                      |
| Backing evidence units      | 1                                      |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/components/multiple-choice-questions.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/60e54a5e1df35475b435923be98e35346f0c0bc3)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Use this when a `<fieldset>` is acting as the wrapper for code-like content (`<pre>`, `<code>`, `PrismFormatted`) and there is no explicit scrollable class on the fieldset. Ignore normal form fieldsets, fieldsets whose scrolling is applied by an outer wrapper, and cases where the content is short enough that it cannot overflow on mobile. Also ignore code blocks that are already inside a dedicated horizontal-scrolling container.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Add a dedicated class to the `fieldset` so the whole block can scroll horizontally on narrow screens. For example:

```tsx
<fieldset className="mcq-fieldset">
  <legend>
    <PrismFormatted text={question.text} />
  </legend>
</fieldset>
```

Then make sure that class applies `overflow-x: auto` (or an equivalent scroll container style).

## Positive fixture (SHOULD trigger)

```tsx
export function Example() {
  return (
    <fieldset>
      <legend>
        <PrismFormatted text="const veryLongLine = 'this-is-a-really-long-string-that-overflows-on-mobile';" />
      </legend>
    </fieldset>
  );
}
```

## Negative fixture (should NOT trigger)

```tsx
export function Example() {
  return (
    <fieldset className="mcq-fieldset">
      <legend>
        <PrismFormatted text="const veryLongLine = 'this-is-a-really-long-string-that-overflows-on-mobile';" />
      </legend>
    </fieldset>
  );
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/react-ui/fieldsets-with-code-must-scroll.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { findJsxAttribute } from "../../utils/find-jsx-attribute.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { walkAst } from "../../utils/walk-ast.js";
import { getOpeningElementTagName } from "./utils/get-opening-element-tag-name.js";

const CODE_LIKE_TAG_NAMES = new Set(["pre", "code", "PrismFormatted"]);

const hasCodeLikeDescendant = (jsxElementNode: EsTreeNodeOfType<"JSXElement">): boolean => {
  let hasCodeLikeNode = false;
  walkAst(jsxElementNode, (child: EsTreeNode) => {
    if (hasCodeLikeNode) return false;
    if (!isNodeOfType(child, "JSXOpeningElement")) return;
    const tagName = getOpeningElementTagName(child);
    if (!tagName || !CODE_LIKE_TAG_NAMES.has(tagName)) return;
    hasCodeLikeNode = true;
    return false;
  });
  return hasCodeLikeNode;
};

export const fieldsetsWithCodeMustScroll = defineRule<Rule>({
  id: "fieldsets-with-code-must-scroll",
  severity: "warn",
  tags: ["react-jsx-only"],
  category: "Architecture",
  recommendation:
    "Give the fieldset a class that applies `overflow-x: auto` (or wrap the code in a dedicated scroll container) so long lines can scroll on mobile.",
  create: (context: RuleContext) => ({
    JSXElement(node: EsTreeNodeOfType<"JSXElement">) {
      const tagName = getOpeningElementTagName(node.openingElement);
      if (tagName !== "fieldset") return;

      const classNameAttribute = findJsxAttribute(
        node.openingElement.attributes ?? [],
        "className",
      );
      if (classNameAttribute) return;

      if (!hasCodeLikeDescendant(node)) return;

      context.report({
        node: node.openingElement,
        message:
          "`<fieldset>` contains code-like content but has no dedicated scroll class — add a wrapper that enables horizontal scrolling on narrow screens",
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
