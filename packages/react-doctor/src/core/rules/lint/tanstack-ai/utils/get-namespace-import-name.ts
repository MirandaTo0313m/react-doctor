import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const getNamespaceImportName = (specifier: EsTreeNode): string | null => {
  if (!isNodeOfType(specifier, "ImportNamespaceSpecifier")) return null;
  return isNodeOfType(specifier.local, "Identifier") ? specifier.local.name : null;
};
