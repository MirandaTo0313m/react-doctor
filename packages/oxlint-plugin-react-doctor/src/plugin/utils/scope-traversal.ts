import type { EsTreeNode } from "./es-tree-node.js";
import type { RuleContext } from "./rule-context.js";
import type { ScopeReference } from "./scope-types.js";

export const getRef = (
  context: RuleContext,
  identifier: EsTreeNode,
): ScopeReference | undefined => {
  if (!context.sourceCode) return undefined;
  const scope = context.sourceCode.getScope(identifier);
  return scope?.references.find((ref) => ref.identifier === identifier);
};

const ascend = (
  context: RuleContext,
  ref: ScopeReference,
  visit: (ref: ScopeReference) => boolean | undefined | void,
  visited: Set<ScopeReference> = new Set(),
): void => {
  if (visited.has(ref)) return;
  const shouldContinue = visit(ref);
  visited.add(ref);
  if (shouldContinue === false) return;

  const defs = ref.resolved?.defs ?? [];
  defs
    .filter((def) => def.type !== "ImportBinding")
    .filter((def) => def.type !== "Parameter")
    .map((def) => {
      const defNode = def.node as Record<string, unknown>;
      return (defNode.init ?? defNode.body) as EsTreeNode | undefined;
    })
    .filter(Boolean)
    .flatMap((node) => getDownstreamRefs(context, node!))
    .forEach((downstreamRef) => ascend(context, downstreamRef, visit, visited));
};

const descend = (
  context: RuleContext,
  node: EsTreeNode,
  visit: (node: EsTreeNode) => void,
  visited: Set<EsTreeNode> = new Set(),
): void => {
  if (visited.has(node)) return;
  visit(node);
  visited.add(node);

  const visitorKeys = context.sourceCode?.visitorKeys ?? {};
  const keys = visitorKeys[node.type] ?? [];
  const nodeRecord = node as unknown as Record<string, unknown>;

  for (const key of keys) {
    const child = nodeRecord[key];
    if (!child) continue;
    const children = Array.isArray(child) ? child : [child];
    for (const item of children) {
      if (item && typeof item === "object" && "type" in item) {
        descend(context, item as EsTreeNode, visit, visited);
      }
    }
  }
};

export const findDownstreamNodes = (
  context: RuleContext,
  topNode: EsTreeNode,
  type: string,
): EsTreeNode[] => {
  const nodes: EsTreeNode[] = [];
  descend(context, topNode, (node) => {
    if (node.type === type) nodes.push(node);
  });
  return nodes;
};

export const getDownstreamRefs = (context: RuleContext, node: EsTreeNode): ScopeReference[] =>
  findDownstreamNodes(context, node, "Identifier")
    .map((identifier) => getRef(context, identifier))
    .filter((ref): ref is ScopeReference => ref !== undefined);

export const getUpstreamRefs = (context: RuleContext, ref: ScopeReference): ScopeReference[] => {
  const refs: ScopeReference[] = [];
  ascend(context, ref, (upRef) => {
    refs.push(upRef);
  });
  return refs;
};

export const getCallExpr = (ref: ScopeReference, current?: EsTreeNode): EsTreeNode | undefined => {
  const currentNode = current ?? ref.identifier.parent;
  if (!currentNode) return undefined;

  if (currentNode.type === "CallExpression") {
    let node: EsTreeNode = ref.identifier;
    while (node.parent?.type === "MemberExpression") {
      node = node.parent;
    }
    const callNode = currentNode as unknown as Record<string, unknown>;
    if (callNode.callee === node) return currentNode;
  }

  if (currentNode.type === "MemberExpression") {
    return getCallExpr(ref, currentNode.parent ?? undefined);
  }

  return undefined;
};

export const getArgsUpstreamRefs = (context: RuleContext, ref: ScopeReference): ScopeReference[] =>
  getUpstreamRefs(context, ref)
    .map((upRef) => getCallExpr(upRef))
    .filter((callExpr): callExpr is EsTreeNode => callExpr !== undefined)
    .flatMap((callExpr) => {
      const callNode = callExpr as unknown as Record<string, unknown>;
      const args = callNode.arguments as EsTreeNode[] | undefined;
      return args ?? [];
    })
    .flatMap((arg) => getDownstreamRefs(context, arg))
    .flatMap((downRef) => getUpstreamRefs(context, downRef));

export const isSynchronous = (node: EsTreeNode, within: EsTreeNode): boolean => {
  if (node === within) return true;

  const nodeRecord = node as unknown as Record<string, unknown>;
  if (
    Boolean(nodeRecord.async) ||
    node.type === "AwaitExpression" ||
    (node.type === "UnaryExpression" &&
      (node as unknown as Record<string, unknown>).operator === "void") ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return false;
  }

  if (!node.parent) return false;
  return isSynchronous(node.parent, within);
};

export const isEventualCallTo = (
  context: RuleContext,
  ref: ScopeReference,
  predicate: (ref: ScopeReference) => boolean,
): boolean => {
  const callExprRefs: ScopeReference[] = [];
  ascend(context, ref, (upRef) => {
    const callExprNode = getCallExpr(upRef);
    if (callExprNode) {
      callExprRefs.push(upRef);
    } else {
      return false;
    }
  });
  return callExprRefs.some(predicate);
};
