import { defineRule } from "../../registry.js";
import { BARREL_INDEX_SUFFIXES, TEST_OR_INFRA_FILE_PATTERN, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const INDEX_FILE_PATTERN = /\/index\.[cm]?[jt]sx?$/;

const isTypeOnlyImport = (node: EsTreeNode): boolean => {
  if (node.importKind === "type") return true;
  const specifiers = node.specifiers ?? [];
  return (
    specifiers.length > 0 &&
    specifiers.every(
      (specifier: EsTreeNode) =>
        isNodeOfType(specifier, "ImportSpecifier") && specifier.importKind === "type",
    )
  );
};

export const noBarrelImport = defineRule<Rule>({
  recommendation:
    "Import directly from source files or configure framework-level package import optimization instead of importing through large barrels.",
  examples: [
    {
      before: `import { Button } from "@ui";`,
      after: `import { Button } from "@ui/button";`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const isTestOrInfraFile = TEST_OR_INFRA_FILE_PATTERN.test(filename);
    const isSelfIndexFile = INDEX_FILE_PATTERN.test(filename);
    let didReportForFile = false;

    return {
      ImportDeclaration(node: EsTreeNode) {
        if (isTestOrInfraFile) return;
        if (isSelfIndexFile) return;
        if (isTypeOnlyImport(node)) return;
        if (didReportForFile) return;

        const source = node.source?.value;
        if (typeof source !== "string" || !source.startsWith(".")) return;

        if (BARREL_INDEX_SUFFIXES.some((suffix) => source.endsWith(suffix))) {
          didReportForFile = true;
          context.report({
            node,
            message:
              "Import from barrel/index file - import directly from the source module for better tree-shaking",
          });
        }
      },
    };
  },
});
