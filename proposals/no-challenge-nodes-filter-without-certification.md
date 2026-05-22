# Proposal: `react-doctor/no-challenge-nodes-filter-without-certification`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                                        |
| --------------------------- | ------------------------------------------------------ |
| Category                    | `correctness`                                          |
| Severity                    | `warn`                                                 |
| Source clusters             | `NEW::no-challenge-nodes-filter-without-certification` |
| Independent draft proposals | 1                                                      |
| Backing evidence units      | 1                                                      |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/utils/get-completion-percentage.test.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ac3901c983dfc16b1efb79f5f912bfa919c8106f)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag only when a filter over `challengeNodes` narrows by `challenge.block` but does not also narrow by `challenge.certification`. Common false positives include arrays that are already pre-scoped to a single certification upstream, filters on unrelated `block` fields, or code paths that deliberately aggregate across certifications. If the predicate already checks certification anywhere in the same callback, do not report it.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Add the certification guard to the same filter so shared block names cannot leak in nodes from another certification. For example:

```ts
const currentChallengeNodes = challengeNodes.filter(
  (node) => node.challenge.block === block && node.challenge.certification === certification,
);
```

If the data is already scoped elsewhere, keep that scoping explicit before the filter instead of relying on block names alone.

## Positive fixture (SHOULD trigger)

```tsx
import React from "react";

export const Progress = ({ challengeNodes, block }) => {
  const currentChallengeNodes = challengeNodes.filter((node) => node.challenge.block === block);

  return <div>{currentChallengeNodes.length}</div>;
};
```

## Negative fixture (should NOT trigger)

```tsx
import React from "react";

export const Progress = ({ challengeNodes, block, certification }) => {
  const currentChallengeNodes = challengeNodes.filter(
    (node) => node.challenge.block === block && node.challenge.certification === certification,
  );

  return <div>{currentChallengeNodes.length}</div>;
};
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-challenge-nodes-filter-without-certification.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { walkAst } from "../../utils/walk-ast.js";

const unwrapChainExpression = (
  node: EsTreeNode | null | undefined,
): EsTreeNode | null | undefined =>
  node && isNodeOfType(node, "ChainExpression") ? node.expression : node;

const isChallengeNodesReceiver = (node: EsTreeNode | null | undefined): boolean => {
  const target = unwrapChainExpression(node);
  if (!target) return false;
  if (isNodeOfType(target, "Identifier")) return target.name === "challengeNodes";
  if (!isNodeOfType(target, "MemberExpression") || target.computed) return false;
  if (!isNodeOfType(target.property, "Identifier")) return false;
  if (target.property.name === "challengeNodes") return true;
  return isChallengeNodesReceiver(target.object);
};

const isChallengeSubpropertyAccess = (
  node: EsTreeNode | null | undefined,
  propertyName: string,
): boolean => {
  if (!node || !isNodeOfType(node, "MemberExpression") || node.computed) return false;
  if (!isNodeOfType(node.property, "Identifier") || node.property.name !== propertyName) {
    return false;
  }

  const object = node.object;
  if (isNodeOfType(object, "Identifier")) return object.name === "challenge";
  if (
    isNodeOfType(object, "MemberExpression") &&
    !object.computed &&
    isNodeOfType(object.property, "Identifier") &&
    object.property.name === "challenge"
  ) {
    return true;
  }

  return false;
};

const containsChallengeSubpropertyAccess = (
  callbackNode: EsTreeNode,
  propertyName: string,
): boolean => {
  let found = false;

  walkAst(callbackNode, (child: EsTreeNode) => {
    if (found) return;
    if (
      child !== callbackNode &&
      (isNodeOfType(child, "ArrowFunctionExpression") ||
        isNodeOfType(child, "FunctionExpression") ||
        isNodeOfType(child, "FunctionDeclaration"))
    ) {
      return false;
    }
    if (isChallengeSubpropertyAccess(child, propertyName)) found = true;
  });

  return found;
};

export const noChallengeNodesFilterWithoutCertification = defineRule<Rule>({
  id: "no-challenge-nodes-filter-without-certification",
  severity: "warn",
  recommendation:
    "Filter challenge nodes by both block and certification so shared block names do not pull in nodes from the wrong certification",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      const callee = unwrapChainExpression(node.callee);
      if (!callee || !isNodeOfType(callee, "MemberExpression")) return;
      if (!isNodeOfType(callee.property, "Identifier") || callee.property.name !== "filter") return;
      if (!isChallengeNodesReceiver(callee.object)) return;

      const predicate = node.arguments?.[0];
      if (
        !predicate ||
        (!isNodeOfType(predicate, "ArrowFunctionExpression") &&
          !isNodeOfType(predicate, "FunctionExpression"))
      ) {
        return;
      }

      if (!containsChallengeSubpropertyAccess(predicate, "block")) return;
      if (containsChallengeSubpropertyAccess(predicate, "certification")) return;

      context.report({
        node,
        message:
          "challengeNodes.filter() narrows by block but not certification — shared block names can include challenges from the wrong certification",
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
