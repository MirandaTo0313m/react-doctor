import type { EsTreeNode } from "../../utils/index.js";
import { MUTABLE_GLOBAL_ROOTS } from "../../constants.js";
import { getRootIdentifierName } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: collect names of identifiers passed as values to JSX `on*`
// attributes - these are component-bound handlers (`onClick={handleClick}`).
// Lets `isInsideEventHandler` resolve a function bound to a const back
// to its handler usage in JSX.

export const findMutableDepIssue = (
  depElement: EsTreeNode,
  useRefBindingNames: Set<string>,
): { kind: "global" | "ref-current"; rootName: string } | null => {
  if (!isNodeOfType(depElement, "MemberExpression")) return null;

  if (
    isNodeOfType(depElement.property, "Identifier") &&
    depElement.property.name === "current" &&
    !depElement.computed &&
    isNodeOfType(depElement.object, "Identifier") &&
    useRefBindingNames.has(depElement.object.name)
  ) {
    return { kind: "ref-current", rootName: depElement.object.name };
  }

  const rootName = getRootIdentifierName(depElement);
  if (rootName !== null && MUTABLE_GLOBAL_ROOTS.has(rootName)) {
    return { kind: "global", rootName };
  }
  return null;
};
