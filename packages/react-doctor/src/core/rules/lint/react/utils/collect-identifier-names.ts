import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const collectIdentifierNames = (expression: EsTreeNode): Set<string> => {
  const names = new Set<string>();
  walkAst(expression, (child: EsTreeNode) => {
    if (isNodeOfType(child, "Identifier")) names.add(child.name);
  });
  return names;
};
