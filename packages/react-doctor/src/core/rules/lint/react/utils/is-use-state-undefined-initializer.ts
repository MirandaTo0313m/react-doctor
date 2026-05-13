import type { EsTreeNode } from "../../utils/index.js";
import { isHookCall } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isUseStateUndefinedInitializer = (init: EsTreeNode | null | undefined): boolean => {
  if (!init || !isNodeOfType(init, "CallExpression")) return false;
  if (!isHookCall(init, "useState")) return false;
  const callArguments = init.arguments ?? [];
  if (callArguments.length === 0) return true;
  const firstArgument = callArguments[0];
  return isNodeOfType(firstArgument, "Identifier") && firstArgument.name === "undefined";
};
