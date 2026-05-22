# Proposal: `react-doctor/no-unlocked-submit-callback`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                    |
| --------------------------- | ---------------------------------- |
| Category                    | `correctness`                      |
| Severity                    | `warn`                             |
| Source clusters             | `NEW::no-unlocked-submit-callback` |
| Independent draft proposals | 1                                  |
| Backing evidence units      | 1                                  |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/utils/fetch-all-curriculum-data.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ec06a99fdb3d7f21f292da9bc2882832f96d7692)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the returned callback can be invoked repeatedly before the previous submission finishes and that duplicate requests would be harmful. Ignore idempotent fire-and-forget actions, handlers already serialized by a disabled control or external queue, and callbacks that use another lock/debounce wrapper outside this snippet. If the submit path is already protected by a separate in-flight flag, do not treat this as a bug.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Guard the submit callback with a lock or debounce so a second click cannot dispatch the action twice. If the work is async, release the lock in `finally` or after the debounce window.

```tsx
const isSubmitLockedRef = useRef(false);
return () => {
  if (isSubmitLockedRef.current) return;
  isSubmitLockedRef.current = true;
  try {
    dispatch(submitChallenge());
  } finally {
    setTimeout(() => {
      isSubmitLockedRef.current = false;
    }, 1000);
  }
};
```

## Positive fixture (SHOULD trigger)

```tsx
import { useDispatch } from "react-redux";

function useSubmit() {
  const dispatch = useDispatch();
  return () => dispatch(submitChallenge());
}
```

## Negative fixture (should NOT trigger)

