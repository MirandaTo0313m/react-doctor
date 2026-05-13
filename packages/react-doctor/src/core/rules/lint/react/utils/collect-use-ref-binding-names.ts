import type { EsTreeNode } from "../../utils/index.js";
import { isHookCall } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const collectUseRefBindingNames = (componentBody: EsTreeNode): Set<string> => {
  const useRefBindings = new Set<string>();
  if (!isNodeOfType(componentBody, "BlockStatement")) return useRefBindings;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useRef")) continue;
      useRefBindings.add(declarator.id.name);
    }
  }
  return useRefBindings;
};
