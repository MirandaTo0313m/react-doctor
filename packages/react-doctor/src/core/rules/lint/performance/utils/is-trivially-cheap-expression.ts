import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSimpleExpression } from "../../utils/index.js";

// HACK: detect static JSX declared inside a component body - anything like
// `const Header = <h1>Hi</h1>` inside a render function gets recreated on
// every render. If the JSX has no expression containers referencing local
// scope (no props, no state), it can be hoisted to module scope.

export const isTriviallyCheapExpression = (node: EsTreeNode | null): boolean => {
  if (!node) return false;
  if (!isSimpleExpression(node)) return false;
  if (isNodeOfType(node, "Identifier")) return false;
  if (isNodeOfType(node, "MemberExpression")) return false;
  return true;
};
