import type { EsTreeNode } from "../../utils/index.js";
import { EFFECT_HOOK_NAMES } from "../../constants.js";
import { isHookCall } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: `window.addEventListener("online", onChange)` is the dominant
// real-world shape - the handler is declared as a separate `const` in
// the effect body so it can be shared with `removeEventListener` in the
// cleanup. We have to resolve the Identifier argument back to its
// locally-declared arrow/function init before the structural setter
// check can run.

export const findTopLevelEffectCalls = (componentBody: EsTreeNode): EsTreeNode[] => {
  const effectCalls: EsTreeNode[] = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return effectCalls;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "ExpressionStatement")) continue;
    const expression = statement.expression;
    if (!isNodeOfType(expression, "CallExpression")) continue;
    if (!isHookCall(expression, EFFECT_HOOK_NAMES)) continue;
    effectCalls.push(expression);
  }
  return effectCalls;
};
