# Proposal: `react-doctor/no-process-env-in-client-code`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                      |
| --------------------------- | ------------------------------------ |
| Category                    | `client`                             |
| Severity                    | `warn`                               |
| Source clusters             | `NEW::no-process-env-in-client-code` |
| Independent draft proposals | 1                                    |
| Backing evidence units      | 1                                    |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/gatsby-config.ts` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/08db6f8258072e42d988cc042b1630948a820c3d)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Use this for React files that run in the browser and read `process.env` or `import.meta.env` directly. Do not flag server-only modules, build configs like `gatsby-config.ts` or `vite.config.ts`, or safe flags such as `NODE_ENV`, `DEV`, `PROD`, and `CI`. Public-prefixed values like `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, and `GATSBY_` are intentional and should be treated as safe.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Move private env reads to server-only code, or rename browser-facing values to a public prefix. For example:

```tsx
"use client";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

If the value must stay secret, load it on the server and pass it down as data instead of reading it in the client.

## Positive fixture (SHOULD trigger)

```tsx
"use client";

export function App() {
  return <div>{process.env.API_KEY}</div>;
}
```

## Negative fixture (should NOT trigger)

```tsx
"use client";

export function App() {
  return <div>{process.env.NEXT_PUBLIC_API_URL}</div>;
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/client/no-process-env-in-client-code.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { classifySecretFileExposure } from "../../utils/classify-secret-file-exposure.js";
import { getReactDoctorStringSetting } from "../../utils/get-react-doctor-setting.js";
import { hasDirective } from "../../utils/has-directive.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
const SAFE_BUILD_ENV_VARS = new Set(["CI", "DEV", "MODE", "NODE_ENV", "PROD"]);
const PUBLIC_ENV_PREFIXES = ["GATSBY_", "NEXT_PUBLIC_", "PUBLIC_", "REACT_APP_", "VITE_"];
const isPublicClientEnvVar = (envVarName: string): boolean =>
  SAFE_BUILD_ENV_VARS.has(envVarName) ||
  PUBLIC_ENV_PREFIXES.some((prefix) => envVarName.startsWith(prefix));
const isProcessEnvAccess = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "MemberExpression") &&
  isNodeOfType(node.object, "MemberExpression") &&
  isNodeOfType(node.object.object, "Identifier") &&
  node.object.object.name === "process" &&
  isNodeOfType(node.object.property, "Identifier") &&
  node.object.property.name === "env";
const isImportMetaEnvAccess = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "MemberExpression") &&
  isNodeOfType(node.object, "MemberExpression") &&
  isNodeOfType(node.object.object, "MetaProperty") &&
  isNodeOfType(node.object.property, "Identifier") &&
  node.object.property.name === "env";
const getEnvVarName = (node: EsTreeNode): string | null => {
  if (isNodeOfType(node, "Identifier")) return node.name;
  if (isNodeOfType(node, "Literal") && typeof node.value === "string") return node.value;
  return null;
};
export const noProcessEnvInClientCode = defineRule<Rule>({
  id: "no-process-env-in-client-code",
  severity: "warn",
  category: "Client",
  recommendation:
    "Read environment variables on the server, or expose only public client values with a framework prefix like NEXT_PUBLIC_, VITE_, REACT_APP_, or GATSBY_",
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const framework = getReactDoctorStringSetting(context.settings, "framework");
    const rootDirectory = getReactDoctorStringSetting(context.settings, "rootDirectory");
    let fileIsClient =
      classifySecretFileExposure(filename, { framework, rootDirectory }) === "client";
    return {
      Program(programNode: EsTreeNodeOfType<"Program">) {
        fileIsClient =
          classifySecretFileExposure(filename, {
            framework,
            hasUseClientDirective: hasDirective(programNode, "use client"),
            hasUseServerDirective: hasDirective(programNode, "use server"),
            rootDirectory,
          }) === "client";
      },
      MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
        if (!fileIsClient) return;
        const isClientEnvAccess = isProcessEnvAccess(node) || isImportMetaEnvAccess(node);
        if (!isClientEnvAccess) return;
        const envVarName = getEnvVarName(node.property);
        if (!envVarName || isPublicClientEnvVar(envVarName)) return;
        const envSource = isImportMetaEnvAccess(node) ? "import.meta.env" : "process.env";
        context.report({
          node,
          message: `${envSource}.${envVarName} in client code - browser bundles cannot read private environment variables. Move the read to server-only code or use a public client prefix like NEXT_PUBLIC_, VITE_, REACT_APP_, or GATSBY_.`,
        });
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
