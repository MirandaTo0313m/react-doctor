import type { EsTreeNode } from "../../utils/index.js";
import { SUBSCRIPTION_METHOD_NAMES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

// Recognizes the four cleanup-return shapes uniformly:
//   return unsub                              → bound name match
//   return store.subscribe(handler)           → subscribe call IS the unsub
//   return () => unsub()                      → closure releases via name
//   return () => store.removeListener(...)    → closure releases via verb

export const isSubscribeLikeCallExpression = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  if (!isNodeOfType(node.callee, "MemberExpression")) return false;
  if (!isNodeOfType(node.callee.property, "Identifier")) return false;
  return SUBSCRIPTION_METHOD_NAMES.has(node.callee.property.name);
};
