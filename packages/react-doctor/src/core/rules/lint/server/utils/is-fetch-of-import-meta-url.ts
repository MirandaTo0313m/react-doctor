import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const isFetchOfImportMetaUrl = (call: EsTreeNode): boolean => {
  if (!isNodeOfType(call, "CallExpression")) return false;
  if (!isNodeOfType(call.callee, "Identifier") || call.callee.name !== "fetch") return false;
  const firstArgument = call.arguments?.[0];
  if (!isNodeOfType(firstArgument, "NewExpression")) return false;
  if (!isNodeOfType(firstArgument.callee, "Identifier") || firstArgument.callee.name !== "URL")
    return false;
  const secondArgument = firstArgument.arguments?.[1];
  return (
    isNodeOfType(secondArgument, "MemberExpression") &&
    isNodeOfType(secondArgument.object, "MetaProperty") &&
    isNodeOfType(secondArgument.property, "Identifier") &&
    secondArgument.property.name === "url"
  );
};
