import type { EsTreeNodeType } from "./es-tree-node-type.js";

export interface EsTreeNode {
  type: EsTreeNodeType;
  parent?: EsTreeNode | null;
  [key: string]: any;
}
