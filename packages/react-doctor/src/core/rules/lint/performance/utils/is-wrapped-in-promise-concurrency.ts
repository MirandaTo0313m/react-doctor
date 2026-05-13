import type { EsTreeNode } from "../../utils/index.js";
import { PROMISE_CONCURRENCY_METHODS } from "./promise-concurrency-methods.js";
import { isNodeOfType } from "../../utils/index.js";

export const isWrappedInPromiseConcurrency = (mapCall: EsTreeNode): boolean => {
  const parent = mapCall.parent;
  if (!isNodeOfType(parent, "CallExpression")) return false;
  if (parent.arguments?.[0] !== mapCall) return false;
  const callee = parent.callee;
  if (!isNodeOfType(callee, "MemberExpression") || callee.computed) return false;
  if (!isNodeOfType(callee.object, "Identifier") || callee.object.name !== "Promise") return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  return PROMISE_CONCURRENCY_METHODS.has(callee.property.name);
};
