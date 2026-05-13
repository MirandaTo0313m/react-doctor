import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkInsideStatementBlocks } from "../../utils/index.js";

export const collectWrittenStateNamesInEffect = (
  effectCallback: EsTreeNode,
  setterToStateName: Map<string, string>,
): Set<string> => {
  const writtenStateNames = new Set<string>();
  walkInsideStatementBlocks(effectCallback.body, (child: EsTreeNode) => {
    if (!isNodeOfType(child, "CallExpression")) return;
    if (!isNodeOfType(child.callee, "Identifier")) return;
    const stateName = setterToStateName.get(child.callee.name);
    if (stateName) writtenStateNames.add(stateName);
  });
  return writtenStateNames;
};
