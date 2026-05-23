# Proposal: `react-doctor/no-element-ref-access`

> **Status**: 🟡 Auto-discovered draft proposal. **Not yet implemented.** Maintainer review wanted before any code lands.

|                             |                              |
| --------------------------- | ---------------------------- |
| Category                    | `architecture`               |
| Severity                    | `warn`                       |
| Source cluster              | `NEW::no-element-ref-access` |
| Independent draft proposals | 1                            |
| Backing evidence units      | 1                            |

## Why the bug exists

> The developer assumed a React element's `ref` is stable top-level metadata that wrappers can read from `element.ref`. In React 19, `ref` is treated as a regular prop, so code that inspects cloned children must read `element.props.ref` instead.

## Generality check

> Any React component or library that clones children, implements slots, or composes refs can make this mistake. The pattern is independent of the original repository and applies broadly to React 19 migrations.

## Sources

Discovered by the [react-doctor-evals discovery flywheel](https://github.com/millionco/react-doctor-evals/pull/11) mining bug-fix evidence across React OSS repos. Pipeline:

```
OSS repo -> Vercel Sandbox miner -> EvidenceUnit -> DraftAgent (LLM, gpt-5.5, xhigh reasoning) -> RuleDedupe -> THIS PR
```

### Backing evidence

- [`Flipkart/recyclerlistview` - `src/core/StickyContainer.tsx` (FixCommitMeta)](https://github.com/Flipkart/recyclerlistview/commit/281b3c432096f953ac32293b6044ea79758e8bd3)

## Validation prompt

FP-aware guidance for the [react-review agent](https://github.com/millionco/react-review) when triaging this rule:

> Confirm the object being read is a React element or `children` element, not an unrelated data structure. Typical false positives are AST/tree models with a `.ref` field and non-React component libraries that name a child collection `children`. If the code is intentionally version-gated to React 18 only, suppress; otherwise React 19+ code should not read `element.ref`.

## Fix prompt

> Read the ref from the element props instead of the legacy element field. For example: `const childRef = element.props.ref; return React.cloneElement(element, { ref: childRef });`. If you compose refs, call the received prop ref from the new callback rather than reaching into `element.ref`.

## Positive fixture (SHOULD trigger)

```tsx
import React from "react";

function Component({ children }) {
  const childRef = children.ref;
  return React.cloneElement(children, { ref: childRef });
}
```

## Negative fixture (should NOT trigger)

```tsx
import React from "react";

function Component({ children }) {
  const childRef = children.props.ref;
  return React.cloneElement(children, { ref: childRef });
}
```

## Proposed AST detector

Would land at `packages/oxlint-plugin-react-doctor/src/plugin/rules/architecture/no-element-ref-access.ts`:

```ts
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isImportedFromModule } from "../../utils/find-import-source-for-name.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const MESSAGE =
  "Accessing `element.ref` reads legacy React element metadata. In React 19+, `ref` is a regular prop; read `element.props.ref` or compose refs from the prop you receive.";

const REACT_CHILDREN_CALLBACK_METHODS = new Set(["map", "forEach"]);
const REACT_ELEMENT_FACTORY_NAMES = new Set(["cloneElement", "createElement"]);

interface ReactElementScope {
  elementNames: Set<string>;
  shadowedNames: Set<string>;
}

const createScope = (): ReactElementScope => ({
  elementNames: new Set(),
  shadowedNames: new Set(),
});

const getStaticMemberPropertyName = (
  memberExpression: EsTreeNodeOfType<"MemberExpression">,
): string | null => {
  if (!memberExpression.computed && isNodeOfType(memberExpression.property, "Identifier")) {
    return memberExpression.property.name;
  }
  if (
    memberExpression.computed &&
    isNodeOfType(memberExpression.property, "Literal") &&
    typeof memberExpression.property.value === "string"
  ) {
    return memberExpression.property.value;
  }
  return null;
};

const isThisPropsExpression = (node: EsTreeNode | null | undefined): boolean => {
  if (!isNodeOfType(node, "MemberExpression")) return false;
  if (getStaticMemberPropertyName(node) !== "props") return false;
  return isNodeOfType(node.object, "ThisExpression");
};

const isPropsObjectExpression = (node: EsTreeNode | null | undefined): boolean =>
  (isNodeOfType(node, "Identifier") && node.name === "props") || isThisPropsExpression(node);

const isPropsChildrenExpression = (node: EsTreeNode | null | undefined): boolean => {
  if (!isNodeOfType(node, "MemberExpression")) return false;
  if (getStaticMemberPropertyName(node) !== "children") return false;
  return isPropsObjectExpression(node.object);
};

const getObjectPatternPropertyName = (property: EsTreeNodeOfType<"Property">): string | null => {
  const key = property.key;
  if (isNodeOfType(key, "Identifier")) return key.name;
  if (isNodeOfType(key, "Literal") && typeof key.value === "string") return key.value;
  return null;
};

const unwrapAssignmentPattern = (
  node: EsTreeNode | null | undefined,
): EsTreeNode | null | undefined => {
  if (isNodeOfType(node, "AssignmentPattern")) return node.left;
  return node;
};

const collectPatternIdentifierNames = (
  pattern: EsTreeNode | null | undefined,
  names: Set<string>,
): void => {
  if (!pattern) return;
  if (isNodeOfType(pattern, "Identifier")) {
    names.add(pattern.name);
    return;
  }
  if (isNodeOfType(pattern, "AssignmentPattern")) {
    collectPatternIdentifierNames(pattern.left, names);
    return;
  }
  if (isNodeOfType(pattern, "RestElement")) {
    collectPatternIdentifierNames(pattern.argument, names);
    return;
  }
  if (isNodeOfType(pattern, "ArrayPattern")) {
    for (const element of pattern.elements ?? []) {
      collectPatternIdentifierNames(element, names);
    }
    return;
  }
  if (!isNodeOfType(pattern, "ObjectPattern")) return;
  for (const property of pattern.properties ?? []) {
    if (isNodeOfType(property, "Property")) {
      collectPatternIdentifierNames(property.value, names);
    } else if (isNodeOfType(property, "RestElement")) {
      collectPatternIdentifierNames(property.argument, names);
    }
  }
};

const addChildrenBindingFromObjectPattern = (
  pattern: EsTreeNode | null | undefined,
  scope: ReactElementScope,
): void => {
  if (!isNodeOfType(pattern, "ObjectPattern")) return;
  for (const property of pattern.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    if (getObjectPatternPropertyName(property) !== "children") continue;
    const value = unwrapAssignmentPattern(property.value);
    if (isNodeOfType(value, "Identifier")) scope.elementNames.add(value.name);
  }
};

const isReactNamespaceIdentifier = (
  contextNode: EsTreeNode,
  node: EsTreeNode | null | undefined,
): boolean =>
  isNodeOfType(node, "Identifier") && isImportedFromModule(contextNode, node.name, "react");

const isReactChildrenObjectExpression = (
  contextNode: EsTreeNode,
  node: EsTreeNode | null | undefined,
): boolean => {
  if (isNodeOfType(node, "Identifier")) {
    return node.name === "Children" && isImportedFromModule(contextNode, node.name, "react");
  }
  if (!isNodeOfType(node, "MemberExpression")) return false;
  if (getStaticMemberPropertyName(node) !== "Children") return false;
  return isReactNamespaceIdentifier(contextNode, node.object);
};

const isReactCreateOrCloneElementCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (isNodeOfType(callee, "Identifier")) {
    return (
      REACT_ELEMENT_FACTORY_NAMES.has(callee.name) &&
      isImportedFromModule(node, callee.name, "react")
    );
  }
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  const propertyName = getStaticMemberPropertyName(callee);
  if (!propertyName || !REACT_ELEMENT_FACTORY_NAMES.has(propertyName)) return false;
  return isReactNamespaceIdentifier(node, callee.object);
};

const isReactChildrenOnlyCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (getStaticMemberPropertyName(node.callee) !== "only") return false;
  return isReactChildrenObjectExpression(node, node.callee.object);
};

const isReactElementFactoryCall = (node: EsTreeNode): boolean =>
  isReactCreateOrCloneElementCall(node) || isReactChildrenOnlyCall(node);

const isReactChildrenMethodCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  const methodName = getStaticMemberPropertyName(node.callee);
  if (!methodName || !REACT_CHILDREN_CALLBACK_METHODS.has(methodName)) return false;
  return isReactChildrenObjectExpression(node, node.callee.object);
};

const addReactChildrenCallbackParameter = (
  node: EsTreeNodeOfType<"FunctionDeclaration" | "FunctionExpression" | "ArrowFunctionExpression">,
  scope: ReactElementScope,
): void => {
  const parent = node.parent;
  if (!isNodeOfType(parent, "CallExpression")) return;
  if (parent.arguments?.[1] !== node) return;
  if (!isReactChildrenMethodCall(parent)) return;
  const firstParameter = node.params?.[0];
  if (isNodeOfType(firstParameter, "Identifier")) scope.elementNames.add(firstParameter.name);
};

export const noElementRefAccess = defineRule<Rule>({
  id: "no-element-ref-access",
  requires: ["react:19"],
  tags: ["migration-hint"],
  severity: "warn",
  recommendation:
    "Read child element refs from `element.props.ref` on React 19+. When composing refs, call the prop ref you received instead of reading legacy `element.ref` metadata.",
  create: (context: RuleContext) => {
    const scopeStack: ReactElementScope[] = [createScope()];

    const currentScope = (): ReactElementScope => scopeStack[scopeStack.length - 1];

    const isKnownElementName = (identifierName: string): boolean => {
      for (let scopeIndex = scopeStack.length - 1; scopeIndex >= 0; scopeIndex -= 1) {
        const scope = scopeStack[scopeIndex];
        if (scope.elementNames.has(identifierName)) return true;
        if (scope.shadowedNames.has(identifierName)) return false;
      }
      return false;
    };

    const isReactElementExpression = (node: EsTreeNode | null | undefined): boolean => {
      if (isPropsChildrenExpression(node)) return true;
      if (isNodeOfType(node, "Identifier")) return isKnownElementName(node.name);
      if (isNodeOfType(node, "JSXElement") || isNodeOfType(node, "JSXFragment")) return true;
      return Boolean(node && isReactElementFactoryCall(node));
    };

    const enterFunction = (
      node: EsTreeNodeOfType<
        "FunctionDeclaration" | "FunctionExpression" | "ArrowFunctionExpression"
      >,
    ): void => {
      const scope = createScope();
      for (const parameter of node.params ?? []) {
        collectPatternIdentifierNames(parameter, scope.shadowedNames);
        addChildrenBindingFromObjectPattern(parameter, scope);
      }
      addReactChildrenCallbackParameter(node, scope);
      scopeStack.push(scope);
    };

    const exitFunction = (): void => {
      scopeStack.pop();
    };

    return {
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      VariableDeclarator(node: EsTreeNodeOfType<"VariableDeclarator">) {
        const scope = currentScope();
        collectPatternIdentifierNames(node.id, scope.shadowedNames);
        if (isNodeOfType(node.id, "Identifier") && isReactElementExpression(node.init)) {
          scope.elementNames.add(node.id.name);
          return;
        }
        if (isPropsObjectExpression(node.init)) {
          addChildrenBindingFromObjectPattern(node.id, scope);
        }
      },
      MemberExpression(node: EsTreeNodeOfType<"MemberExpression">) {
        if (getStaticMemberPropertyName(node) !== "ref") return;
        if (!isReactElementExpression(node.object)) return;
        context.report({ node, message: MESSAGE });
      },
    };
  },
});
```

---

<sub>
Generated by `rde discover` (v2 prompt: WHY-reasoning + generality check + explicit abstain). See [millionco/react-doctor-evals#11](https://github.com/millionco/react-doctor-evals/pull/11) for the pipeline. Implementation, test fixtures, and rule registration are deliberately deferred — this PR exists for maintainer triage of the proposal only.
</sub>
