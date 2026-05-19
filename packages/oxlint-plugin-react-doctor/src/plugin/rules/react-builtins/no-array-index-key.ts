import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { hasJsxPropIgnoreCase } from "../../utils/has-jsx-prop-ignore-case.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE =
  "Array index in `key` doesn't uniquely identify the element — re-renders may use stale state.";

const SECOND_INDEX_METHODS: ReadonlySet<string> = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "flatMap",
  "forEach",
  "map",
  "some",
]);

const THIRD_INDEX_METHODS: ReadonlySet<string> = new Set(["reduce", "reduceRight"]);

// Returns true when the receiver of the iteration call is provably
// "positional and stable" — its element order is determined by the
// iteration index itself, so an `index`-based key is correct by
// construction. Catches:
//   `Array.from({ length: N }).map((_, i) => ...)`
//   `Array(N).fill(...).map((_, i) => ...)`
//   `str.split(sep).map((_, i) => ...)`  (text-position iteration)
// In each of these the array's identity-vs-position is fixed by the
// source string/length — reordering can't happen, so using the index
// as the key is semantically right.
const isPositionallyStableIterationReceiver = (receiver: EsTreeNode): boolean => {
  if (!isNodeOfType(receiver, "CallExpression")) return false;
  const callee = receiver.callee;
  // Array.from({ length: N })  /  Array.from({ length: N }, ...)
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.object, "Identifier") &&
    callee.object.name === "Array" &&
    isNodeOfType(callee.property, "Identifier") &&
    callee.property.name === "from" &&
    receiver.arguments.length >= 1 &&
    isNodeOfType(receiver.arguments[0] as EsTreeNode, "ObjectExpression")
  ) {
    return true;
  }
  // Array(N) / new Array(N) — the result has a fixed length, can't reorder.
  if (isNodeOfType(callee, "Identifier") && callee.name === "Array") return true;
  // <expr>.split(...) — text-position iteration. Skip even if chained
  // (e.g. `text.split('\n')`).
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.property, "Identifier") &&
    callee.property.name === "split"
  ) {
    return true;
  }
  // Chained: `<expr>.fill(...).map(...)` — strip `.fill(...)` and
  // check the receiver. Pattern: `Array(N).fill(0)`.
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.property, "Identifier") &&
    (callee.property.name === "fill" || callee.property.name === "flat")
  ) {
    return isPositionallyStableIterationReceiver(callee.object as EsTreeNode);
  }
  return false;
};

// Find the iteration callback's index parameter binding (Identifier
// node) by walking up from a JSXOpeningElement / CallExpression until
// we find an enclosing array-iteration call.
//
// Returns null if the iteration source is positionally stable (see
// `isPositionallyStableIterationReceiver` above) — `index` keys ARE
// correct in those cases.
const findIndexParameterBinding = (node: EsTreeNode): EsTreeNodeOfType<"Identifier"> | null => {
  let walker: EsTreeNode | null | undefined = node.parent;
  while (walker) {
    if (
      isNodeOfType(walker, "ArrowFunctionExpression") ||
      isNodeOfType(walker, "FunctionExpression")
    ) {
      const callbackParent = walker.parent;
      if (callbackParent && isNodeOfType(callbackParent, "CallExpression")) {
        const callee = callbackParent.callee;
        const isFirstArg = callbackParent.arguments[0] === walker;
        if (
          isFirstArg &&
          isNodeOfType(callee, "MemberExpression") &&
          isNodeOfType(callee.property, "Identifier")
        ) {
          const methodName = callee.property.name;
          let position: number | null = null;
          if (SECOND_INDEX_METHODS.has(methodName)) position = 1;
          else if (THIRD_INDEX_METHODS.has(methodName)) position = 2;
          if (position !== null) {
            // Iteration source — `<receiver>.map((_, i) => ...)`.
            // Skip the entire rule if the receiver is positionally
            // stable.
            const receiver = callee.object as EsTreeNode;
            if (isPositionallyStableIterationReceiver(receiver)) return null;
            const params = walker.params;
            const param = params[position] as EsTreeNode | undefined;
            if (param && isNodeOfType(param, "Identifier")) {
              return param;
            }
          }
        }
      }
      // Don't cross a function boundary.
      return null;
    }
    walker = walker.parent ?? null;
  }
  return null;
};

