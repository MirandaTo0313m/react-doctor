import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const REACT_BASE_CLASS_NAMES = new Set(["Component", "PureComponent"]);

const isReactBaseClassReference = (node: EsTreeNode | null | undefined): boolean => {
  if (!node) return false;
  if (isNodeOfType(node, "Identifier")) return REACT_BASE_CLASS_NAMES.has(node.name);
  if (isNodeOfType(node, "MemberExpression") && isNodeOfType(node.property, "Identifier")) {
    return REACT_BASE_CLASS_NAMES.has(node.property.name);
  }
  return false;
};

const isReactClassComponent = (classNode: EsTreeNode): boolean => {
  if (!isNodeOfType(classNode, "ClassDeclaration") && !isNodeOfType(classNode, "ClassExpression"))
    return false;
  return isReactBaseClassReference(classNode.superClass);
};

const isCreateReactClassCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (isNodeOfType(node.callee, "Identifier")) return node.callee.name === "createReactClass";
  if (
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.property, "Identifier")
  ) {
    return node.callee.property.name === "createReactClass";
  }
  return false;
};

// Returns the deepest `MemberExpression` whose root object is `this`,
// climbing through nested property accesses (so `this.state.foo.bar`
// is recognised the same as `this.state.foo`). Mirrors oxc's
// `get_outer_member_expression` + `is_state_member_expression` pair.
const findThisStateMemberExpression = (
  expression: EsTreeNode | null | undefined,
): EsTreeNodeOfType<"MemberExpression"> | null => {
  if (!expression) return null;
  if (!isNodeOfType(expression, "MemberExpression")) return null;
  let current: EsTreeNodeOfType<"MemberExpression"> = expression;
  while (isNodeOfType(current.object, "MemberExpression")) {
    current = current.object;
  }
  if (!isNodeOfType(current.object, "ThisExpression")) return null;
  if (!isNodeOfType(current.property, "Identifier")) return null;
  if (current.property.name !== "state") return null;
  return expression;
};

interface ContextFlags {
  isInsideComponent: boolean;
  isInsideConstructor: boolean;
  isInsideCallExpression: boolean;
}

const collectAncestorContextFlags = (node: EsTreeNode): ContextFlags => {
  const flags: ContextFlags = {
    isInsideComponent: false,
    isInsideConstructor: false,
    isInsideCallExpression: false,
  };
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "MethodDefinition") &&
      current.kind === "constructor" &&
      !flags.isInsideCallExpression
    ) {
      flags.isInsideConstructor = true;
    }
    if (isNodeOfType(current, "CallExpression")) {
      flags.isInsideCallExpression = true;
      if (isCreateReactClassCall(current)) flags.isInsideComponent = true;
    }
    if (
      (isNodeOfType(current, "ClassDeclaration") || isNodeOfType(current, "ClassExpression")) &&
      isReactClassComponent(current)
    ) {
      flags.isInsideComponent = true;
      break;
    }
    current = current.parent;
  }
  return flags;
};

const shouldIgnoreContext = (node: EsTreeNode): boolean => {
  const flags = collectAncestorContextFlags(node);
  if (!flags.isInsideComponent) return true;
  if (flags.isInsideConstructor && !flags.isInsideCallExpression) return true;
  return false;
};

// Ported from oxc's `react/no-direct-mutation-state`. Mutating
// `this.state` directly does not cause a re-render and is silently
// overwritten by the next `setState`. The constructor is exempted
// because `this.state = {...}` is the canonical initial-assignment
// form (only flagged when wrapped in a callback / nested function).
export const reactNoDirectMutationState = defineRule<Rule>({
  id: "react-no-direct-mutation-state",
  severity: "error",
  recommendation:
    "Treat `this.state` as immutable: build a new object and pass it to `this.setState({...})`. The constructor is the only place a direct `this.state = {...}` assignment is allowed",
  create: (context: RuleContext) => ({
    AssignmentExpression(node: EsTreeNodeOfType<"AssignmentExpression">) {
      const targetMember = findThisStateMemberExpression(node.left);
      if (!targetMember) return;
      if (shouldIgnoreContext(node)) return;
      context.report({ node: node.left, message: "Never mutate `this.state` directly." });
    },
    UpdateExpression(node: EsTreeNodeOfType<"UpdateExpression">) {
      const targetMember = findThisStateMemberExpression(node.argument);
      if (!targetMember) return;
      if (shouldIgnoreContext(node)) return;
      context.report({ node, message: "Never mutate `this.state` directly." });
    },
  }),
});
