import type { EsTreeNode } from "../../utils/index.js";
import { collectIdentifierNames } from "./collect-identifier-names.js";
import { collectPatternNames } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// Build a "name -> identifiers it transitively depends on" graph for
// every top-level VariableDeclarator in the component body. Includes
// names referenced anywhere inside the initializer (deps arrays, nested
// callbacks, member access - we deliberately over-approximate here so
// that `useMemo(() => derive(state), [state])` propagates `state` into
// the dependency set of the resulting variable).

export const buildLocalDependencyGraph = (componentBody: EsTreeNode): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();
  if (!isNodeOfType(componentBody, "BlockStatement")) return graph;
  const declaredNames = new Set<string>();
  for (const statement of componentBody.body ?? []) {
    if (!isNodeOfType(statement, "VariableDeclaration")) continue;
    for (const declarator of statement.declarations ?? []) {
      if (!declarator.init) continue;
      const dependencyNames = collectIdentifierNames(declarator.init);
      declaredNames.clear();
      collectPatternNames(declarator.id, declaredNames);
      for (const declaredName of declaredNames) {
        const existing = graph.get(declaredName);
        if (existing === undefined) {
          graph.set(declaredName, new Set(dependencyNames));
        } else {
          for (const dependencyName of dependencyNames) existing.add(dependencyName);
        }
      }
    }
  }
  return graph;
};