const isIndexReference = (expression: EsTreeNode, paramName: string): boolean =>
  isNodeOfType(expression, "Identifier") && expression.name === paramName;

const expressionUsesIndex = (expression: EsTreeNode, paramName: string): boolean => {
  if (isIndexReference(expression, paramName)) return true;
  if (isNodeOfType(expression, "TemplateLiteral")) {
    return expression.expressions.some((innerExpression) =>
      isIndexReference(innerExpression as EsTreeNode, paramName),
    );
  }
  if (isNodeOfType(expression, "BinaryExpression")) {
    const usesInLeft = isIndexReference(expression.left as EsTreeNode, paramName);
    const usesInRight = isIndexReference(expression.right as EsTreeNode, paramName);
    if (usesInLeft || usesInRight) return true;
    if (
      isNodeOfType(expression.left as EsTreeNode, "BinaryExpression") &&
      expressionUsesIndex(expression.left as EsTreeNode, paramName)
    )
      return true;
    if (
      isNodeOfType(expression.right as EsTreeNode, "BinaryExpression") &&
      expressionUsesIndex(expression.right as EsTreeNode, paramName)
    )
      return true;
    return false;
  }
  if (isNodeOfType(expression, "CallExpression")) {
    // index.toString()
    if (
      isNodeOfType(expression.callee, "MemberExpression") &&
      isNodeOfType(expression.callee.property, "Identifier") &&
      expression.callee.property.name === "toString" &&
      isIndexReference(expression.callee.object as EsTreeNode, paramName)
    ) {
      return true;
    }
    // String(index)
    if (
      isNodeOfType(expression.callee, "Identifier") &&
      expression.callee.name === "String" &&
      expression.arguments.length > 0 &&
      isIndexReference(expression.arguments[0] as EsTreeNode, paramName)
    ) {
      return true;
    }
  }
  return false;
};

const isReactCloneElement = (callExpression: EsTreeNodeOfType<"CallExpression">): boolean => {
  const callee = callExpression.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  if (callee.property.name !== "cloneElement") return false;
  return isNodeOfType(callee.object, "Identifier") && callee.object.name === "React";
};

// Port of `oxc_linter::rules::react::no_array_index_key`.
export const noArrayIndexKey = defineRule<Rule>({
  id: "no-array-index-key",
  severity: "warn",
  recommendation: "Use a stable, data-derived `key` instead of the array index.",
  category: "Performance",
  create: (context) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      const keyAttribute = hasJsxPropIgnoreCase(node.attributes, "key");
      if (!keyAttribute) return;
      if (!keyAttribute.value || !isNodeOfType(keyAttribute.value, "JSXExpressionContainer")) {
        return;
      }
      const expression = keyAttribute.value.expression as EsTreeNode;
      if (expression.type === "JSXEmptyExpression") return;
      const indexBinding = findIndexParameterBinding(node as EsTreeNode);
      if (!indexBinding) return;
      if (expressionUsesIndex(expression, indexBinding.name)) {
        context.report({ node: keyAttribute, message: MESSAGE });
      }
    },
    CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
      if (!isReactCloneElement(node)) return;
      if (node.arguments.length < 2 || node.arguments.length > 3) return;
      const propsArgument = node.arguments[1] as EsTreeNode;
      if (!isNodeOfType(propsArgument, "ObjectExpression")) return;
      const indexBinding = findIndexParameterBinding(node as EsTreeNode);
      if (!indexBinding) return;
      for (const property of propsArgument.properties) {
        if (!isNodeOfType(property, "Property")) continue;
        if (property.computed) continue;
        const propKey = property.key as EsTreeNode;
        let propName: string | null = null;
        if (isNodeOfType(propKey, "Identifier")) propName = propKey.name;
        else if (isNodeOfType(propKey, "Literal") && typeof propKey.value === "string") {
          propName = propKey.value;
        }
        if (propName !== "key") continue;
        if (expressionUsesIndex(property.value as EsTreeNode, indexBinding.name)) {
          context.report({ node: property, message: MESSAGE });
        }
      }
    },
  }),
});
