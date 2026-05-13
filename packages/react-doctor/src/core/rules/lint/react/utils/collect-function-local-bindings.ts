import type { EsTreeNode } from "../../utils/index.js";
import { collectPatternNames } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: only count setter calls that actually run during the effect's
// synchronous body. A `setX` inside `setTimeout(() => setX(...))` or
// `.then(() => setX(...))` is a DEFERRED write - by the time it fires,
// the chain reader effect has already had its dep-update window. Treat
// only direct (non-nested-function) writes as chain triggers; that
// stops `noEffectChain` from over-flagging the dominant debounce /
// async-fetch shape that real codebases use.

export const collectFunctionLocalBindings = (functionNode: EsTreeNode): Set<string> => {
  const localBindings = new Set<string>();
  for (const param of functionNode.params ?? []) {
    collectPatternNames(param, localBindings);
  }
  if (isNodeOfType(functionNode.body, "BlockStatement")) {
    for (const statement of functionNode.body.body ?? []) {
      if (!isNodeOfType(statement, "VariableDeclaration")) continue;
      for (const declarator of statement.declarations ?? []) {
        collectPatternNames(declarator.id, localBindings);
      }
    }
  }
  return localBindings;
};
