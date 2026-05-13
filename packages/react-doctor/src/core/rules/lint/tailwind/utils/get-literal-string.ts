import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getLiteralString = (node: EsTreeNode): string | null => {
  if (isNodeOfType(node, "Literal") && typeof node.value === "string") return node.value;
  if (isNodeOfType(node, "TemplateLiteral") && node.quasis?.length === 1) {
    return node.quasis[0].value?.raw ?? null;
  }
  return null;
};
