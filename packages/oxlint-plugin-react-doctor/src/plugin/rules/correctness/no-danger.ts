import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const MESSAGE = "Avoid using dangerouslySetInnerHTML — it bypasses React's DOM diffing and can cause XSS vulnerabilities";

export const noDanger = defineRule<Rule>({
  id: "no-danger",
  severity: "warn",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (
        isNodeOfType(node.name, "JSXIdentifier") &&
        node.name.name === "dangerouslySetInnerHTML"
      ) {
        context.report({ node, message: MESSAGE });
      }
    },
  }),
});
