import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";

const MESSAGE = "Do not mutate this.state directly — use this.setState() instead";

const isThisStateMember = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "MemberExpression")) return false;
  if (isNodeOfType(node.object, "ThisExpression") && isNodeOfType(node.property, "Identifier") && node.property.name === "state")
    return true;
  if (isNodeOfType(node.object, "MemberExpression")) return isThisStateMember(node.object);
  return false;
};

const isInsideConstructor = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (isNodeOfType(current, "MethodDefinition") && isNodeOfType(current.key, "Identifier") && current.key.name === "constructor")
      return true;
    if (isNodeOfType(current, "ClassBody")) return false;
    current = current.parent;
  }
  return false;
};

const isInsideClassComponent = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (isNodeOfType(current, "ClassDeclaration") || isNodeOfType(current, "ClassExpression")) return true;
    current = current.parent;
  }
  return false;
};

export const noDirectMutationState = defineRule<Rule>({
  id: "no-direct-mutation-state",
  severity: "error",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    AssignmentExpression(node: EsTreeNodeOfType<"AssignmentExpression">) {
      if (!isThisStateMember(node.left)) return;
      if (!isInsideClassComponent(node)) return;
      if (isInsideConstructor(node)) return;
      context.report({ node, message: MESSAGE });
    },
    UpdateExpression(node: EsTreeNodeOfType<"UpdateExpression">) {
      if (!isThisStateMember(node.argument)) return;
      if (!isInsideClassComponent(node)) return;
      if (isInsideConstructor(node)) return;
      context.report({ node, message: MESSAGE });
    },
  }),
});
