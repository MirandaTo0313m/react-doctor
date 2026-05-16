import type { EsTreeNode } from "./es-tree-node.js";
import type { EsTreeNodeOfType } from "./es-tree-node-of-type.js";
import { isNodeOfType } from "./is-node-of-type.js";

// Mirrors oxc's `is_create_element_call`: matches `createElement(...)`,
// `<anything>.createElement(...)` (e.g. `React.createElement(...)`), but
// excludes `document.createElement(...)` because that returns a DOM
// element, not a React element.
export const isCreateElementCall = (node: EsTreeNodeOfType<"CallExpression">): boolean => {
  const callee: EsTreeNode = node.callee;
  if (isNodeOfType(callee, "Identifier")) return callee.name === "createElement";
  if (isNodeOfType(callee, "MemberExpression")) {
    if (isNodeOfType(callee.object, "Identifier") && callee.object.name === "document") {
      return false;
    }
    if (isNodeOfType(callee.property, "Identifier")) {
      return callee.property.name === "createElement";
    }
  }
  return false;
};
