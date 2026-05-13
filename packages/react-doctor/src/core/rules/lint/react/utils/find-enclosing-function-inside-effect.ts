import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// "Read in render" = any identifier (`Identifier`, NOT `JSXIdentifier`)
// that appears anywhere inside a return expression - JSX text content,
// `{expression}` containers, attribute values like
// `<MyContext value={value}>` (the React Context case from #146),
// `style={…}`, `className={…}`, props passed to children, conditional
// chains, the lot. JSX element/tag names are `JSXIdentifier`, which we
// deliberately do not track - referring to a component by name does
// not "read" any value.

export const findEnclosingFunctionInsideEffect = (
  identifierNode: EsTreeNode,
  effectCallback: EsTreeNode,
): EsTreeNode | null => {
  let cursor: EsTreeNode | null = identifierNode.parent ?? null;
  while (cursor && cursor !== effectCallback) {
    if (
      isNodeOfType(cursor, "ArrowFunctionExpression") ||
      isNodeOfType(cursor, "FunctionExpression") ||
      isNodeOfType(cursor, "FunctionDeclaration")
    ) {
      return cursor;
    }
    cursor = cursor.parent ?? null;
  }
  return null;
};
