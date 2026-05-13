import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const describeClientSideNavigation = (
  node: EsTreeNode,
  isPagesRouterFile: boolean,
): string | null => {
  const redirectGuidance = isPagesRouterFile
    ? "handle navigation in an event handler, getServerSideProps redirect, or middleware"
    : "use redirect() from next/navigation or handle navigation in an event handler";

  if (isNodeOfType(node, "CallExpression") && isNodeOfType(node.callee, "MemberExpression")) {
    const objectName = isNodeOfType(node.callee.object, "Identifier")
      ? node.callee.object.name
      : null;
    const methodName = isNodeOfType(node.callee.property, "Identifier")
      ? node.callee.property.name
      : null;
    if (objectName === "router" && (methodName === "push" || methodName === "replace")) {
      return `router.${methodName}() in useEffect - ${redirectGuidance}`;
    }
  }

  if (isNodeOfType(node, "AssignmentExpression") && isNodeOfType(node.left, "MemberExpression")) {
    const objectName = isNodeOfType(node.left.object, "Identifier") ? node.left.object.name : null;
    const propertyName = isNodeOfType(node.left.property, "Identifier")
      ? node.left.property.name
      : null;
    if (objectName === "window" && propertyName === "location") {
      return `window.location assignment in useEffect - ${redirectGuidance}`;
    }
    if (objectName === "location" && propertyName === "href") {
      return `location.href assignment in useEffect - ${redirectGuidance}`;
    }
  }

  return null;
};
