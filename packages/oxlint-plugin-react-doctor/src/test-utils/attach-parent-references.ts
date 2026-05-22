import { isAstNode } from "../plugin/utils/is-ast-node.js";
import type { EsTreeNode } from "../plugin/utils/es-tree-node.js";

// oxlint sets `node.parent` on every AST node before invoking JS plugins;
// our rules rely on walking those parent links. The unit-test harness has
// to do the same up front since `oxc-parser` emits an unparented AST.
export const attachParentReferences = (root: EsTreeNode): void => {
  const visit = (node: EsTreeNode, parent: EsTreeNode | null): void => {
    const writableNode = node as unknown as { parent?: EsTreeNode | null };
    writableNode.parent = parent;
    const nodeRecord = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(nodeRecord)) {
      if (key === "parent") continue;
      const child = nodeRecord[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (isAstNode(item)) visit(item, node);
        }
      } else if (isAstNode(child)) {
        visit(child, node);
      }
    }
  };
  visit(root, null);
};
