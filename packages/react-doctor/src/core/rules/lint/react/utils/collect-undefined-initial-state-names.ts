import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isUseStateUndefinedInitializer } from "./is-use-state-undefined-initializer.js";

export const collectUndefinedInitialStateNames = (componentBody: EsTreeNode): Set<string> => {
  const stateNames = new Set<string>();
  if (!isNodeOfType(componentBody, "BlockStatement")) return stateNames;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
      const valueElement = declarator.id.elements?.[0];
      if (!isNodeOfType(valueElement, "Identifier")) continue;
      if (!isUseStateUndefinedInitializer(declarator.init)) continue;
      stateNames.add(valueElement.name);
    }
  }
  return stateNames;
};
