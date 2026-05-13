import type { EsTreeNode } from "../../utils/index.js";
import { SENTINEL_IDENTIFIER_NAMES } from "./sentinel-identifier-names.js";
import { isNodeOfType } from "../../utils/index.js";

export const isSentinelIdentifier = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "Identifier") && SENTINEL_IDENTIFIER_NAMES.has(node.name);
