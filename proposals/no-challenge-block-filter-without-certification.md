# Proposal: `react-doctor/no-challenge-block-filter-without-certification`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                                        |
| --------------------------- | ------------------------------------------------------ |
| Category                    | `correctness`                                          |
| Severity                    | `warn`                                                 |
| Source clusters             | `NEW::no-challenge-block-filter-without-certification` |
| Independent draft proposals | 1                                                      |
| Backing evidence units      | 1                                                      |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/utils/get-completion-percentage.ts` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/ac3901c983dfc16b1efb79f5f912bfa919c8106f)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag only when a `challengeNodes.filter(...)` predicate narrows by `block` and the surrounding function also has a `certification` scope value, but the predicate does not include a certification check. Do not flag filters that already include `node.challenge.certification === certification`, cases where certification scoping happens upstream, or code that uses unrelated `block` properties / different variable names for another domain.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Add the certification predicate to the same filter so the progress data stays scoped to the selected certification. For example:

```ts
const currentBlockIds = challengeNodes
  .filter(
    (node) => node.challenge.block === block && node.challenge.certification === certification,
  )
  .map((node) => node.challenge.id);
```

## Positive fixture (SHOULD trigger)

```tsx
export function getCurrentBlockIds(allChallengesInfo: any, block: string, certification: string) {
  return allChallengesInfo.challengeNodes
    .filter((node: any) => node.challenge.block === block)
    .map((node: any) => node.challenge.id);
}
```

## Negative fixture (should NOT trigger)

```tsx
export function getCurrentBlockIds(allChallengesInfo: any, block: string, certification: string) {
  return allChallengesInfo.challengeNodes
    .filter(
      (node: any) =>
        node.challenge.block === block && node.challenge.certification === certification,
    )
    .map((node: any) => node.challenge.id);
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/no-challenge-block-filter-without-certification.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const FILTER_METHOD_NAME = "filter";
const CHALLENGE_NODES_NAME = "challengeNodes";
const CHALLENGE_MEMBER_NAME = "challenge";
const BLOCK_IDENTIFIER_NAME = "block";
const CERTIFICATION_IDENTIFIER_NAME = "certification";
const BLOCK_PROPERTY_NAME = "block";
const CERTIFICATION_PROPERTY_NAME = "certification";

const isFunctionLikeNode = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "ArrowFunctionExpression") ||
  isNodeOfType(node, "FunctionDeclaration") ||
  isNodeOfType(node, "FunctionExpression");

const getEnclosingFunction = (node: EsTreeNode): EsTreeNode | null => {
  let ancestor = node.parent ?? null;
  while (ancestor) {
    if (isFunctionLikeNode(ancestor)) return ancestor;
    ancestor = ancestor.parent ?? null;
  }
  return null;
};

const hasParameterNamed = (functionNode: EsTreeNode, parameterName: string): boolean => {
  if (
    !isNodeOfType(functionNode, "ArrowFunctionExpression") &&
    !isNodeOfType(functionNode, "FunctionDeclaration") &&
    !isNodeOfType(functionNode, "FunctionExpression")
  ) {
    return false;
  }

  for (const parameter of functionNode.params ?? []) {
    if (isNodeOfType(parameter, "Identifier") && parameter.name === parameterName) {
      return true;
    }

    if (isNodeOfType(parameter, "ObjectPattern")) {
      for (const property of parameter.properties ?? []) {
        if (!isNodeOfType(property, "Property") || property.computed) continue;

        if (isNodeOfType(property.key, "Identifier") && property.key.name === parameterName) {
          return true;
        }

        if (isNodeOfType(property.key, "Literal") && property.key.value === parameterName) {
          return true;
        }
      }
    }
  }

  return false;
};

const isChallengeNodesReference = (node: EsTreeNode): boolean => {
  if (isNodeOfType(node, "Identifier")) {
    return node.name === CHALLENGE_NODES_NAME;
  }

  if (
    isNodeOfType(node, "MemberExpression") &&
    !node.computed &&
    isNodeOfType(node.property, "Identifier") &&
    node.property.name === CHALLENGE_NODES_NAME
  ) {
    return true;
  }

  return false;
};

const isChallengeMemberAccess = (node: EsTreeNode, propertyName: string): boolean => {
  if (
    !isNodeOfType(node, "MemberExpression") ||
    node.computed ||
    !isNodeOfType(node.property, "Identifier") ||
    node.property.name !== propertyName ||
    !isNodeOfType(node.object, "MemberExpression") ||
    node.object.computed ||
    !isNodeOfType(node.object.property, "Identifier") ||
    node.object.property.name !== CHALLENGE_MEMBER_NAME
  ) {
    return false;
  }

  return true;
};

const isChallengePropertyComparison = (
  node: EsTreeNode,
  propertyName: string,
  identifierName: string,
): boolean => {
  if (!isNodeOfType(node, "BinaryExpression")) return false;
  if (node.operator !== "===" && node.operator !== "==") return false;

  const isLeftMatch =
    isChallengeMemberAccess(node.left, propertyName) &&
    isNodeOfType(node.right, "Identifier") &&
    node.right.name === identifierName;

  const isRightMatch =
    isChallengeMemberAccess(node.right, propertyName) &&
    isNodeOfType(node.left, "Identifier") &&
    node.left.name === identifierName;

  return isLeftMatch || isRightMatch;
};

const callbackScopesByBlockWithoutCertification = (callback: EsTreeNode): boolean => {
  if (
    !isNodeOfType(callback, "ArrowFunctionExpression") &&
    !isNodeOfType(callback, "FunctionExpression")
  ) {
    return false;
  }

  let hasBlockComparison = false;
  let hasCertificationComparison = false;

  walkAst(callback.body, (child) => {
    if (isFunctionLikeNode(child)) return false;

    if (isChallengePropertyComparison(child, BLOCK_PROPERTY_NAME, BLOCK_IDENTIFIER_NAME)) {
      hasBlockComparison = true;
    }

    if (
      isChallengePropertyComparison(
        child,
        CERTIFICATION_PROPERTY_NAME,
        CERTIFICATION_IDENTIFIER_NAME,
      )
    ) {
      hasCertificationComparison = true;
    }
  });

  return hasBlockComparison && !hasCertificationComparison;
};

export const noChallengeBlockFilterWithoutCertification = defineRule<Rule>({
  id: "no-challenge-block-filter-without-certification",
  severity: "warn",
  recommendation:
    "Include the certification check in the same filter so block-scoped ids stay certification-specific.",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (
        !isNodeOfType(node.callee, "MemberExpression") ||
        node.callee.computed ||
        !isNodeOfType(node.callee.property, "Identifier") ||
        node.callee.property.name !== FILTER_METHOD_NAME ||
        !isChallengeNodesReference(node.callee.object)
      ) {
        return;
      }

      const enclosingFunction = getEnclosingFunction(node);
      if (!enclosingFunction) return;
      if (!hasParameterNamed(enclosingFunction, BLOCK_IDENTIFIER_NAME)) return;
      if (!hasParameterNamed(enclosingFunction, CERTIFICATION_IDENTIFIER_NAME)) return;

      const callback = node.arguments?.[0];
      if (
        !callback ||
        (!isNodeOfType(callback, "ArrowFunctionExpression") &&
          !isNodeOfType(callback, "FunctionExpression"))
      ) {
        return;
      }

      if (!callbackScopesByBlockWithoutCertification(callback)) return;

      context.report({
        node,
        message:
          "challengeNodes.filter() scopes by block but not certification — add `node.challenge.certification === certification` to keep the progress bar accurate",
      });
    },
  }),
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
