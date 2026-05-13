import { defineRule } from "../../registry.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const hasDefaultOrNamespaceImport = (node: EsTreeNode): boolean =>
  (node.specifiers ?? []).some(
    (specifier: EsTreeNode) =>
      specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier",
  );

export const noFullLodashImport = defineRule<Rule>({
  recommendation:
    "Import only the lodash functions you use, or replace them with native JavaScript helpers where practical.",
  examples: [
    {
      before: `import _ from "lodash";`,
      after: `import debounce from "lodash/debounce";`,
    },
  ],
  create: (context: RuleContext) => ({
    ImportDeclaration(node: EsTreeNode) {
      const source = node.source?.value;
      if (node.importKind === "type") return;
      if (source !== "lodash" && source !== "lodash-es") return;
      if (source === "lodash-es" && !hasDefaultOrNamespaceImport(node)) return;
      if (source === "lodash" || hasDefaultOrNamespaceImport(node)) {
        context.report({
          node,
          message: "Importing entire lodash library - import from 'lodash/functionName' instead",
        });
      }
    },
  }),
});
