import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const NONDETERMINISTIC_RENDER_PATTERNS: Array<{
  matches: (node: EsTreeNode) => boolean;
  display: string;
}> = [
  {
    display: "new Date()",
    matches: (node) =>
      isNodeOfType(node, "NewExpression") &&
      isNodeOfType(node.callee, "Identifier") &&
      node.callee.name === "Date" &&
      (node.arguments?.length ?? 0) === 0,
  },
  {
    display: "Date.now()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "Date" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "now",
  },
  {
    display: "Math.random()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "Math" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "random",
  },
  {
    display: "performance.now()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "performance" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "now",
  },
  {
    display: "crypto.randomUUID()",
    matches: (node) =>
      isNodeOfType(node, "CallExpression") &&
      isNodeOfType(node.callee, "MemberExpression") &&
      isNodeOfType(node.callee.object, "Identifier") &&
      node.callee.object.name === "crypto" &&
      isNodeOfType(node.callee.property, "Identifier") &&
      node.callee.property.name === "randomUUID",
  },
];
