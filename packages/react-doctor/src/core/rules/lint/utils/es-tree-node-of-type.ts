import type { EsTreeNode } from "./es-tree-node.js";
import type { EsTreeNodeType } from "./es-tree-node-type.js";

export type EsTreeNodeOfType<NodeType extends EsTreeNodeType> = EsTreeNode & { type: NodeType };
