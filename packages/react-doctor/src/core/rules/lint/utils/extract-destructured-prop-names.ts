import type { EsTreeNode } from "./es-tree-node.js";
import { collectPatternNames } from "./collect-pattern-names.js";

export const extractDestructuredPropNames = (params: EsTreeNode[]): Set<string> => {
  const propNames = new Set<string>();
  for (const param of params) {
    collectPatternNames(param, propNames);
  }
  return propNames;
};
