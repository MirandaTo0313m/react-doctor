# Proposal: `react-doctor/no-class-method-jsx-handler`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                    |
| --------------------------- | ---------------------------------- |
| Category                    | `architecture`                     |
| Severity                    | `warn`                             |
| Source clusters             | `NEW::no-class-method-jsx-handler` |
| Independent draft proposals | 1                                  |
| Backing evidence units      | 1                                  |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/components/completion-modal.tsx` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/1837c2c6699277b1b2a1597f95a71171efdc9519)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the JSX prop is using a React class component prototype method, not a class-field arrow or a non-React helper class. Typical false positives are legacy components that intentionally keep handlers as bound class methods, and any `this.props.onX` or `this.state` access, which are not this rule's target. Treat already-bound class methods as borderline: they are runtime-safe, but still a strong hint that the component should be modernized.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Replace the class-method callback with a hook-based handler, or if you must keep the class, move it to a class-field arrow so the reference is already bound. Example:

```tsx
function Foo({ isOpen, close }: Props) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") close();
    },
    [close],
  );

  return <Modal onKeyDown={isOpen ? handleKeyDown : undefined} />;
}
```

## Positive fixture (SHOULD trigger)

```tsx
import React from "react";

class Foo extends React.Component {
  handleKeyDown(e: React.KeyboardEvent) {}

  render() {
    return <div onKeyDown={this.handleKeyDown} />;
  }
}
```

## Negative fixture (should NOT trigger)

```tsx
import React from "react";

class Foo extends React.Component {
  handleKeyDown = (e: React.KeyboardEvent) => {};

  render() {
    return <div onKeyDown={this.handleKeyDown} />;
  }
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/architecture/no-class-method-jsx-handler.ts`:

```ts
import { REACT_HANDLER_PROP_PATTERN } from "../../constants/react.js";
import { defineRule } from "../../utils/define-rule.js";
import { getJsxAttributeName } from "../../utils/get-jsx-attribute-name.js";
import { getParentComponent } from "../../utils/get-parent-component.js";
import { isEs6Component } from "../../utils/is-es6-component.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface ClassMemberNames {
  methodNames: Set<string>;
  safePropertyNames: Set<string>;
}

const isClassNode = (
  node: EsTreeNode,
): node is EsTreeNodeOfType<"ClassDeclaration" | "ClassExpression"> =>
  isNodeOfType(node, "ClassDeclaration") || isNodeOfType(node, "ClassExpression");

const getClassMemberNames = (classNode: EsTreeNode): ClassMemberNames => {
  const methodNames = new Set<string>();
  const safePropertyNames = new Set<string>();

  if (!isClassNode(classNode)) return { methodNames, safePropertyNames };

  for (const member of classNode.body.body ?? []) {
    if (
      isNodeOfType(member, "MethodDefinition") &&
      !member.static &&
      isNodeOfType(member.key, "Identifier")
    ) {
      methodNames.add(member.key.name);
      continue;
    }

    if (
      isNodeOfType(member, "PropertyDefinition") &&
      !member.static &&
      isNodeOfType(member.key, "Identifier")
    ) {
      const initializer = member.value;
      if (
        isNodeOfType(initializer, "ArrowFunctionExpression") ||
        isNodeOfType(initializer, "FunctionExpression")
      ) {
        safePropertyNames.add(member.key.name);
      }
    }
  }

  return { methodNames, safePropertyNames };
};

const isNestedThroughFunctionOrBind = (node: EsTreeNode, root: EsTreeNode): boolean => {
  let ancestor = node.parent;
  while (ancestor && ancestor !== root) {
    if (
      isNodeOfType(ancestor, "ArrowFunctionExpression") ||
      isNodeOfType(ancestor, "FunctionExpression")
    ) {
      return true;
    }
    if (
      isNodeOfType(ancestor, "CallExpression") &&
      isNodeOfType(ancestor.callee, "MemberExpression") &&
      isNodeOfType(ancestor.callee.property, "Identifier") &&
      ancestor.callee.property.name === "bind"
    ) {
      return true;
    }
    ancestor = ancestor.parent ?? null;
  }
  return false;
};

const findThisMethodReference = (
  expression: EsTreeNode,
  safePropertyNames: ReadonlySet<string>,
): string | null => {
  let methodName: string | null = null;

  walkAst(expression, (child: EsTreeNode) => {
    if (methodName !== null) return false;
    if (!isNodeOfType(child, "MemberExpression")) return;
    if (!isNodeOfType(child.object, "ThisExpression")) return;
    if (!isNodeOfType(child.property, "Identifier")) return;
    if (child.property.name === "props" || child.property.name === "state") return;
    if (safePropertyNames.has(child.property.name)) return;
    if (isNestedThroughFunctionOrBind(child, expression)) return;
    methodName = child.property.name;
  });

  return methodName;
};

export const noClassMethodJsxHandler = defineRule<Rule>({
  id: "no-class-method-jsx-handler",
  severity: "warn",
  category: "Architecture",
  recommendation:
    "Move the handler into a function component with `useCallback`, or make it a class-field arrow if you must stay on classes.",
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      const propName = getJsxAttributeName(node.name as EsTreeNode);
      if (!propName || !REACT_HANDLER_PROP_PATTERN.test(propName)) return;

      const value = node.value;
      if (!value || !isNodeOfType(value, "JSXExpressionContainer")) return;

      const expression = value.expression;
      if (isNodeOfType(expression, "JSXEmptyExpression")) return;

      const enclosingComponent = getParentComponent(node);
      if (
        !enclosingComponent ||
        !isClassNode(enclosingComponent) ||
        !isEs6Component(enclosingComponent)
      ) {
        return;
      }

      const { methodNames, safePropertyNames } = getClassMemberNames(enclosingComponent);
      const methodName = findThisMethodReference(expression, safePropertyNames);
      if (methodName === null || !methodNames.has(methodName)) return;

      context.report({
        node,
        message: `Class method "${methodName}" is passed directly to "${propName}" — convert the component to hooks or use a class-field arrow handler.`,
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
