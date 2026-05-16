import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isReactHookName } from "../../utils/is-react-hook-name.js";
import { isUppercaseName } from "../../utils/is-uppercase-name.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

interface NamedFunctionContext {
  type: "component-or-hook" | "regular-function" | "no-name";
  functionName: string | null;
  functionNode: EsTreeNode;
  isAsync: boolean;
}

const HOC_CALLEE_NAMES = new Set(["memo", "forwardRef", "observer"]);

const isHocWrappedFunction = (functionNode: EsTreeNode): boolean => {
  const parent: EsTreeNode | null | undefined = functionNode.parent;
  if (!parent) return false;
  if (!isNodeOfType(parent, "CallExpression")) return false;
  if (!parent.arguments || parent.arguments[0] !== functionNode) return false;
  if (isNodeOfType(parent.callee, "Identifier")) {
    return HOC_CALLEE_NAMES.has(parent.callee.name);
  }
  if (
    isNodeOfType(parent.callee, "MemberExpression") &&
    isNodeOfType(parent.callee.property, "Identifier")
  ) {
    return HOC_CALLEE_NAMES.has(parent.callee.property.name);
  }
  return false;
};

// Discovers the lexically enclosing function and produces a label that
// classifies it. Names come from a few different shapes:
// * `function Foo() {}` → `Foo`
// * `const Foo = () => {}` (variable declarator)
// * `const Foo = memo(() => {})` (HOC-wrapped — name comes from the
//   enclosing variable declarator).
// Anything else (anonymous arrow inside a method body, immediately-invoked
// function expression, etc.) is classified as `no-name`.
const findEnclosingFunctionContext = (callNode: EsTreeNode): NamedFunctionContext | null => {
  let current: EsTreeNode | null | undefined = callNode.parent;
  while (current) {
    if (
      isNodeOfType(current, "FunctionDeclaration") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "ArrowFunctionExpression")
    ) {
      const isAsync = current.async === true;
      const functionName = resolveFunctionName(current);
      const classification = classifyFunctionName(functionName);
      return { type: classification, functionName, functionNode: current, isAsync };
    }
    if (
      isNodeOfType(current, "ClassDeclaration") ||
      isNodeOfType(current, "ClassExpression") ||
      isNodeOfType(current, "MethodDefinition")
    ) {
      return null;
    }
    current = current.parent;
  }
  return null;
};

const classifyFunctionName = (functionName: string | null): NamedFunctionContext["type"] => {
  if (!functionName) return "no-name";
  if (isUppercaseName(functionName)) return "component-or-hook";
  if (isReactHookName(functionName)) return "component-or-hook";
  return "regular-function";
};

const resolveFunctionName = (functionNode: EsTreeNode): string | null => {
  if (isNodeOfType(functionNode, "FunctionDeclaration") && functionNode.id?.name) {
    return functionNode.id.name;
  }
  if (
    isNodeOfType(functionNode, "FunctionExpression") &&
    functionNode.id &&
    isNodeOfType(functionNode.id, "Identifier")
  ) {
    return functionNode.id.name;
  }
  let host: EsTreeNode | null | undefined = functionNode.parent;
  // Step through HOC wrappers like `memo(forwardRef(...))` to reach
  // the variable declarator that names the component.
  while (host) {
    if (isNodeOfType(host, "VariableDeclarator")) {
      if (isNodeOfType(host.id, "Identifier")) return host.id.name;
      return null;
    }
    if (isNodeOfType(host, "Property")) {
      if (isNodeOfType(host.key, "Identifier")) return host.key.name;
      return null;
    }
    if (isNodeOfType(host, "AssignmentExpression")) {
      if (isNodeOfType(host.left, "Identifier")) return host.left.name;
      return null;
    }
    if (
      isNodeOfType(host, "CallExpression") &&
      ((isNodeOfType(host.callee, "Identifier") && HOC_CALLEE_NAMES.has(host.callee.name)) ||
        (isNodeOfType(host.callee, "MemberExpression") &&
          isNodeOfType(host.callee.property, "Identifier") &&
          HOC_CALLEE_NAMES.has(host.callee.property.name)))
    ) {
      host = host.parent;
      continue;
    }
    return null;
  }
  return null;
};