```tsx
import { useDispatch } from "react-redux";
import { useRef } from "react";

function useSubmit() {
  const dispatch = useDispatch();
  const isSubmitLockedRef = useRef(false);
  return () => {
    if (isSubmitLockedRef.current) return;
    isSubmitLockedRef.current = true;
    setTimeout(() => {
      isSubmitLockedRef.current = false;
    }, 1000);
    dispatch(submitChallenge());
  };
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-unlocked-submit-callback.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { isReactComponentOrHookName } from "../../utils/is-react-component-or-hook-name.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { walkAst } from "../../utils/walk-ast.js";

const SUBMIT_ACTION_NAME_PATTERN = /^(?:submit|save|send|post|register|checkout|commit)$/i;
const LOCK_LIKE_IDENTIFIER_PATTERN = /(Submitting|Locked|Busy|Pending|InFlight|Debounc(?:e|ing))/i;
const SUBMIT_CALLBACK_MESSAGE =
  "Returned submit callback can be re-entered before the first submission finishes - add a lock or debounce guard before dispatching the submit action";

const isFunctionNode = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "ArrowFunctionExpression") ||
  isNodeOfType(node, "FunctionExpression") ||
  isNodeOfType(node, "FunctionDeclaration");

const isSubmitLikeCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (isNodeOfType(callee, "Identifier")) {
    if (callee.name === "dispatch") {
      const firstArgument = node.arguments?.[0];
      return Boolean(firstArgument && isSubmitLikeCall(firstArgument));
    }
    return SUBMIT_ACTION_NAME_PATTERN.test(callee.name);
  }
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
    return SUBMIT_ACTION_NAME_PATTERN.test(callee.property.name);
  }
  return false;
};

const containsLockLikeIdentifier = (node: EsTreeNode): boolean => {
  let foundLockLikeIdentifier = false;
  walkAst(node, (child: EsTreeNode) => {
    if (foundLockLikeIdentifier) return false;
    if (!isNodeOfType(child, "Identifier")) return;
    if (LOCK_LIKE_IDENTIFIER_PATTERN.test(child.name)) foundLockLikeIdentifier = true;
  });
  return foundLockLikeIdentifier;
};

const isEarlyReturnGuard = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "IfStatement")) return false;
  if (node.alternate) return false;
  if (isNodeOfType(node.consequent, "ReturnStatement")) return true;
  if (!isNodeOfType(node.consequent, "BlockStatement")) return false;
  return (node.consequent.body ?? []).some((statement) =>
    isNodeOfType(statement, "ReturnStatement"),
  );
};

const functionContainsUnprotectedSubmitCall = (functionNode: EsTreeNode): boolean => {
  if (!isFunctionNode(functionNode)) return false;
  const body = functionNode.body;
  let hasSubmitLikeCall = false;
  let hasLockGuard = false;
  walkAst(body, (child: EsTreeNode) => {
    if (hasSubmitLikeCall && hasLockGuard) return false;
    if (isFunctionNode(child)) return false;
    if (!hasLockGuard && isEarlyReturnGuard(child) && containsLockLikeIdentifier(child.test)) {
      hasLockGuard = true;
    }
    if (!hasSubmitLikeCall && isSubmitLikeCall(child)) {
      hasSubmitLikeCall = true;
    }
  });
  return hasSubmitLikeCall && !hasLockGuard;
};

const collectInlineFunctionArgs = (callExpression: EsTreeNode): EsTreeNode[] => {
  const candidateFunctions: EsTreeNode[] = [];
  if (!isNodeOfType(callExpression, "CallExpression")) return candidateFunctions;
  for (const argument of callExpression.arguments ?? []) {
    if (argument && isFunctionNode(argument)) candidateFunctions.push(argument);
  }
  return candidateFunctions;
};

const reportIfUnprotectedSubmitCallback = (
  candidateFunction: EsTreeNode,
  context: RuleContext,
): void => {
  if (!functionContainsUnprotectedSubmitCall(candidateFunction)) return;
  context.report({
    node: candidateFunction,
    message: SUBMIT_CALLBACK_MESSAGE,
  });
};

const checkReturnedValue = (returnedValue: EsTreeNode, context: RuleContext): void => {
  if (isFunctionNode(returnedValue)) {
    reportIfUnprotectedSubmitCallback(returnedValue, context);
    return;
  }
  if (!isNodeOfType(returnedValue, "CallExpression")) return;
  for (const inlineFunction of collectInlineFunctionArgs(returnedValue)) {
    reportIfUnprotectedSubmitCallback(inlineFunction, context);
  }
};

const checkFunctionContainer = (functionNode: EsTreeNode, context: RuleContext): void => {
  if (!isFunctionNode(functionNode)) return;

  if (isNodeOfType(functionNode.body, "BlockStatement")) {
    for (const statement of functionNode.body.body ?? []) {
      if (!isNodeOfType(statement, "ReturnStatement")) continue;
      if (!statement.argument) continue;
      checkReturnedValue(statement.argument, context);
    }
    return;
  }

  if (isNodeOfType(functionNode.body, "CallExpression")) {
    const inlineFunctions = collectInlineFunctionArgs(functionNode.body);
    if (inlineFunctions.length > 0) {
      for (const inlineFunction of inlineFunctions) {
        reportIfUnprotectedSubmitCallback(inlineFunction, context);
      }
      return;
    }
  }

  reportIfUnprotectedSubmitCallback(functionNode, context);
};

const isReactFunctionDeclarator = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "VariableDeclarator") &&
  isNodeOfType(node.id, "Identifier") &&
  isReactComponentOrHookName(node.id.name) &&
  Boolean(node.init) &&
  (isNodeOfType(node.init, "ArrowFunctionExpression") ||
    isNodeOfType(node.init, "FunctionExpression"));

export const noUnlockedSubmitCallback = defineRule<Rule>({
  id: "no-unlocked-submit-callback",
  tags: ["test-noise"],
  severity: "warn",
  recommendation:
    "Add a lock or debounce guard before dispatching the submit action so rapid re-entry cannot fire it twice",
  create: (context: RuleContext) => ({
    FunctionDeclaration(node: EsTreeNodeOfType<"FunctionDeclaration">) {
      if (!node.id?.name || !isReactComponentOrHookName(node.id.name)) return;
      checkFunctionContainer(node, context);
    },
    VariableDeclarator(node: EsTreeNodeOfType<"VariableDeclarator">) {
      if (!isReactFunctionDeclarator(node)) return;
      if (!node.init) return;
      checkFunctionContainer(node.init, context);
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
