# Proposal: `react-doctor/no-unchecked-response-json`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                   |
| --------------------------- | --------------------------------- |
| Category                    | `correctness`                     |
| Severity                    | `warn`                            |
| Source cluster              | `NEW::no-unchecked-response-json` |
| Independent draft proposals | 1                                 |
| Backing evidence units      | 1                                 |

## Why the bug exists

> The developer assumed fetch would fail on HTTP error responses and that the body would always be valid JSON. In reality fetch resolves for 4xx/5xx responses, and response.json() can throw before the code can preserve the upstream status or show a useful error.

## Generality check

> React apps commonly fetch data in Server Components, route handlers, actions, and client code. Parsing a fetch Response as JSON before checking ok/status is independent of the API domain and can produce the same crash or misleading 500 in unrelated apps.

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. Pipeline:

```
OSS repo -> Vercel Sandbox miner -> EvidenceUnit -> DraftAgent (LLM, gpt-5.5, xhigh reasoning) -> RuleDedupe -> THIS PR
```

### Backing evidence

- [`JOYCEQL/magic-resume` - `src/app/api/grammar/route.ts` (FixCommitMeta)](https://github.com/JOYCEQL/magic-resume/commit/a6c4aa92879c6e2371cbd4f2aabb207619ab4bea)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the value being parsed is the Response returned by fetch and that .json() is reached before any ok/status guard or equivalent helper has validated the response. Typical false positives include generated API clients where every HTTP status is guaranteed to return JSON, and code where a shared fetch wrapper or assertion helper validates response.ok before the local .json() call.

## Fix prompt

> Check response.ok or response.status before parsing the success payload, and preserve the upstream status for failures. If the body may be empty or non-JSON, read text first and parse JSON in a guarded block. Example:

```ts
const response = await fetch(url);
const raw = await response.text();
if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${raw || response.statusText}`);
}
const data = raw ? JSON.parse(raw) : {};
```

## Positive fixture (SHOULD trigger)

```tsx
export async function Component() {
  const response = await fetch("/api/value");
  const data = await response.json();
  return <div>{data.value}</div>;
}
```

## Negative fixture (should NOT trigger)

```tsx
export async function Component() {
  const response = await fetch("/api/value");
  if (!response.ok) return <div>Error</div>;
  const data = await response.json();
  return <div>{data.value}</div>;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-unchecked-response-json.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface BlockLocation {
  block: EsTreeNodeOfType<"BlockStatement">;
  child: EsTreeNode;
}

const RESPONSE_STATUS_PROPERTIES = new Set(["ok", "status"]);

const isFunctionLike = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "FunctionDeclaration") ||
  isNodeOfType(node, "FunctionExpression") ||
  isNodeOfType(node, "ArrowFunctionExpression");

const isFetchCall = (node: EsTreeNode | null | undefined): boolean => {
  if (!node || !isNodeOfType(node, "CallExpression")) return false;
  return isNodeOfType(node.callee, "Identifier") && node.callee.name === "fetch";
};

const isFetchResponseInitializer = (node: EsTreeNode | null | undefined): boolean => {
  if (!node) return false;
  if (isFetchCall(node)) return true;
  return isNodeOfType(node, "AwaitExpression") && isFetchCall(node.argument);
};

const getStaticMemberName = (node: EsTreeNode): string | null => {
  if (!isNodeOfType(node, "MemberExpression")) return null;
  if (node.computed) return null;
  return isNodeOfType(node.property, "Identifier") ? node.property.name : null;
};

const getJsonCallResponseName = (node: EsTreeNode): string | null => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  const callee = node.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return null;
  if (getStaticMemberName(callee) !== "json") return null;
  return isNodeOfType(callee.object, "Identifier") ? callee.object.name : null;
};

const isJsonCallOnAwaitedFetch = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (getStaticMemberName(callee) !== "json") return false;
  if (!isNodeOfType(callee.object, "AwaitExpression")) return false;
  return isFetchCall(callee.object.argument);
};

const walkStatementWithoutNestedScopes = (
  node: EsTreeNode,
  visitor: (child: EsTreeNode) => boolean | void,
): void => {
  walkAst(node, (child: EsTreeNode) => {
    if (child !== node && (isFunctionLike(child) || isNodeOfType(child, "BlockStatement"))) {
      return false;
    }
    return visitor(child);
  });
};

const statementInitializesFetchResponseName = (
  statement: EsTreeNode,
  responseName: string,
): boolean => {
  let didInitialize = false;
  walkStatementWithoutNestedScopes(statement, (child: EsTreeNode) => {
    if (didInitialize) return false;
    if (
      isNodeOfType(child, "VariableDeclarator") &&
      isNodeOfType(child.id, "Identifier") &&
      child.id.name === responseName &&
      isFetchResponseInitializer(child.init)
    ) {
      didInitialize = true;
      return false;
    }
    if (
      isNodeOfType(child, "AssignmentExpression") &&
      isNodeOfType(child.left, "Identifier") &&
      child.left.name === responseName &&
      isFetchResponseInitializer(child.right)
    ) {
      didInitialize = true;
      return false;
    }
  });
  return didInitialize;
};

