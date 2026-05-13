import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const buildHookBindingMap = (componentBody: EsTreeNode): Map<string, string> => {
  const result = new Map<string, string>();
  if (!isNodeOfType(componentBody, "BlockStatement")) return result;
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!isNodeOfType(declarator.id, "Identifier")) continue;
      if (!isNodeOfType(declarator.init, "CallExpression")) continue;
      const callee = declarator.init.callee;
      if (!isNodeOfType(callee, "Identifier")) continue;
      result.set(declarator.id.name, callee.name);
    }
  }
  return result;
};
