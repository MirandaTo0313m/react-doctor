import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const declarationReadsAnyName = (declaration: EsTreeNode, names: Set<string>): boolean => {
  if (names.size === 0) return false;
  let didRead = false;
  walkAst(declaration, (child: EsTreeNode) => {
    if (didRead) return;
    if (isNodeOfType(child, "Identifier") && names.has(child.name)) didRead = true;
  });
  return didRead;
};
