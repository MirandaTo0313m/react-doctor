# Proposal: `react-doctor/no-get-session-user-endpoint`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                     |
| --------------------------- | ----------------------------------- |
| Category                    | `client`                            |
| Severity                    | `warn`                              |
| Source clusters             | `NEW::no-get-session-user-endpoint` |
| Independent draft proposals | 2                                   |
| Backing evidence units      | 2                                   |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/utils/ajax.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/7de997f37e08f2c3c59c781de563d4b5d1945b05)
- [`freeCodeCamp/freeCodeCamp` — `e2e/flash.spec.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/7de997f37e08f2c3c59c781de563d4b5d1945b05)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Check that this is a real client request path, not a test stub, MSW/Playwright route handler, or a temporary migration shim that still needs the legacy endpoint. Common false positives are fixture files, backend-to-backend calls, and code that only mentions the string in comments or constants but never sends the request. If the app deliberately keeps `get-session-user` for backward compatibility, dismiss it.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Replace the legacy client URL with the session-user endpoint and centralize it so app code and tests stay in sync.

```ts
const sessionUserUrl = "/user/session-user";
await fetch(sessionUserUrl);
```

If a test is intercepting the old route, update that mock to the same constant too.

## Positive fixture (SHOULD trigger)

```tsx
"use client";
import { useEffect } from "react";

export function Profile() {
  useEffect(() => {
    fetch("/user/get-session-user");
  }, []);

  return null;
}
```

## Negative fixture (should NOT trigger)

```tsx
"use client";
import { useEffect } from "react";

export function Profile() {
  useEffect(() => {
    fetch("/user/session-user");
  }, []);

  return null;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/client/no-get-session-user-endpoint.ts`:

```ts
import { FETCH_CALLEE_NAMES, FETCH_MEMBER_OBJECTS } from "../../constants/library.js";
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const DEPRECATED_ENDPOINT_PATTERN = /\/user\/get-session-user(?:[/?#]|$)/;
const WINDOW_FETCH_OBJECTS = new Set(["window", "globalThis", "self"]);

const getStaticString = (node: EsTreeNode): string | null => {
  if (isNodeOfType(node, "Literal")) {
    return typeof node.value === "string" ? node.value : null;
  }
  if (isNodeOfType(node, "TemplateLiteral") && node.quasis?.length === 1) {
    return node.quasis[0].value?.raw ?? null;
  }
  return null;
};

const isRequestCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;

  const callee = node.callee;
  if (isNodeOfType(callee, "Identifier")) {
    return FETCH_CALLEE_NAMES.has(callee.name);
  }

  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (!isNodeOfType(callee.object, "Identifier")) return false;

  if (
    isNodeOfType(callee.property, "Identifier") &&
    callee.property.name === "fetch" &&
    WINDOW_FETCH_OBJECTS.has(callee.object.name)
  ) {
    return true;
  }

  return FETCH_MEMBER_OBJECTS.has(callee.object.name);
};

export const noGetSessionUserEndpoint = defineRule<Rule>({
  id: "no-get-session-user-endpoint",
  severity: "warn",
  category: "Correctness",
  recommendation:
    'Use the client session endpoint instead, e.g. `fetch("/user/session-user")`, and keep the path in one shared constant so tests and app code stay aligned',
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isRequestCall(node)) return;

      const urlArg = node.arguments?.[0];
      if (!urlArg) return;

      const urlText = getStaticString(urlArg);
      if (!urlText || !DEPRECATED_ENDPOINT_PATTERN.test(urlText)) return;

      context.report({
        node: urlArg,
        message: `"${urlText}" is the deprecated get-session-user endpoint on the client — use "/user/session-user" instead`,
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
