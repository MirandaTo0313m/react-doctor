import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: catches three uncontrolled-input mistakes that React's static
// rule set misses:
//   1. `value={...}` without `onChange` / `readOnly` - React renders
//      this as a silently read-only field at runtime.
//   2. `value` AND `defaultValue` set together - React ignores
//      defaultValue on a controlled input.
//   3. `value={state}` where `state` was initialized as undefined
//      (e.g. `useState()` with no argument) - the input starts
//      uncontrolled and flips to controlled on first set, which React
//      logs a runtime warning for.
//
// Bails when a spread attribute (`{...rest}`) is present - react-hook-form's
// `register()`, Headless UI, Radix, etc. routinely supply `onChange` /
// `defaultValue` via spread, and we can't see through it without scope
// analysis. False-negative > false-positive on a heavily used pattern.

const isModuleScopeConstArray = (receiver: EsTreeNode): boolean => {
  if (!isNodeOfType(receiver, "Identifier")) return false;
  const targetName = receiver.name;
  let programNode: EsTreeNode | null | undefined = receiver;
  while (programNode && !isNodeOfType(programNode, "Program")) {
    programNode = programNode.parent;
  }
  if (!programNode) return false;
  for (const statement of programNode.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration") || statement.kind !== "const") continue;
    for (const declarator of statement.declarations ?? []) {
      if (
        isNodeOfType(declarator.id, "Identifier") &&
        declarator.id.name === targetName &&
        isNodeOfType(declarator.init, "ArrayExpression")
      ) {
        return true;
      }
    }
  }
  return false;
};

export const isInsideStaticPlaceholderMap = (node: EsTreeNode): boolean => {
  let current = node;
  while (current.parent) {
    current = current.parent;
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "MemberExpression") &&
      current.callee.property?.name === "map"
    ) {
      const receiver = current.callee.object;
      if (isNodeOfType(receiver, "ArrayExpression")) return true;
      if (isModuleScopeConstArray(receiver)) return true;
      if (isNodeOfType(receiver, "CallExpression")) {
        const callee = receiver.callee;
        if (
          isNodeOfType(callee, "MemberExpression") &&
          isNodeOfType(callee.object, "Identifier") &&
          callee.object.name === "Array" &&
          callee.property?.name === "from"
        )
          return true;
      }
      if (
        isNodeOfType(receiver, "NewExpression") &&
        isNodeOfType(receiver.callee, "Identifier") &&
        receiver.callee.name === "Array"
      )
        return true;
    }
  }
  return false;
};
