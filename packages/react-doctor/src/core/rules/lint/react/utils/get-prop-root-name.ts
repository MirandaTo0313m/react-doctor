import type { EsTreeNode } from "../../utils/index.js";
import { getRootIdentifierName } from "../../utils/index.js";

export const getPropRootName = (
  expression: EsTreeNode | null | undefined,
  propNames: Set<string>,
): string | null => {
  const rootName = getRootIdentifierName(expression, { followCallChains: true });
  return rootName !== null && propNames.has(rootName) ? rootName : null;
};
