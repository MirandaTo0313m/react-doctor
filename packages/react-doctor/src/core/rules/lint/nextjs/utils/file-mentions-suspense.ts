import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const fileMentionsSuspense = (programNode: EsTreeNode): boolean => {
  let didSee = false;
  walkAst(programNode, (child: EsTreeNode) => {
    if (didSee) return false;
    if (
      isNodeOfType(child, "JSXOpeningElement") &&
      isNodeOfType(child.name, "JSXIdentifier") &&
      child.name.name === "Suspense"
    ) {
      didSee = true;
      return false;
    }
    if (isNodeOfType(child, "ImportDeclaration") && child.source?.value === "react") {
      const importsSuspense = (child.specifiers ?? []).some(
        (specifier: EsTreeNode) =>
          isNodeOfType(specifier, "ImportSpecifier") && specifier.imported?.name === "Suspense",
      );
      if (importsSuspense) {
        didSee = true;
        return false;
      }
    }
  });
  return didSee;
};
