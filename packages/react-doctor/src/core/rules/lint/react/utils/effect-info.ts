import type { EsTreeNode } from "../../utils/index.js";

export interface EffectInfo {
  node: EsTreeNode;
  depNames: Set<string>;
  writtenStateNames: Set<string>;
  isExternalSync: boolean;
}
