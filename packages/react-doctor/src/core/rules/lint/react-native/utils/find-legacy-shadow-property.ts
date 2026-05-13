import type { EsTreeNode } from "../../utils/index.js";
import { LEGACY_SHADOW_KEYS } from "./legacy-shadow-keys.js";
import { isNodeOfType } from "../../utils/index.js";

export const findLegacyShadowProperty = (
  objectExpression: EsTreeNode,
): { keyName: string; node: EsTreeNode } | null => {
  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    if (!isNodeOfType(property.key, "Identifier")) continue;
    if (LEGACY_SHADOW_KEYS.has(property.key.name)) {
      return { keyName: property.key.name, node: property };
    }
  }
  return null;
};
