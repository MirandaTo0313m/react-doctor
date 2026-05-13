import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const collectIdentifierParams = (params: EsTreeNode[]): Set<string> => {
  const names = new Set<string>();
  for (const param of params) {
    if (isNodeOfType(param, "Identifier")) names.add(param.name);
  }
  return names;
};
