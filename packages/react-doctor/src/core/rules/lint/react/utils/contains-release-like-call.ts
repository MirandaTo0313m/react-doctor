import type { EsTreeNode } from "../../utils/index.js";
import { isReleaseLikeCall } from "./is-release-like-call.js";
import { walkAst } from "../../utils/index.js";

export const containsReleaseLikeCall = (
  node: EsTreeNode,
  knownBoundReleaseNames: ReadonlySet<string>,
): boolean => {
  let didFindRelease = false;
  walkAst(node, (child: EsTreeNode) => {
    if (didFindRelease) return false;
    if (isReleaseLikeCall(child, knownBoundReleaseNames)) {
      didFindRelease = true;
      return false;
    }
  });
  return didFindRelease;
};
