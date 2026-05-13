import type { EsTreeNode } from "../../utils/index.js";
import { MUTABLE_CONTAINER_CONSTRUCTORS } from "./mutable-container-constructors.js";
import { isNodeOfType } from "../../utils/index.js";

export const isMutableConstInitializer = (init: EsTreeNode | null | undefined): string | null => {
  if (!init) return null;
  if (isNodeOfType(init, "ArrayExpression")) return "[]";
  if (isNodeOfType(init, "ObjectExpression")) return "{}";
  if (
    isNodeOfType(init, "NewExpression") &&
    isNodeOfType(init.callee, "Identifier") &&
    MUTABLE_CONTAINER_CONSTRUCTORS.has(init.callee.name)
  ) {
    return `new ${init.callee.name}()`;
  }
  return null;
};
