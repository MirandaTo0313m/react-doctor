# Proposal: `react-doctor/no-any-in-gatsby-apis`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                              |
| --------------------------- | ---------------------------- |
| Category                    | `architecture`               |
| Severity                    | `warn`                       |
| Source clusters             | `NEW::no-any-in-gatsby-apis` |
| Independent draft proposals | 1                            |
| Backing evidence units      | 1                            |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/gatsby-node.ts` (DisableChurnMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/08db6f8258072e42d988cc042b1630948a820c3d)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Only flag exported Gatsby entry-point handlers in `gatsby-node`, `gatsby-browser`, or `gatsby-ssr` files. False positives include local helper functions, generated glue code, and temporary `unknown`-plus-narrowing wrappers around third-party APIs. If the `any` is not on a Gatsby-exported hook parameter, do not report it.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Replace the `any` annotation with the specific Gatsby hook type for that export. Example:

```ts
import type { GatsbyNode } from "gatsby";

export const createPages: GatsbyNode["createPages"] = async ({ actions, graphql, reporter }) => {
  // ...
};
```

If you need an escape hatch, keep it local and narrow `unknown` before use instead of typing the exported hook as `any`.

## Positive fixture (SHOULD trigger)

```tsx
exports.createPages = async function createPages({ actions, graphql, reporter }: any) {
  actions.createPage({});
};
```

## Negative fixture (should NOT trigger)

```tsx
import type { GatsbyNode } from "gatsby";

export const createPages: GatsbyNode["createPages"] = async ({ actions, graphql, reporter }) => {
  actions.createPage({});
};
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/architecture/no-any-in-gatsby-apis.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { walkAst } from "../../utils/walk-ast.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const GATSBY_ENTRY_FILE_SUFFIXES: ReadonlyArray<string> = [
  "gatsby-browser.ts",
  "gatsby-browser.tsx",
  "gatsby-browser.js",
  "gatsby-browser.jsx",
  "gatsby-browser.mts",
  "gatsby-browser.cts",
  "gatsby-browser.mjs",
  "gatsby-browser.cjs",
  "gatsby-node.ts",
  "gatsby-node.tsx",
  "gatsby-node.js",
  "gatsby-node.jsx",
  "gatsby-node.mts",
  "gatsby-node.cts",
  "gatsby-node.mjs",
  "gatsby-node.cjs",
  "gatsby-ssr.ts",
  "gatsby-ssr.tsx",
  "gatsby-ssr.js",
  "gatsby-ssr.jsx",
  "gatsby-ssr.mts",
  "gatsby-ssr.cts",
  "gatsby-ssr.mjs",
  "gatsby-ssr.cjs",
];

const GATSBY_API_NAMES: ReadonlySet<string> = new Set([
  "createPages",
  "createPagesStatefully",
  "createSchemaCustomization",
  "createResolvers",
  "onCreateNode",
  "onCreatePage",
  "onCreateWebpackConfig",
  "onCreateBabelConfig",
  "setFieldsOnGraphQLNodeType",
  "sourceNodes",
  "onPreInit",
  "onPreBootstrap",
  "onPostBootstrap",
  "onPluginInit",
  "onClientEntry",
  "onInitialClientRender",
  "onRouteUpdate",
  "onRouteUpdateDelayed",
  "onPreRouteUpdate",
  "onRenderBody",
  "onPreRenderHTML",
  "wrapPageElement",
  "wrapRootElement",
  "shouldUpdateScroll",
  "replaceRenderer",
]);

const isGatsbyEntryFilename = (filename: string): boolean =>
  GATSBY_ENTRY_FILE_SUFFIXES.some((suffix) => filename.endsWith(suffix));

const getParameterTypeAnnotation = (parameterNode: EsTreeNode): EsTreeNode | null => {
  const typeAnnotation = (parameterNode as { typeAnnotation?: EsTreeNode | null }).typeAnnotation;
  if (!typeAnnotation || typeof typeAnnotation !== "object") return null;
  if (!isNodeOfType(typeAnnotation, "TSTypeAnnotation")) return null;
  const innerTypeNode = typeAnnotation.typeAnnotation;
  if (!innerTypeNode || typeof innerTypeNode !== "object") return null;
  return innerTypeNode;
};

