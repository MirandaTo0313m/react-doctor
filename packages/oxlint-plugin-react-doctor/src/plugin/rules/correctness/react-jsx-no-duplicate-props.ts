import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

// Ported from oxc's `react/jsx-no-duplicate-props`. Reports any JSX
// element that names the same prop twice. Props in JSX are
// case-sensitive, so casing-only differences (e.g. `<App foo Foo />`)
// are intentionally not flagged — matching oxc's behavior.
export const reactJsxNoDuplicateProps = defineRule<Rule>({
  id: "react-jsx-no-duplicate-props",
  severity: "error",
  recommendation: "Remove one of the duplicates, or rename them so each prop name is distinct",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      const seenPropNames = new Set<string>();
      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
        const propName = attribute.name.name;
        if (seenPropNames.has(propName)) {
          context.report({
            node: attribute.name,
            message: `No duplicate props allowed. The prop "${propName}" is duplicated.`,
          });
          continue;
        }
        seenPropNames.add(propName);
      }
    },
  }),
});
