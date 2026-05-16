import { defineRule } from "../../utils/define-rule.js";
import { hasJsxAttribute } from "../../utils/has-jsx-attribute.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

const ITERATOR_METHOD_NAMES = new Set(["map", "flatMap", "from"]);

interface ContainingIteratorContext {
  kind: "array" | "iterator";
}

const findCallExpressionAncestor = (
  node: EsTreeNode,
): EsTreeNodeOfType<"CallExpression"> | null => {
  let current: EsTreeNode | null | undefined = node;
  while (current) {
    if (isNodeOfType(current, "CallExpression")) return current;
    current = current.parent;
  }
  return null;
};

const isInsideChildrenToArrayCall = (jsxNode: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = jsxNode.parent;
  while (current) {
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "MemberExpression") &&
      isNodeOfType(current.callee.property, "Identifier") &&
      current.callee.property.name === "toArray"
    ) {
      const receiver = current.callee.object;
      // Match `<X>.Children.toArray(...)` (e.g. `React.Children.toArray`)
      // or a destructured `Children.toArray(...)`. We don't try to
      // resolve imports, just the lexical shape.
      if (
        isNodeOfType(receiver, "MemberExpression") &&
        isNodeOfType(receiver.property, "Identifier") &&
        receiver.property.name === "Children"
      ) {
        return true;
      }
      if (isNodeOfType(receiver, "Identifier") && receiver.name === "Children") {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
};

// Mirrors oxc's `is_in_array_or_iter`: walks up from the JSX element
// until we either find an array literal containing it, an iterator
// call (`.map` / `.flatMap` / `Array.from`) whose mapping argument
// contains it, or hit a boundary that means the element isn't really
// inside an iterator (a JSX parent / object property / explicit
// non-return statement, etc.).
const findContainingIteratorContext = (jsxNode: EsTreeNode): ContainingIteratorContext | null => {
  let node: EsTreeNode = jsxNode;
  let isOutsideContainingFunction = false;
  let isExplicitReturn = false;

  while (node.parent) {
    const parent = node.parent;
    if (isNodeOfType(parent, "ArrowFunctionExpression")) {
      const isExpressionBody = !isNodeOfType(parent.body, "BlockStatement");
      if (!isExplicitReturn && !isExpressionBody) return null;
      const grandparent = parent.parent;
      if (grandparent && isNodeOfType(grandparent, "Property")) return null;
      if (isOutsideContainingFunction) return null;
      isOutsideContainingFunction = true;
    } else if (isNodeOfType(parent, "FunctionExpression")) {
      const grandparent = parent.parent;
      if (grandparent && isNodeOfType(grandparent, "Property")) return null;
      if (isOutsideContainingFunction) return null;
      isOutsideContainingFunction = true;
    } else if (isNodeOfType(parent, "FunctionDeclaration")) {
      if (isOutsideContainingFunction) return null;
      isOutsideContainingFunction = true;
    } else if (isNodeOfType(parent, "ArrayExpression")) {
      if (isOutsideContainingFunction) return null;
      return { kind: "array" };
    } else if (isNodeOfType(parent, "CallExpression")) {
      const callee = parent.callee;
      if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
        const methodName = callee.property.name;
        if (
          ITERATOR_METHOD_NAMES.has(methodName) &&
          parent.arguments &&
          parent.arguments.length > 0
        ) {
          const targetArgumentIndex = methodName === "from" ? 1 : 0;
          const targetArgument = parent.arguments[targetArgumentIndex];
          if (targetArgument && isNodeContainedIn(jsxNode, targetArgument)) {
            return { kind: "iterator" };
          }
        }
      }
      return null;
    } else if (
      isNodeOfType(parent, "JSXElement") ||
      isNodeOfType(parent, "JSXOpeningElement") ||
      isNodeOfType(parent, "Property") ||
      isNodeOfType(parent, "JSXFragment")
    ) {
      return null;
    } else if (isNodeOfType(parent, "ReturnStatement")) {
      isExplicitReturn = true;
    } else if (isNodeOfType(parent, "Program")) {
      return null;
    }
    node = parent;
  }
  return null;
};

const isNodeContainedIn = (target: EsTreeNode, ancestor: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = target;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
};

const hasKeyAttribute = (openingElement: EsTreeNodeOfType<"JSXOpeningElement">): boolean =>
  hasJsxAttribute(openingElement.attributes ?? [], "key");

interface KeyBeforeSpreadCheckResult {
  spreadIndex: number;
  keyIndex: number;
  keyNameNode: EsTreeNode;
}

const findKeyAfterSpread = (
  openingElement: EsTreeNodeOfType<"JSXOpeningElement">,
): KeyBeforeSpreadCheckResult | null => {
  let keyEntry: KeyBeforeSpreadCheckResult | null = null;
  let spreadIndex = -1;
  for (
    let attributeIndex = 0;
    attributeIndex < (openingElement.attributes ?? []).length;
    attributeIndex++
  ) {
    const attribute = openingElement.attributes[attributeIndex];
    if (isNodeOfType(attribute, "JSXSpreadAttribute")) {
      spreadIndex = attributeIndex;
      continue;
    }
    if (
      isNodeOfType(attribute, "JSXAttribute") &&
      isNodeOfType(attribute.name, "JSXIdentifier") &&
      attribute.name.name === "key"
    ) {
      if (spreadIndex >= 0) {
        keyEntry = {
          spreadIndex,
          keyIndex: attributeIndex,
          keyNameNode: attribute.name,
        };
      }
    }
  }
  return keyEntry;
};

