import type { EsTreeNode } from "../../utils/index.js";
import { isCleanupReturn } from "./is-cleanup-return.js";
import { isNodeOfType } from "../../utils/index.js";

export const cleanupReleasesSubscription = (
  effectBodyStatements: EsTreeNode[],
  boundUnsubscribeName: string | null,
): boolean => {
  const lastStatement = effectBodyStatements[effectBodyStatements.length - 1];
  if (!isNodeOfType(lastStatement, "ReturnStatement")) return false;
  const knownBoundReleaseNames = new Set<string>();
  if (boundUnsubscribeName) knownBoundReleaseNames.add(boundUnsubscribeName);
  return isCleanupReturn(lastStatement.argument, knownBoundReleaseNames);
};
