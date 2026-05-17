import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";

// Port of `oxc_linter::utils::react::is_create_element_call`. Returns true
// when `node` is a `CallExpression` whose callee is one of:
//   - `createElement(...)`
//   - `<X>.createElement(...)` (where `X` is any identifier other than `document`)
//   - `<X>["createElement"](...)` computed access (same `document` exclusion)
// Excludes `document.createElement` since that's the DOM API, not React's.
export const isCreateElementCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;

  if (isNodeOfType(callee, "Identifier")) return callee.name === "createElement";

  if (isNodeOfType(callee, "MemberExpression")) {
    if (isNodeOfType(callee.object, "Identifier") && callee.object.name === "document") {
      return false;
    }
    if (callee.computed) {
      return isNodeOfType(callee.property, "Literal") && callee.property.value === "createElement";
    }
    return isNodeOfType(callee.property, "Identifier") && callee.property.name === "createElement";
  }

  return false;
};
