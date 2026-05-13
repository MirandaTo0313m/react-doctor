import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const callReadsHandlerArgs = (call: EsTreeNode, handlerParamNames: Set<string>): boolean => {
  if (handlerParamNames.size === 0) return false;
  let referencesArg = false;
  walkAst(call, (child: EsTreeNode) => {
    if (referencesArg) return;
    if (isNodeOfType(child, "Identifier") && handlerParamNames.has(child.name)) {
      referencesArg = true;
    }
  });
  return referencesArg;
};
