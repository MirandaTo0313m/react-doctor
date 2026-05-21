import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

export const noFullLodashImport = defineRule<Rule>({
  id: "no-full-lodash-import",
  tags: ["test-noise"],
  severity: "warn",
  recommendation:
    "Import the specific function: `import debounce from 'lodash/debounce'` — saves ~70kb",
  create: (context: RuleContext) => ({
    ImportDeclaration(node: EsTreeNodeOfType<"ImportDeclaration">) {
      const source = node.source?.value;
      // `lodash-es` ships ES modules that bundlers can tree-shake
      // (each function is a separate file); only the legacy bundled
      // `lodash` import pulls the whole library. Flagging
      // `lodash-es` would just push users to a more awkward import
      // form for the same byte cost.
      if (source === "lodash") {
        context.report({
          node,
          message: "Importing entire lodash library — import from 'lodash/functionName' instead",
        });
      }
    },
  }),
});
