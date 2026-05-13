import type { EsTreeNode } from "../../utils/index.js";
import { BOOLEAN_PROP_PREFIX_PATTERN } from "./boolean-prop-prefix-pattern.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const collectBooleanLikePropsFromBody = (
  componentBody: EsTreeNode | undefined,
  propsParamName: string,
): Set<string> => {
  const found = new Set<string>();
  if (!componentBody) return found;
  walkAst(componentBody, (child: EsTreeNode) => {
    if (!isNodeOfType(child, "MemberExpression")) return;
    if (child.computed) return;
    if (!isNodeOfType(child.object, "Identifier")) return;
    if (child.object.name !== propsParamName) return;
    if (!isNodeOfType(child.property, "Identifier")) return;
    if (!BOOLEAN_PROP_PREFIX_PATTERN.test(child.property.name)) return;
    found.add(child.property.name);
  });
  return found;
};
