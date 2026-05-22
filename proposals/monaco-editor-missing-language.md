# Proposal: `react-doctor/monaco-editor-missing-language`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                                       |
| --------------------------- | ------------------------------------- |
| Category                    | `correctness`                         |
| Severity                    | `warn`                                |
| Source clusters             | `NEW::monaco-editor-missing-language` |
| Independent draft proposals | 1                                     |
| Backing evidence units      | 1                                     |

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. The pipeline below produced this proposal:

```
OSS repo → Vercel Sandbox miner → EvidenceUnit → RuleDrafter (LLM) → RuleDedupe → THIS PR
```

### Backing evidence

- [`freeCodeCamp/freeCodeCamp` — `client/src/templates/Challenges/classic/editor.tsx` (FixCommitMeta)](https://github.com/freeCodeCamp/freeCodeCamp/commit/76dd352aa512f2927367c3583aca2d9966a4e661)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Flag this only when a Monaco editor component imported from `react-monaco-editor` or `@monaco-editor/react` is rendered without an explicit `language` prop. Common false positives are wrapper components that forward `language` through `{...props}`, and `DiffEditor`, which uses `originalLanguage` and `modifiedLanguage` instead. Do not report when the editor already has a direct `language` prop or when the component is not actually Monaco.

## Fix prompt

Actionable fix suggestion surfaced to the user when the rule fires:

> Pass the current file type to Monaco explicitly so tokenization and editor services match the buffer. If the language comes from the file extension, map it before rendering.

```tsx
<MonacoEditor language={modeMap[fileExt]} value={code} />
```

If you use `DiffEditor`, set `originalLanguage` and `modifiedLanguage` instead of `language`.

## Positive fixture (SHOULD trigger)

```tsx
import MonacoEditor from "react-monaco-editor";

export const Editor = () => <MonacoEditor value="const answer = 42;" />;
```

## Negative fixture (should NOT trigger)

```tsx
import MonacoEditor from "react-monaco-editor";

export const Editor = () => <MonacoEditor language="typescript" value="const answer = 42;" />;
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/correctness/monaco-editor-missing-language.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import { hasJsxProp } from "../../utils/has-jsx-prop.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getImportedName } from "../../utils/get-imported-name.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface MonacoBindings {
  editorNames: Set<string>;
  namespaceNames: Set<string>;
}

const MONACO_EDITOR_SOURCES = new Set(["react-monaco-editor", "@monaco-editor/react"]);

const hasSpreadAttribute = (attributes: ReadonlyArray<EsTreeNode>): boolean =>
  attributes.some((attribute) => isNodeOfType(attribute, "JSXSpreadAttribute"));

const collectMonacoBindings = (programNode: EsTreeNodeOfType<"Program">): MonacoBindings => {
  const editorNames = new Set<string>();
  const namespaceNames = new Set<string>();

  for (const statement of programNode.body ?? []) {
    if (!isNodeOfType(statement, "ImportDeclaration")) continue;
    const sourceValue = statement.source?.value;
    if (typeof sourceValue !== "string" || !MONACO_EDITOR_SOURCES.has(sourceValue)) continue;

    for (const specifier of statement.specifiers ?? []) {
      if (isNodeOfType(specifier, "ImportNamespaceSpecifier")) {
        namespaceNames.add(specifier.local.name);
        continue;
      }

      if (isNodeOfType(specifier, "ImportDefaultSpecifier")) {
        editorNames.add(specifier.local.name);
        continue;
      }

      if (!isNodeOfType(specifier, "ImportSpecifier")) continue;
      const importedName = getImportedName(specifier);
      if (importedName !== "Editor") continue;
      editorNames.add(specifier.local.name);
    }
  }

  return { editorNames, namespaceNames };
};

const isMonacoEditorOpeningElement = (
  node: EsTreeNodeOfType<"JSXOpeningElement">,
  bindings: MonacoBindings,
): boolean => {
  if (isNodeOfType(node.name, "JSXIdentifier")) {
    return bindings.editorNames.has(node.name.name);
  }

  if (!isNodeOfType(node.name, "JSXMemberExpression")) return false;
  if (!isNodeOfType(node.name.object, "JSXIdentifier")) return false;
  if (!isNodeOfType(node.name.property, "JSXIdentifier")) return false;
  return bindings.namespaceNames.has(node.name.object.name) && node.name.property.name === "Editor";
};

const MESSAGE =
  "Monaco editor is missing a `language` prop — pass the current file language so syntax highlighting and editor services match the buffer.";

export const monacoEditorMissingLanguage = defineRule<Rule>({
  id: "monaco-editor-missing-language",
  severity: "warn",
  recommendation:
    "Pass `language={...}` to Monaco's editor component and derive it from the current file extension or document type.",
  create: (_context: RuleContext) => {
    let monacoBindings: MonacoBindings = {
      editorNames: new Set(),
      namespaceNames: new Set(),
    };

    return {
      Program(programNode: EsTreeNodeOfType<"Program">) {
        monacoBindings = collectMonacoBindings(programNode);
      },
      JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
        if (!isMonacoEditorOpeningElement(node, monacoBindings)) return;
        const attributes = node.attributes ?? [];
        if (hasJsxProp(attributes, "language")) return;
        if (hasSpreadAttribute(attributes)) return;
        _context.report({ node: node.name, message: MESSAGE });
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (see [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline). Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only. Reject, edit-and-approve, or merge after wiring as you see fit.
</sub>
