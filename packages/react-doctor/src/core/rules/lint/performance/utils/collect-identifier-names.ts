import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const collectIdentifierNames = (
  node: EsTreeNode | null | undefined,
  into: Set<string>,
): void => {
  if (!node) return;
  walkAst(node, (child: EsTreeNode) => {
    if (isNodeOfType(child, "Identifier")) into.add(child.name);
  });
};