const expressionReadsResponseStatus = (expression: EsTreeNode, responseName: string): boolean => {
  let didReadStatus = false;
  walkAst(expression, (child: EsTreeNode) => {
    if (didReadStatus) return false;
    if (child !== expression && isFunctionLike(child)) return false;
    if (!isNodeOfType(child, "MemberExpression")) return;
    if (!isNodeOfType(child.object, "Identifier")) return;
    if (child.object.name !== responseName) return;
    const propertyName = getStaticMemberName(child);
    if (!propertyName || !RESPONSE_STATUS_PROPERTIES.has(propertyName)) return;
    didReadStatus = true;
    return false;
  });
  return didReadStatus;
};

const statementChecksResponseStatus = (statement: EsTreeNode, responseName: string): boolean => {
  let didCheckStatus = false;
  walkStatementWithoutNestedScopes(statement, (child: EsTreeNode) => {
    if (didCheckStatus) return false;
    if (
      (isNodeOfType(child, "IfStatement") ||
        isNodeOfType(child, "ConditionalExpression") ||
        isNodeOfType(child, "WhileStatement") ||
        isNodeOfType(child, "DoWhileStatement")) &&
      expressionReadsResponseStatus(child.test, responseName)
    ) {
      didCheckStatus = true;
      return false;
    }
    if (
      isNodeOfType(child, "ForStatement") &&
      child.test &&
      expressionReadsResponseStatus(child.test, responseName)
    ) {
      didCheckStatus = true;
      return false;
    }
  });
  return didCheckStatus;
};

const getDirectChildOfBlock = (node: EsTreeNode): BlockLocation | null => {
  let child = node;
  let parent = node.parent;
  while (parent) {
    if (isNodeOfType(parent, "BlockStatement")) return { block: parent, child };
    if (isFunctionLike(parent)) return null;
    child = parent;
    parent = parent.parent;
  }
  return null;
};

const getPreviousSiblings = (location: BlockLocation): EsTreeNode[] => {
  const statements = location.block.body ?? [];
  const childIndex = statements.findIndex((statement: EsTreeNode) => statement === location.child);
  if (childIndex <= 0) return [];
  return statements.slice(0, childIndex);
};

const hasFetchInitializationBefore = (node: EsTreeNode, responseName: string): boolean => {
  let current = node;
  while (true) {
    const location = getDirectChildOfBlock(current);
    if (!location) return false;
    for (const statement of getPreviousSiblings(location)) {
      if (statementInitializesFetchResponseName(statement, responseName)) return true;
    }
    current = location.block;
  }
};

const hasAncestorStatusCheck = (node: EsTreeNode, responseName: string): boolean => {
  let current = node.parent;
  while (current) {
    if (isFunctionLike(current)) return false;
    if (
      (isNodeOfType(current, "IfStatement") ||
        isNodeOfType(current, "ConditionalExpression") ||
        isNodeOfType(current, "WhileStatement") ||
        isNodeOfType(current, "DoWhileStatement")) &&
      expressionReadsResponseStatus(current.test, responseName)
    ) {
      return true;
    }
    if (
      isNodeOfType(current, "ForStatement") &&
      current.test &&
      expressionReadsResponseStatus(current.test, responseName)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

const hasStatusCheckBefore = (node: EsTreeNode, responseName: string): boolean => {
  if (hasAncestorStatusCheck(node, responseName)) return true;

  let current = node;
  while (true) {
    const location = getDirectChildOfBlock(current);
    if (!location) return false;
    for (const statement of getPreviousSiblings(location)) {
      if (statementChecksResponseStatus(statement, responseName)) return true;
    }
    current = location.block;
  }
};

const reportUncheckedJson = (context: RuleContext, node: EsTreeNode): void => {
  context.report({
    node,
    message:
      "fetch Response is parsed with .json() before checking ok or status; fetch resolves for HTTP errors, and non-JSON error bodies turn into generic parse failures",
  });
};

export const noUncheckedResponseJson = defineRule<Rule>({
  id: "no-unchecked-response-json",
  severity: "warn",
  recommendation:
    "Check response.ok or response.status before calling response.json() on a fetch result, and handle non-JSON error bodies separately when proxying upstream responses",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (isJsonCallOnAwaitedFetch(node)) {
        reportUncheckedJson(context, node);
        return;
      }

      const responseName = getJsonCallResponseName(node);
      if (!responseName) return;
      if (!hasFetchInitializationBefore(node, responseName)) return;
      if (hasStatusCheckBefore(node, responseName)) return;

      reportUncheckedJson(context, node);
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (v2 prompt: WHY-reasoning + generality check + explicit abstain). See [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline. Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only.
</sub>
