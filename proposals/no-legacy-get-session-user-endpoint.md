# Proposal: `react-doctor/no-legacy-get-session-user-endpoint`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                            |
| --------------------------- | ------------------------------------------ |
| Category                    | `client`                                   |
| Severity                    | `error`                                    |
| Source clusters             | `NEW::no-legacy-get-session-user-endpoint` |
| Independent draft proposals | 1                                          |
| Backing evidence units      | 1                                          |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `api/src/routes/public/user.test.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/9714ae3b700cda3b33dd97ccb87b9feccd8ce6de)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the code is making a real runtime request to the removed `/user/get-session-user` route, not a test fixture, mock, or a temporary compatibility shim. False positives can also come from wrapper functions or client abstractions that mention the path but do not actually call the endpoint. If the old path only appears in migration code or documentation, ignore it.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Replace the legacy request path with the current session endpoint, or use the app's existing auth/session source if the component already has that data available. For example:

```ts
const response = await fetch("/user/session-user");
const sessionUser = await response.json();
```

## Positive fixture (SHOULD trigger)

```tsx
import { useEffect } from "react";

export const Profile = () => {
  useEffect(() => {
    void fetch("/user/get-session-user");
  }, []);

  return null;
};
```

## Negative fixture (should NOT trigger)

```tsx
import { useEffect } from "react";

export const Profile = () => {
  useEffect(() => {
    void fetch("/user/session-user");
  }, []);

  return null;
};
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/client/no-legacy-get-session-user-endpoint.ts`:

```ts
import { FETCH_CALLEE_NAMES, FETCH_MEMBER_OBJECTS } from "../../constants/library.js";
import { defineRule } from "../../utils/define-rule.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const LEGACY_SESSION_USER_ENDPOINT = "/user/get-session-user";
const CURRENT_SESSION_USER_ENDPOINT = "/user/session-user";
const DIRECT_REQUEST_CALLEE_NAMES = new Set([...FETCH_CALLEE_NAMES, "axios", "request"]);
const REQUEST_MEMBER_METHOD_NAMES = new Set([
  "get",
  "head",
  "options",
  "delete",
  "post",
  "put",
  "patch",
  "fetch",
  "request",
]);
const HTTP_CLIENT_RECEIVERS = new Set([
  ...FETCH_MEMBER_OBJECTS,
  "api",
  "client",
  "http",
  "fetcher",
]);

const isRequestCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (isNodeOfType(node.callee, "Identifier"))
    return DIRECT_REQUEST_CALLEE_NAMES.has(node.callee.name);
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.object, "Identifier")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  if (!HTTP_CLIENT_RECEIVERS.has(node.callee.object.name)) return false;
  return REQUEST_MEMBER_METHOD_NAMES.has(node.callee.property.name);
};

const containsLegacySessionUserEndpoint = (node: EsTreeNode): boolean => {
  let didFindLegacyEndpoint = false;
  walkAst(node, (child: EsTreeNode) => {
    if (didFindLegacyEndpoint) return false;
    if (
      isNodeOfType(child, "Literal") &&
      typeof child.value === "string" &&
      child.value.includes(LEGACY_SESSION_USER_ENDPOINT)
    ) {
      didFindLegacyEndpoint = true;
      return false;
    }
    if (isNodeOfType(child, "TemplateLiteral")) {
      for (const quasi of child.quasis ?? []) {
        const text = quasi.value.cooked ?? quasi.value.raw;
        if (typeof text === "string" && text.includes(LEGACY_SESSION_USER_ENDPOINT)) {
          didFindLegacyEndpoint = true;
          return false;
        }
      }
    }
  });
  return didFindLegacyEndpoint;
};

export const noLegacyGetSessionUserEndpoint = defineRule<Rule>({
  id: "no-legacy-get-session-user-endpoint",
  tags: ["test-noise"],
  severity: "error",
  category: "Correctness",
  recommendation: `Replace '/user/get-session-user' with '/user/session-user' or the current session/user source so the client stops calling the removed route`,
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isRequestCall(node)) return;
      const urlArg = node.arguments?.[0];
      if (!urlArg) return;
      if (!containsLegacySessionUserEndpoint(urlArg)) return;
      context.report({
        node: urlArg,
        message: `Legacy session-user endpoint '${LEGACY_SESSION_USER_ENDPOINT}' — use '${CURRENT_SESSION_USER_ENDPOINT}' instead`,
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
