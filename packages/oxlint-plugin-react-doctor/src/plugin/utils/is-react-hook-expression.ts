import type { EsTreeNode } from "./es-tree-node.js";
import { isNodeOfType } from "./is-node-of-type.js";
import { isReactComponentName } from "./is-react-component-name.js";
import { isReactHookName } from "./is-react-hook-name.js";

// Port of `oxc_linter::utils::react::is_react_hook`. Returns true when the
// expression refers to something callable that follows the React Hook
// naming convention — either a bare `useFoo` Identifier, or a member
// expression `<Namespace>.useFoo` whose namespace is itself a valid
// component/PascalCase name (e.g. `React.useState`).
export const isReactHookExpression = (node: EsTreeNode): boolean => {
  if (isNodeOfType(node, "Identifier")) return isReactHookName(node.name);

  if (isNodeOfType(node, "MemberExpression") && !node.computed) {
    if (!isNodeOfType(node.property, "Identifier")) return false;
    if (!isReactHookName(node.property.name)) return false;
    return isNodeOfType(node.object, "Identifier") && isReactComponentName(node.object.name);
  }

  return false;
};