interface KeyValueDescription {
  keyValue: string;
  attributeNode: EsTreeNodeOfType<"JSXAttribute">;
}

const extractStaticKeyValue = (
  jsxElement: EsTreeNodeOfType<"JSXElement">,
): KeyValueDescription | null => {
  for (const attribute of jsxElement.openingElement.attributes ?? []) {
    if (!isNodeOfType(attribute, "JSXAttribute")) continue;
    if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
    if (attribute.name.name !== "key") continue;
    if (!attribute.value) continue;
    if (isNodeOfType(attribute.value, "Literal") && typeof attribute.value.value === "string") {
      return { keyValue: attribute.value.value, attributeNode: attribute };
    }
    if (isNodeOfType(attribute.value, "JSXExpressionContainer")) {
      const expression = attribute.value.expression;
      if (isNodeOfType(expression, "Literal")) {
        if (typeof expression.value === "string" || typeof expression.value === "number") {
          return { keyValue: String(expression.value), attributeNode: attribute };
        }
      }
      if (
        isNodeOfType(expression, "TemplateLiteral") &&
        expression.expressions?.length === 0 &&
        expression.quasis?.length === 1
      ) {
        return { keyValue: expression.quasis[0].value.raw, attributeNode: attribute };
      }
    }
  }
  return null;
};

// Ported from oxc's `react/jsx-key`. Three checks: (1) every JSX
// element produced by a `.map` / `.flatMap` / `Array.from` callback or
// referenced from inside an array literal must have a `key` prop;
// (2) `key` must appear before any `{...spread}` to avoid React's new
// JSX transform stripping it; (3) sibling JSX children with literal
// duplicate keys are flagged. `React.Children.toArray(...)` and the
// destructured `Children.toArray(...)` form are exempted because that
// helper assigns its own keys.
export const reactJsxKey = defineRule<Rule>({
  id: "react-jsx-key",
  severity: "error",
  recommendation:
    "Add a stable `key` prop derived from a unique field on each item: `items.map(item => <Row key={item.id} />)`. The key must come before any `{...spread}`",
  create: (context: RuleContext) => {
    const checkElementInIterator = (node: EsTreeNodeOfType<"JSXElement">): void => {
      const iteratorContext = findContainingIteratorContext(node);
      if (!iteratorContext) return;
      if (isInsideChildrenToArrayCall(node)) return;
      if (hasKeyAttribute(node.openingElement)) return;
      const containingCall = findCallExpressionAncestor(node);
      const messageContext =
        iteratorContext.kind === "array" || !containingCall ? "in array" : "in iterator";
      context.report({
        node: node.openingElement.name ?? node.openingElement,
        message: `Missing "key" prop for element ${messageContext}.`,
      });
    };

    const checkFragmentInIterator = (node: EsTreeNodeOfType<"JSXFragment">): void => {
      const iteratorContext = findContainingIteratorContext(node);
      if (!iteratorContext) return;
      if (isInsideChildrenToArrayCall(node)) return;
      const messageContext = iteratorContext.kind === "array" ? "in array" : "in iterator";
      context.report({
        node: node.openingFragment ?? node,
        message: `Missing "key" prop for element ${messageContext}.`,
      });
    };

    const checkKeyBeforeSpread = (node: EsTreeNodeOfType<"JSXElement">): void => {
      const keyAfterSpread = findKeyAfterSpread(node.openingElement);
      if (!keyAfterSpread) return;
      context.report({
        node: keyAfterSpread.keyNameNode,
        message: '"key" prop must be placed before any `{...spread}`',
      });
    };

    const checkDuplicateKeysInArray = (node: EsTreeNodeOfType<"ArrayExpression">): void => {
      const seenKeys = new Set<string>();
      for (const element of node.elements ?? []) {
        if (!element || !isNodeOfType(element, "JSXElement")) continue;
        const keyDescription = extractStaticKeyValue(element);
        if (!keyDescription) continue;
        if (seenKeys.has(keyDescription.keyValue)) {
          context.report({
            node: keyDescription.attributeNode,
            message: `Duplicate key '${keyDescription.keyValue}' found in JSX elements`,
          });
          continue;
        }
        seenKeys.add(keyDescription.keyValue);
      }
    };

    const checkDuplicateKeysInChildren = (node: EsTreeNodeOfType<"JSXElement">): void => {
      const seenKeys = new Set<string>();
      for (const child of node.children ?? []) {
        if (!isNodeOfType(child, "JSXElement")) continue;
        const keyDescription = extractStaticKeyValue(child);
        if (!keyDescription) continue;
        if (seenKeys.has(keyDescription.keyValue)) {
          context.report({
            node: keyDescription.attributeNode,
            message: `Duplicate key '${keyDescription.keyValue}' found in JSX elements`,
          });
          continue;
        }
        seenKeys.add(keyDescription.keyValue);
      }
    };

    return {
      JSXElement(node: EsTreeNodeOfType<"JSXElement">) {
        checkElementInIterator(node);
        checkKeyBeforeSpread(node);
        checkDuplicateKeysInChildren(node);
      },
      JSXFragment(node: EsTreeNodeOfType<"JSXFragment">) {
        checkFragmentInIterator(node);
      },
      ArrayExpression(node: EsTreeNodeOfType<"ArrayExpression">) {
        checkDuplicateKeysInArray(node);
      },
    };
  },
});
