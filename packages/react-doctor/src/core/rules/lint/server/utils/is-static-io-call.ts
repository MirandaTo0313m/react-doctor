import type { EsTreeNode } from "../../utils/index.js";
import { STATIC_IO_FUNCTIONS } from "./static-io-functions.js";
import { isNodeOfType } from "../../utils/index.js";

export const isStaticIoCall = (call: EsTreeNode): boolean => {
  // fs.readFileSync(...) / fsPromises.readFile(...) / fs.promises.readFile(...).
  if (!isNodeOfType(call, "CallExpression")) return false;
  const callee = call.callee;
  if (isNodeOfType(callee, "Identifier") && STATIC_IO_FUNCTIONS.has(callee.name)) {
    return true;
  }
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  const propertyName = isNodeOfType(callee.property, "Identifier") ? callee.property.name : null;
  if (!propertyName || !STATIC_IO_FUNCTIONS.has(propertyName)) return false;
  return true;
};
