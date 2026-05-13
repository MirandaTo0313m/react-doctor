import type { EsTreeNode } from "./es-tree-node.js";
import { FETCH_CALLEE_NAMES } from "../constants.js";
import { FETCH_MEMBER_OBJECTS } from "../constants.js";
import { isNodeOfType } from "./is-node-of-type.js";
import { walkAst } from "./walk-ast.js";

export const containsFetchCall = (node: EsTreeNode): boolean => {
  let didFindFetchCall = false;
  walkAst(node, (child) => {
    if (didFindFetchCall || !isNodeOfType(child, "CallExpression")) return;
    if (isNodeOfType(child.callee, "Identifier") && FETCH_CALLEE_NAMES.has(child.callee.name)) {
      didFindFetchCall = true;
    }
    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.object, "Identifier") &&
      FETCH_MEMBER_OBJECTS.has(child.callee.object.name)
    ) {
      didFindFetchCall = true;
    }
  });
  return didFindFetchCall;
};
