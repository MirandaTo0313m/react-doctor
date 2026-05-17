import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const MESSAGE =
  "Do not use isMounted() — it is an anti-pattern and will be removed in future React versions. Use componentDidMount/componentWillUnmount lifecycle or state to track mount status instead.";

export const noIsMounted = defineRule<Rule>({
  id: "no-is-mounted",
  severity: "warn",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (
        isNodeOfType(node.callee, "MemberExpression") &&
        isNodeOfType(node.callee.object, "ThisExpression") &&
        isNodeOfType(node.callee.property, "Identifier") &&
        node.callee.property.name === "isMounted"
      ) {
        context.report({ node, message: MESSAGE });
      }
    },
  }),
});
