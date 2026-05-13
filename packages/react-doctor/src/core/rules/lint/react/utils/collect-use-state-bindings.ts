import type { EsTreeNode } from "../../utils/index.js";
import { isHookCall } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { isSetterIdentifier } from "../../utils/index.js";

export const collectUseStateBindings = (
  componentBody: EsTreeNode,
): Array<{ valueName: string; setterName: string; declarator: EsTreeNode }> => {
  const bindings: Array<{ valueName: string; setterName: string; declarator: EsTreeNode }> = [];
  if (!isNodeOfType(componentBody, "BlockStatement")) return bindings;

  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "ArrayPattern")) continue;
      const elements = declarator.id.elements ?? [];
      if (elements.length < 2) continue;
      const valueElement = elements[0];
      const setterElement = elements[1];
      if (
        !isNodeOfType(valueElement, "Identifier") ||
        !isNodeOfType(setterElement, "Identifier") ||
        !isSetterIdentifier(setterElement.name)
      ) {
        continue;
      }
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      if (!isHookCall(declarator.init, "useState")) continue;
      bindings.push({
        valueName: valueElement.name,
        setterName: setterElement.name,
        declarator,
      });
    }
  }
  return bindings;
};
