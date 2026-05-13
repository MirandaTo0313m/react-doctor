import type { EsTreeNode } from "../../utils/index.js";
import { BUILTIN_GLOBAL_NAMESPACE_NAMES } from "../../constants.js";
import { getRootIdentifierName } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: only collect return statements at the COMPONENT'S top level -
// nested function bodies (effect cleanups, useMemo/useCallback callbacks)
// have their own return semantics that aren't render output.

export const collectValueIdentifierNames = (
  node: EsTreeNode | null | undefined,
  into: string[],
): void => {
  if (!node || typeof node !== "object") return;
  if (isNodeOfType(node, "CallExpression")) {
    if (isNodeOfType(node.callee, "MemberExpression")) {
      // For `state.method(arg)`, `state` is a reactive read; `method`
      // is not. Skip the callee chain entirely when its root is a
      // built-in global (`Math.floor`, `JSON.parse`, ...) - those
      // aren't reactive reads either.
      const rootName = getRootIdentifierName(node.callee);
      if (!rootName || !BUILTIN_GLOBAL_NAMESPACE_NAMES.has(rootName)) {
        collectValueIdentifierNames(node.callee.object, into);
      }
    }
    for (const argument of node.arguments ?? []) {
      collectValueIdentifierNames(argument, into);
    }
    return;
  }
  if (isNodeOfType(node, "MemberExpression")) {
    const rootName = getRootIdentifierName(node);
    if (!rootName || !BUILTIN_GLOBAL_NAMESPACE_NAMES.has(rootName)) {
      collectValueIdentifierNames(node.object, into);
    }
    if (node.computed) collectValueIdentifierNames(node.property, into);
    return;
  }
  if (isNodeOfType(node, "Identifier")) {
    into.push(node.name);
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "type") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === "object" && item.type) {
          collectValueIdentifierNames(item, into);
        }
      }
    } else if (child && typeof child === "object" && child.type) {
      collectValueIdentifierNames(child, into);
    }
  }
};
