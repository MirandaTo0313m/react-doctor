import type { Node as OxcNode } from "@oxc-project/types";
import type { OxcNodeType } from "./oxc-node-type.js";

export type OxcNodeOfType<NodeType extends OxcNodeType> = Extract<OxcNode, { type: NodeType }>;
