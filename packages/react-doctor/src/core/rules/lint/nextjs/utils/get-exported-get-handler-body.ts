import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getExportedGetHandlerBody = (node: EsTreeNode): EsTreeNode | null => {
  if (!isNodeOfType(node, "ExportNamedDeclaration")) return null;
  const declaration = node.declaration;
  if (!declaration) return null;

  if (isNodeOfType(declaration, "FunctionDeclaration") && declaration.id?.name === "GET") {
    return declaration.body;
  }

  if (isNodeOfType(declaration, "VariableDeclaration")) {
    for (const declarator of declaration.declarations ?? []) {
      if (
        isNodeOfType(declarator.id, "Identifier") &&
        declarator.id.name === "GET" &&
        declarator.init &&
        (isNodeOfType(declarator.init, "ArrowFunctionExpression") ||
          isNodeOfType(declarator.init, "FunctionExpression"))
      ) {
        return declarator.init.body;
      }
    }
  }

  return null;
};
