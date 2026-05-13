import type { EsTreeNode } from "../../utils/index.js";
import { TANSTACK_ROUTE_CREATION_FUNCTIONS } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";

export const getRouteOptionsObject = (node: EsTreeNode): EsTreeNode | null => {
  if (!isNodeOfType(node, "CallExpression")) return null;

  const routeCallee = node.callee;

  if (
    isNodeOfType(routeCallee, "CallExpression") &&
    isNodeOfType(routeCallee.callee, "Identifier")
  ) {
    if (!TANSTACK_ROUTE_CREATION_FUNCTIONS.has(routeCallee.callee.name)) return null;
    const optionsArgument = node.arguments?.[0];
    if (isNodeOfType(optionsArgument, "ObjectExpression")) return optionsArgument;
    return null;
  }

  if (isNodeOfType(routeCallee, "Identifier")) {
    if (!TANSTACK_ROUTE_CREATION_FUNCTIONS.has(routeCallee.name)) return null;
    const optionsArgument = node.arguments?.[0];
    if (isNodeOfType(optionsArgument, "ObjectExpression")) return optionsArgument;
    return null;
  }

  return null;
};
