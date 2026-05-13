import type { EsTreeNode } from "./es-tree-node.js";

export interface EsTreeImportNode {
  type: "Import";
  parent?: EsTreeNode | null;
  [key: string]: any;
}
