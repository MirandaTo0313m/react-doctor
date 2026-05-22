# Proposal: `react-doctor/rendering-modal-before-mount`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                     |
| --------------------------- | ----------------------------------- |
| Category                    | `performance`                       |
| Severity                    | `warn`                              |
| Source clusters             | `NEW::rendering-modal-before-mount` |
| Independent draft proposals | 1                                   |
| Backing evidence units      | 1                                   |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/components/mobile-app-modal.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/90cc514f786f3d786cb66ab2fd6fee26d3471a00)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm this only when a modal or similar overlay is shown on the very first client render and there is no client-only mount gate. Ignore modals that open only after user interaction, controlled modals where `open` is not statically true on the initial render, and components already hidden behind `if (!mounted) return null`. Also ignore cases rendered inside a client-only boundary that never hydrates on the server.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Delay the modal until the component has mounted, then render it. A small client-only gate prevents scroll-lock and layout measurements from running before the browser has painted:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
return <Modal open={true} />;
```

If the modal is only meant to appear after a click, keep it closed on the initial render and flip `open` later.

## Positive fixture (SHOULD trigger)

```tsx
import { Modal } from "@freecodecamp/ui";

export const Example = () => <Modal open={true} />;
```

## Negative fixture (should NOT trigger)

```tsx
import { useEffect, useState } from "react";
import { Modal } from "@freecodecamp/ui";

export const Example = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return <Modal open={true} />;
};
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/performance/rendering-modal-before-mount.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { getEffectCallback } from "../../utils/get-effect-callback.js";
import { hasJsxProp } from "../../utils/has-jsx-prop.js";
import { isComponentAssignment } from "../../utils/is-component-assignment.js";
import { isComponentDeclaration } from "../../utils/is-component-declaration.js";
import { isHookCall } from "../../utils/is-hook-call.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface MountedStateBinding {
  stateName: string;
  setterName: string;
}

const MODAL_NAMES = new Set(["Modal"]);

const isNullReturn = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "ReturnStatement") &&
  (!node.argument || (isNodeOfType(node.argument, "Literal") && node.argument.value === null));

const isMountedGuardStatement = (statement: EsTreeNode, stateName: string): boolean => {
  if (!isNodeOfType(statement, "IfStatement")) return false;
  const test = statement.test;
  if (
    !isNodeOfType(test, "UnaryExpression") ||
    test.operator !== "!" ||
    !isNodeOfType(test.argument, "Identifier") ||
    test.argument.name !== stateName
  ) {
    return false;
  }
  if (isNullReturn(statement.consequent)) return true;
  if (!isNodeOfType(statement.consequent, "BlockStatement")) return false;
  const body = statement.consequent.body ?? [];
  const onlyStatement = body[0];
  return body.length === 1 && Boolean(onlyStatement) && isNullReturn(onlyStatement);
};

const collectMountedStateBindings = (componentBody: EsTreeNode): Array<MountedStateBinding> => {
  const bindings: Array<MountedStateBinding> = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return bindings;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
      const elements = declarator.id.elements ?? [];
      const stateBinding = elements[0];
      const setterBinding = elements[1];
      if (
        !stateBinding ||
        !setterBinding ||
        !isNodeOfType(stateBinding, "Identifier") ||
        !isNodeOfType(setterBinding, "Identifier")
      ) {
        continue;
      }
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useState")) continue;
      const initialValue = declarator.init.arguments?.[0] ?? null;
      if (!isNodeOfType(initialValue, "Literal") || initialValue.value !== false) continue;
      bindings.push({ stateName: stateBinding.name, setterName: setterBinding.name });
    }
  }
  return bindings;
};

const hasMountEffect = (componentBody: EsTreeNode, setterName: string): boolean => {
  if (!isNodeOfType(componentBody, "BlockStatement")) return false;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "ExpressionStatement")) continue;
    if (!isNodeOfType(statement.expression, "CallExpression")) continue;
    if (!isHookCall(statement.expression, "useEffect")) continue;
    const deps = statement.expression.arguments?.[1] ?? null;
    if (!isNodeOfType(deps, "ArrayExpression") || (deps.elements?.length ?? 0) !== 0) continue;
    const callback = getEffectCallback(statement.expression);
    if (!callback) continue;
    let didSetTrue = false;
    walkAst(callback, (child: EsTreeNode) => {
      if (!isNodeOfType(child, "CallExpression")) return;
      if (!isNodeOfType(child.callee, "Identifier") || child.callee.name !== setterName) return;
      const firstArgument = child.arguments?.[0] ?? null;
      if (isNodeOfType(firstArgument, "Literal") && firstArgument.value === true) {
        didSetTrue = true;
      }
    });
    if (didSetTrue) return true;
  }
  return false;
};

const hasMountedGate = (componentBody: EsTreeNode): boolean => {
  const mountedStateBindings = collectMountedStateBindings(componentBody);
  for (const binding of mountedStateBindings) {
    if (!hasMountEffect(componentBody, binding.setterName)) continue;
    if (!isNodeOfType(componentBody, "BlockStatement")) continue;
    for (const statement of componentBody.body ?? []) {
      if (isMountedGuardStatement(statement, binding.stateName)) return true;
    }
  }
  return false;
};

const isModalOpenOnFirstRender = (node: EsTreeNodeOfType<"JSXOpeningElement">): boolean => {
  if (!isNodeOfType(node.name, "JSXIdentifier") || !MODAL_NAMES.has(node.name.name)) return false;
  const openAttribute = hasJsxProp(node.attributes ?? [], "open");
  if (!openAttribute) return false;
  if (!openAttribute.value) return true;
  if (isNodeOfType(openAttribute.value, "Literal")) return openAttribute.value.value === true;
  if (
    isNodeOfType(openAttribute.value, "JSXExpressionContainer") &&
    isNodeOfType(openAttribute.value.expression, "Literal")
  ) {
    return openAttribute.value.expression.value === true;
  }
  return false;
};

const checkComponentBody = (
  context: RuleContext,
  componentBody: EsTreeNode | null | undefined,
): void => {
  if (!componentBody) return;
  if (isNodeOfType(componentBody, "BlockStatement") && hasMountedGate(componentBody)) return;
  let modalNode: EsTreeNodeOfType<"JSXOpeningElement"> | null = null;
  walkAst(componentBody, (child: EsTreeNode) => {
    if (modalNode) return false;
    if (!isNodeOfType(child, "JSXOpeningElement")) return;
    if (!isModalOpenOnFirstRender(child)) return;
    modalNode = child;
  });
  if (!modalNode) return;
  context.report({
    node: modalNode,
    message:
      "`Modal open={true}` on the first render can run scroll-lock and layout measurements before the browser has painted. Defer the modal until after mount or open it only after a user action.",
  });
};

export const noModalBeforeMount = defineRule<Rule>({
  id: "rendering-modal-before-mount",
  severity: "warn",
  category: "Performance",
  recommendation:
    "Delay the modal until after a client-only mount check (`useEffect(() => setMounted(true), [])`) or open it only after user interaction.",
  create: (context: RuleContext) => ({
    FunctionDeclaration(node: EsTreeNodeOfType<"FunctionDeclaration">) {
      if (!isComponentDeclaration(node)) return;
      checkComponentBody(context, node.body);
    },
    VariableDeclarator(node: EsTreeNodeOfType<"VariableDeclarator">) {
      if (!isComponentAssignment(node)) return;
      if (
        !isNodeOfType(node.init, "ArrowFunctionExpression") &&
        !isNodeOfType(node.init, "FunctionExpression")
      )
        return;
      checkComponentBody(context, node.init.body);
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