const CONDITIONAL_PARENT_KINDS = new Set([
  "IfStatement",
  "ConditionalExpression",
  "LogicalExpression",
  "SwitchCase",
  "TryStatement",
]);

const LOOP_PARENT_KINDS = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
]);

interface CallSiteShape {
  insideConditional: boolean;
  insideLoop: boolean;
}

// Walks ancestors between `node` and the enclosing function looking
// for if/switch/try/conditional/loop boundaries. We don't try to
// simulate full CFG reachability the way oxc does — the lexical
// presence of any of these shapes is enough to violate the rule
// (calling a hook conditionally in any of them changes call order).
const describeCallSiteShape = (
  hookNode: EsTreeNode,
  enclosingFunction: EsTreeNode,
): CallSiteShape => {
  const shape: CallSiteShape = { insideConditional: false, insideLoop: false };
  let current: EsTreeNode | null | undefined = hookNode.parent;
  while (current && current !== enclosingFunction) {
    if (CONDITIONAL_PARENT_KINDS.has(current.type)) {
      shape.insideConditional = true;
    }
    if (LOOP_PARENT_KINDS.has(current.type)) {
      shape.insideLoop = true;
    }
    current = current.parent;
  }
  return shape;
};

const isHookCall = (node: EsTreeNodeOfType<"CallExpression">): { hookName: string } | null => {
  if (isNodeOfType(node.callee, "Identifier") && isReactHookName(node.callee.name)) {
    return { hookName: node.callee.name };
  }
  if (
    isNodeOfType(node.callee, "MemberExpression") &&
    isNodeOfType(node.callee.property, "Identifier") &&
    isReactHookName(node.callee.property.name)
  ) {
    return { hookName: node.callee.property.name };
  }
  return null;
};

// Ported from oxc's `react/rules-of-hooks` as a structural / lexical
// check (vs. the upstream CFG-based analysis). Catches the three
// most-common violations:
//   1. Hook called outside a component / hook function entirely (top
//      level or from a non-component helper).
//   2. Hook called from a non-uppercase / non-hook-named function
//      (typical "regular helper that uses state" mistake).
//   3. Hook called inside a conditional / loop / try branch within an
//      otherwise-valid component.
// Misses: early-return-after-hook ordering bugs, nested-callback
// hooks under `Array.prototype.map`, deeply-nested CFG paths. Those
// require full CFG analysis and are covered by `react-hooks-js/*`
// (the React Compiler frontend).
export const reactRulesOfHooks = defineRule<Rule>({
  id: "react-rules-of-hooks",
  severity: "error",
  recommendation:
    "Move the hook call to the top level of a component (uppercase name) or custom hook (`use*` name). Never call hooks inside loops, conditions, try/catch, nested helpers, or after early returns",
  create: (context: RuleContext) => ({
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      const hookCallInfo = isHookCall(node);
      if (!hookCallInfo) return;

      const enclosing = findEnclosingFunctionContext(node);
      if (!enclosing) {
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" cannot be called at the top level.`,
        });
        return;
      }

      if (enclosing.type === "no-name") {
        if (isHocWrappedFunction(enclosing.functionNode)) return;
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" is called inside a callback that is neither a React component nor a custom Hook.`,
        });
        return;
      }

      if (enclosing.type === "regular-function") {
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" is called in function "${enclosing.functionName}" that is neither a React component nor a custom Hook (component names start uppercase, hook names start with "use").`,
        });
        return;
      }

      if (enclosing.isAsync) {
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" cannot be called in an async function.`,
        });
        return;
      }

      const shape = describeCallSiteShape(node, enclosing.functionNode);
      if (shape.insideLoop) {
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" may be executed more than once because it is called in a loop. Hooks must be called in the same order on every render.`,
        });
        return;
      }
      if (shape.insideConditional) {
        context.report({
          node,
          message: `React Hook "${hookCallInfo.hookName}" is called conditionally. Hooks must be called unconditionally on every render.`,
        });
      }
    },
  }),
});
