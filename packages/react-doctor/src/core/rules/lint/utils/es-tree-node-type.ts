import type { EsTreeImportNode } from "./es-tree-import-node.js";
import type { EsTreeLiteralNode } from "./es-tree-literal-node.js";
import type { OxcNodeType } from "./oxc-node-type.js";

export type EsTreeNodeType = OxcNodeType | EsTreeLiteralNode["type"] | EsTreeImportNode["type"];