const containsAnyKeyword = (typeNode: EsTreeNode): boolean => {
  let foundAny = false;
  walkAst(typeNode, (child: EsTreeNode) => {
    if (isNodeOfType(child, "TSAnyKeyword")) {
      foundAny = true;
      return false;
    }
  });
  return foundAny;
};

const getAssignedGatsbyApiName = (leftNode: EsTreeNode): string | null => {
  if (!isNodeOfType(leftNode, "MemberExpression") || leftNode.computed) return null;
  if (!isNodeOfType(leftNode.property, "Identifier")) return null;
  const apiName = leftNode.property.name;
  if (!GATSBY_API_NAMES.has(apiName)) return null;
  const objectNode = leftNode.object;
  if (isNodeOfType(objectNode, "Identifier") && objectNode.name === "exports") return apiName;
  if (
    isNodeOfType(objectNode, "MemberExpression") &&
    !objectNode.computed &&
    isNodeOfType(objectNode.object, "Identifier") &&
    objectNode.object.name === "module" &&
    isNodeOfType(objectNode.property, "Identifier") &&
    objectNode.property.name === "exports"
  ) {
    return apiName;
  }
  return null;
};

const reportIfAnyTypedParameter = (
  functionNode:
    | EsTreeNodeOfType<"FunctionDeclaration">
    | EsTreeNodeOfType<"FunctionExpression">
    | EsTreeNodeOfType<"ArrowFunctionExpression">,
  apiName: string,
  context: RuleContext,
): void => {
  for (const parameterNode of functionNode.params) {
    const typeNode = getParameterTypeAnnotation(parameterNode as EsTreeNode);
    if (!typeNode) continue;
    if (!containsAnyKeyword(typeNode)) continue;
    context.report({
      node: parameterNode as EsTreeNode,
      message: `Any-typed parameter in Gatsby API '${apiName}' - use a Gatsby hook type instead of @typescript-eslint/no-explicit-any`,
    });
    return;
  }
};

export const noAnyInGatsbyApis = defineRule<Rule>({
  id: "no-any-in-gatsby-apis",
  category: "Architecture",
  severity: "warn",
  recommendation: "Use the Gatsby hook types for exported API parameters instead of any.",
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const fileIsGatsbyEntry = isGatsbyEntryFilename(filename);

    return {
      AssignmentExpression(node: EsTreeNodeOfType<"AssignmentExpression">) {
        if (!fileIsGatsbyEntry) return;
        if (node.operator !== "=") return;
        const apiName = getAssignedGatsbyApiName(node.left);
        if (!apiName) return;
        const rightNode = node.right;
        if (
          !isNodeOfType(rightNode, "FunctionExpression") &&
          !isNodeOfType(rightNode, "ArrowFunctionExpression")
        )
          return;
        reportIfAnyTypedParameter(rightNode, apiName, context);
      },
      ExportNamedDeclaration(node: EsTreeNodeOfType<"ExportNamedDeclaration">) {
        if (!fileIsGatsbyEntry) return;
        const declaration = node.declaration;
        if (!declaration) return;
        if (isNodeOfType(declaration, "FunctionDeclaration")) {
          const apiName = declaration.id?.name ?? null;
          if (!apiName || !GATSBY_API_NAMES.has(apiName)) return;
          reportIfAnyTypedParameter(declaration, apiName, context);
          return;
        }
        if (!isNodeOfType(declaration, "VariableDeclaration")) return;
        for (const declarator of declaration.declarations) {
          if (!isNodeOfType(declarator.id, "Identifier")) continue;
          if (!GATSBY_API_NAMES.has(declarator.id.name)) continue;
          const init = declarator.init;
          if (
            !isNodeOfType(init, "FunctionExpression") &&
            !isNodeOfType(init, "ArrowFunctionExpression")
          )
            continue;
          reportIfAnyTypedParameter(init, declarator.id.name, context);
        }
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
