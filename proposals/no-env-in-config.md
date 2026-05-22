# Proposal: `react-doctor/no-env-in-config`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                         |
| --------------------------- | ----------------------- |
| Category                    | `architecture`          |
| Severity                    | `warn`                  |
| Source clusters             | `NEW::no-env-in-config` |
| Independent draft proposals | 1                       |
| Backing evidence units      | 1                       |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/gatsby-config.js` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ae50644091495991e410c203f76476fcd0d37741)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag this only when an environment read feeds an exported build/config object, making the config shape depend on external state. Do not flag standard build flags like `NODE_ENV`, `MODE`, `DEV`, or `PROD`, and be careful around files that only use env values for optional diagnostics or logging. If the env value is explicitly declared in the build tool's cache/env allowlist, or the code is not part of an exported config, it is likely intentional.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Keep the exported config stable and move environment-dependent behavior out of the config object when possible. If the value only toggles optional output, replace it with a literal or derive it outside the config and make the config itself deterministic.

```js
const shouldGenerateStats = false;

module.exports = {
  plugins: [
    {
      options: {
        generateStatsFile: shouldGenerateStats,
      },
    },
  ],
};
```

## Positive fixture (SHOULD trigger)

```tsx
module.exports = {
  plugins: [
    {
      resolve: "gatsby-plugin-webpack-bundle-analyser-v2",
      options: {
        generateStatsFile: process.env.CI,
      },
    },
  ],
};
```

## Negative fixture (should NOT trigger)

```tsx
module.exports = {
  plugins: [
    {
      resolve: "gatsby-plugin-webpack-bundle-analyser-v2",
      options: {
        generateStatsFile: false,
      },
    },
  ],
};
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/architecture/no-env-in-config.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { walkAst } from "../../utils/walk-ast.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface EnvAccess {
  name: string;
  source: "process.env" | "import.meta.env";
}

const SAFE_ENV_NAMES = new Set(["NODE_ENV", "MODE", "DEV", "PROD"]);

const getEnvAccess = (node: EsTreeNode): EnvAccess | null => {
  if (!isNodeOfType(node, "MemberExpression")) return null;
  if (!isNodeOfType(node.property, "Identifier")) return null;

  const envName = node.property.name;
  const objectNode = node.object;

  if (
    isNodeOfType(objectNode, "MemberExpression") &&
    isNodeOfType(objectNode.object, "Identifier") &&
    objectNode.object.name === "process" &&
    isNodeOfType(objectNode.property, "Identifier") &&
    objectNode.property.name === "env"
  ) {
    return {
      name: envName,
      source: "process.env",
    };
  }

  if (
    isNodeOfType(objectNode, "MemberExpression") &&
    isNodeOfType(objectNode.object, "MetaProperty") &&
    isNodeOfType(objectNode.object.meta, "Identifier") &&
    objectNode.object.meta.name === "import" &&
    isNodeOfType(objectNode.object.property, "Identifier") &&
    objectNode.object.property.name === "meta" &&
    isNodeOfType(objectNode.property, "Identifier") &&
    objectNode.property.name === "env"
  ) {
    return {
      name: envName,
      source: "import.meta.env",
    };
  }

  return null;
};

const isModuleExportsMemberExpression = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "MemberExpression")) return false;
  if (!isNodeOfType(node.object, "Identifier")) return false;
  if (node.object.name !== "module") return false;
  if (!isNodeOfType(node.property, "Identifier")) return false;
  return node.property.name === "exports";
};

const reportEnvAccesses = (context: RuleContext, subtree: EsTreeNode): void => {
  walkAst(subtree, (child) => {
    const envAccess = getEnvAccess(child);
    if (!envAccess) return;
    if (SAFE_ENV_NAMES.has(envAccess.name)) return;

    context.report({
      node: child,
      message: `${envAccess.source}.${envAccess.name} inside exported config — keep config inputs explicit and avoid env-driven cache churn`,
    });
  });
};

export const noEnvInConfig = defineRule<Rule>({
  id: "no-env-in-config",
  severity: "warn",
  recommendation:
    "Keep exported config deterministic. If a flag truly needs the environment, declare it in your build tool's env allowlist or move the check out of the config object",
  create: (context: RuleContext) => ({
    AssignmentExpression(node: EsTreeNodeOfType<"AssignmentExpression">) {
      if (!isModuleExportsMemberExpression(node.left)) return;
      reportEnvAccesses(context, node.right);
    },
    ExportDefaultDeclaration(node: EsTreeNodeOfType<"ExportDefaultDeclaration">) {
      if (!node.declaration) return;
      reportEnvAccesses(context, node.declaration);
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
