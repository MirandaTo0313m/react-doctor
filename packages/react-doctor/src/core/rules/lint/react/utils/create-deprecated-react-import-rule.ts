import type { DeprecatedReactImportRuleOptions } from "./deprecated-react-import-rule-options.js";
import type { EsTreeNode } from "../../utils/index.js";
import type { Rule } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: components with many boolean props (isLoading, hasIcon, showHeader,
// canEdit...) typically signal "many UI variants jammed into one component"
// - a sign that the component should be split via composition (compound
// components, explicit variant components). We use a name-based heuristic
// because TypeScript types aren't visible at this AST layer. Detects
// both destructured form (`{ isPrimary, hasIcon }`) and non-destructured
// (`function Foo(props) { props.isPrimary }`) by walking member-access
// patterns on the parameter binding.

// HACK: React 19+ deprecated `forwardRef` (refs are now regular props on
// function components) and `useContext` (replaced by the more flexible
// `use()`). Catches both named imports (`import { forwardRef } from "react"`)
// AND member access on namespace/default imports (`React.forwardRef`,
// `React.useContext` after `import React from "react"` or
// `import * as React from "react"`).
//
// Stored as a Map (not a plain object) because plain-object lookups inherit
// from `Object.prototype` - `messages["constructor"]` returns the native
// `Object` function, which is truthy and would silently false-positive on
// `import { constructor } from "react"` or `React.toString()`. Maps return
// `undefined` for missing keys with no prototype fall-through.

export const createDeprecatedReactImportRule = ({
  source,
  recommendation,
  examples,
  messages,
  handleExtraSource,
}: DeprecatedReactImportRuleOptions): Rule => ({
  recommendation,
  examples,
  create: (context: RuleContext) => {
    const namespaceBindings = new Set<string>();

    return {
      ImportDeclaration(node: EsTreeNode) {
        const sourceValue = node.source?.value;
        if (typeof sourceValue !== "string") return;
        if (handleExtraSource?.(node, context)) return;
        if (sourceValue !== source) return;

        for (const specifier of node.specifiers ?? []) {
          if (isNodeOfType(specifier, "ImportSpecifier")) {
            const importedName = specifier.imported?.name;
            if (!importedName) continue;
            const message = messages.get(importedName);
            if (message) context.report({ node: specifier, message });
            continue;
          }
          if (
            isNodeOfType(specifier, "ImportDefaultSpecifier") ||
            isNodeOfType(specifier, "ImportNamespaceSpecifier")
          ) {
            const localName = specifier.local?.name;
            if (localName) namespaceBindings.add(localName);
          }
        }
      },
      MemberExpression(node: EsTreeNode) {
        if (namespaceBindings.size === 0) return;
        if (node.computed) return;
        if (!isNodeOfType(node.object, "Identifier")) return;
        if (!namespaceBindings.has(node.object.name)) return;
        if (!isNodeOfType(node.property, "Identifier")) return;
        const message = messages.get(node.property.name);
        if (message) context.report({ node, message });
      },
    };
  },
});
