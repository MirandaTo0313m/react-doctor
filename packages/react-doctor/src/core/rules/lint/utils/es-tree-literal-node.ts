import type { EsTreeNode } from "./es-tree-node.js";

export interface EsTreeLiteralNode {
  type: "Literal" | "StringLiteral";
  value?: string | number | boolean | RegExp | null;
  raw?: string;
  parent?: EsTreeNode | null;
  [key: string]: any;
}
