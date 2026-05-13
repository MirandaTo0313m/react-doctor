import type { EsTreeNode } from "../../utils/index.js";
import { EFFECT_HOOK_NAMES } from "../../constants.js";
import { isHookCall } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const findUseEffectsInComponent = (componentBody: EsTreeNode | undefined): EsTreeNode[] => {
  const effectCalls: EsTreeNode[] = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return effectCalls;
  for (const statement of componentBody.body ?? []) {
    walkAst(statement, (child: EsTreeNode) => {
      if (isNodeOfType(child, "CallExpression") && isHookCall(child, EFFECT_HOOK_NAMES)) {
        effectCalls.push(child);
      }
    });
  }
  return effectCalls;
};
