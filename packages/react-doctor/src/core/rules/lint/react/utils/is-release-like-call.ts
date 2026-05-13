import type { EsTreeNode } from "../../utils/index.js";
import { CLEANUP_LIKE_RELEASE_CALLEE_NAMES } from "../../constants.js";
import { TIMER_CLEANUP_CALLEE_NAMES } from "../../constants.js";
import { UNSUBSCRIPTION_METHOD_NAMES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

export const isReleaseLikeCall = (
  callNode: EsTreeNode,
  knownBoundReleaseNames: ReadonlySet<string>,
): boolean => {
  if (!isNodeOfType(callNode, "CallExpression")) return false;
  const callee = callNode.callee;
  if (isNodeOfType(callee, "Identifier")) {
    if (TIMER_CLEANUP_CALLEE_NAMES.has(callee.name)) return true;
    if (CLEANUP_LIKE_RELEASE_CALLEE_NAMES.has(callee.name)) return true;
    if (knownBoundReleaseNames.has(callee.name)) return true;
    return false;
  }
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
    return UNSUBSCRIPTION_METHOD_NAMES.has(callee.property.name);
  }
  return false;
};
