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

// Returns true if `body` (a function or arrow body) reaches at least
// one explicit `return <value>;` along every observable path. We don't
// own the CFG that oxc uses, so this is a structural approximation:
// (a) an arrow function with an expression body always returns, and
// (b) a block body returns if any contained statement is a
// non-implicit `ReturnStatement`. The block-walk doesn't descend into
// nested function definitions, so a nested `return` inside a callback
// doesn't satisfy the outer `render`.
const containsReturnStatement = (node: EsTreeNode): boolean => {
  if (
    isNodeOfType(node, "ArrowFunctionExpression") &&
    node.body &&
    !isNodeOfType(node.body, "BlockStatement")
  ) {
    return true;
  }
  const body =
    isNodeOfType(node, "ArrowFunctionExpression") ||
    isNodeOfType(node, "FunctionExpression") ||
    isNodeOfType(node, "FunctionDeclaration")
      ? node.body
      : null;
  if (!body || !isNodeOfType(body, "BlockStatement")) return false;
  return blockContainsReturn(body);
};

const blockContainsReturn = (block: EsTreeNodeOfType<"BlockStatement">): boolean => {
  for (const statement of block.body ?? []) {
    if (statementContainsReturn(statement)) return true;
  }
  return false;
};

const statementContainsReturn = (statement: EsTreeNode): boolean => {
  if (isNodeOfType(statement, "ReturnStatement")) return statement.argument !== null;
  if (isNodeOfType(statement, "BlockStatement")) return blockContainsReturn(statement);
  if (isNodeOfType(statement, "IfStatement")) {
    if (statementContainsReturn(statement.consequent)) return true;
    return statement.alternate ? statementContainsReturn(statement.alternate) : false;
  }
  if (
    isNodeOfType(statement, "SwitchStatement") ||
    isNodeOfType(statement, "TryStatement") ||
    isNodeOfType(statement, "ForStatement") ||
    isNodeOfType(statement, "ForInStatement") ||
    isNodeOfType(statement, "ForOfStatement") ||
    isNodeOfType(statement, "WhileStatement") ||
    isNodeOfType(statement, "DoWhileStatement") ||
    isNodeOfType(statement, "LabeledStatement") ||
    isNodeOfType(statement, "WithStatement")
  ) {
    return descendantContainsReturn(statement);
  }
  return false;
};

// Walks any statement subtree (switch cases, try/catch/finally, loop
// bodies) but stops at function boundaries — a `return` inside a
// nested arrow doesn't make the enclosing render return.
const descendantContainsReturn = (node: EsTreeNode): boolean => {
  let didFindReturn = false;
  const visit = (child: EsTreeNode | null | undefined): void => {
    if (didFindReturn || !child || typeof child !== "object") return;
    if (
      isNodeOfType(child, "FunctionDeclaration") ||
      isNodeOfType(child, "FunctionExpression") ||
      isNodeOfType(child, "ArrowFunctionExpression")
    ) {
      return;
    }
    if (isNodeOfType(child, "ReturnStatement") && child.argument !== null) {
      didFindReturn = true;
      return;
    }
    const record = child as unknown as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (key === "parent") continue;
      const value = record[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object" && "type" in item) visit(item as EsTreeNode);
        }
      } else if (value && typeof value === "object" && "type" in value) {
        visit(value as EsTreeNode);
      }
    }
  };
  visit(node);
  return didFindReturn;
};

interface RenderHostingDefinition {
  parent: EsTreeNode;
  keyNode: EsTreeNode | null;
}

// Returns the surrounding member / property declaration if `node` is
// the function used as the body of a `render` member on either an ES6
// class component (`MethodDefinition`/`PropertyDefinition` whose key
// is `render`) or an ES5 createReactClass-style object property.
const findRenderHost = (functionNode: EsTreeNode): RenderHostingDefinition | null => {
  const parent = functionNode.parent;
  if (!parent) return null;
  if (
    isNodeOfType(parent, "MethodDefinition") &&
    isNodeOfType(parent.key, "Identifier") &&
    parent.key.name === "render"
  ) {
    return { parent, keyNode: parent.key };
  }
  if (
    isNodeOfType(parent, "PropertyDefinition") &&
    isNodeOfType(parent.key, "Identifier") &&
    parent.key.name === "render" &&
    parent.value === functionNode
  ) {
    return { parent, keyNode: parent.key };
  }
  if (
    isNodeOfType(parent, "Property") &&
    isNodeOfType(parent.key, "Identifier") &&
    parent.key.name === "render" &&
    parent.value === functionNode
  ) {
    return { parent, keyNode: parent.key };
  }
  return null;
};

// True when the `render` member belongs to either an ES6 class
// component (class extends Component / PureComponent) or an ES5
// createReactClass call.
const isRenderInsideComponent = (definition: RenderHostingDefinition): boolean => {
  const definitionParent = definition.parent.parent;
  if (!definitionParent) return false;
  if (isNodeOfType(definitionParent, "ClassBody")) {
    const classNode = definitionParent.parent;
    if (!classNode) return false;
    return isReactClassComponent(classNode);
  }
  if (isNodeOfType(definitionParent, "ObjectExpression")) {
    const callExpression = definitionParent.parent;
    if (!callExpression) return false;
    return isCreateReactClassCall(callExpression);
  }
  return false;
};

// Ported from oxc's `react/require-render-return`. The CFG-based
// "every path returns" check is approximated structurally: any
// explicit `return <value>` reachable from the render body counts.
// Functions that throw / never return are still flagged, which
// matches the upstream eslint-plugin-react behavior.
export const reactRequireRenderReturn = defineRule<Rule>({
  id: "react-require-render-return",
  severity: "error",
  recommendation:
    "Add a `return` statement that yields the JSX (or `null`) — `render` must produce a value for React to mount",
  create: (context: RuleContext) => {
    const checkRenderFunction = (node: EsTreeNode): void => {
      const definition = findRenderHost(node);
      if (!definition) return;
      if (!isRenderInsideComponent(definition)) return;
      if (containsReturnStatement(node)) return;
      const reportNode = definition.keyNode ?? definition.parent;
      context.report({
        node: reportNode,
        message: "Your `render` method should have a `return` statement.",
      });
    };
    return {
      FunctionExpression(node: EsTreeNodeOfType<"FunctionExpression">) {
        checkRenderFunction(node);
      },
      ArrowFunctionExpression(node: EsTreeNodeOfType<"ArrowFunctionExpression">) {
        checkRenderFunction(node);
      },
    };
  },
});
