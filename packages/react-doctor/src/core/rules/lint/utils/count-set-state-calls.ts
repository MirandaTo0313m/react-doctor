import type { EsTreeNode } from "./es-tree-node.js";
import { isSetterCall } from "./is-setter-call.js";
import { walkInsideStatementBlocks } from "./walk-inside-statement-blocks.js";

export const countSetStateCalls = (node: EsTreeNode): number => {
  let setStateCallCount = 0;
  walkInsideStatementBlocks(node, (child) => {
    if (isSetterCall(child)) setStateCallCount++;
  });
  return setStateCallCount;
};
