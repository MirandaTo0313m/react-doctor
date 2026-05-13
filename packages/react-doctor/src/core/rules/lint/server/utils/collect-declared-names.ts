import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const collectDeclaredNames = (declaration: EsTreeNode): Set<string> => {
  const names = new Set<string>();
  for (const declarator of declaration.declarations ?? []) {
    if (isNodeOfType(declarator.id, "Identifier")) {
      names.add(declarator.id.name);
    } else if (isNodeOfType(declarator.id, "ObjectPattern")) {
      for (const property of declarator.id.properties ?? []) {
        if (isNodeOfType(property, "Property") && isNodeOfType(property.value, "Identifier")) {
          names.add(property.value.name);
        } else if (
          isNodeOfType(property, "RestElement") &&
          isNodeOfType(property.argument, "Identifier")
        ) {
          names.add(property.argument.name);
        }
      }
    } else if (isNodeOfType(declarator.id, "ArrayPattern")) {
      for (const element of declarator.id.elements ?? []) {
        if (isNodeOfType(element, "Identifier")) names.add(element.name);
      }
    }
  }
  return names;
};
