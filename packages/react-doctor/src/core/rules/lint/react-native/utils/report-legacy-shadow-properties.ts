import type { EsTreeNode } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import { LEGACY_SHADOW_STYLE_PROPERTIES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

export const reportLegacyShadowProperties = (
  objectExpression: EsTreeNode,
  context: RuleContext,
): void => {
  const legacyShadowPropertyNames: string[] = [];

  for (const property of objectExpression.properties ?? []) {
    if (!isNodeOfType(property, "Property")) continue;
    const propertyName = isNodeOfType(property.key, "Identifier") ? property.key.name : null;
    if (propertyName && LEGACY_SHADOW_STYLE_PROPERTIES.has(propertyName)) {
      legacyShadowPropertyNames.push(propertyName);
    }
  }

  if (legacyShadowPropertyNames.length === 0) return;

  const quotedPropertyNames = legacyShadowPropertyNames.map((name) => `"${name}"`).join(", ");
  context.report({
    node: objectExpression,
    message: `Legacy shadow style${legacyShadowPropertyNames.length > 1 ? "s" : ""} ${quotedPropertyNames} - use boxShadow for cross-platform shadows on the new architecture`,
  });
};
