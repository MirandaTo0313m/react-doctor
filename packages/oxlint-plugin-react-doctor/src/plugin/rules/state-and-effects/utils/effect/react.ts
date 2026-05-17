import type { Reference, Scope } from "eslint-scope";
import type { EsTreeNode } from "../../../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../../../utils/is-node-of-type.js";
import { getDownstreamRefs, getUpstreamRefs, isEventualCallTo } from "./ast.js";
import type { ProgramAnalysis } from "./get-program-analysis.js";

const getOuterScopeContaining = (analysis: ProgramAnalysis, node: EsTreeNode): Scope | null => {
  if (!node.range) return null;
  // Find the smallest scope whose block strictly *contains* `node`
  // (block.range fully envelops node.range). For a top-level
  // VariableDeclarator in the module scope, this returns the
  // module scope.
  let best: Scope | null = null;
  let bestSize = Infinity;
  for (const scope of analysis.scopeManager.scopes) {
    const block = scope.block as unknown as EsTreeNode;
    if (!block?.range) continue;
    if (node.range[0] < block.range[0] || node.range[1] > block.range[1]) continue;
    const size = block.range[1] - block.range[0];
    // `<=` so that when two scopes have identical ranges (the
    // global + module pair always share the Program range), the
    // later-created (i.e. inner) scope wins — module variables live
    // there, not in the global scope.
    if (size <= bestSize) {
      bestSize = size;
      best = scope;
    }
  }
  return best;
};

// 1:1 port of upstream `src/util/react.js` from
// `eslint-plugin-react-you-might-not-need-an-effect`. See `./ast.ts`
// for the matching analyzer-side port.

const KNOWN_PURE_HOC_NAMES = new Set(["memo", "forwardRef"]);

const startsWithUppercase = (name: string | undefined): boolean =>
  Boolean(name && name.length > 0 && name[0] >= "A" && name[0] <= "Z");

const isFunctionLike = (
  node: EsTreeNode | null | undefined,
): node is
  | EsTreeNodeOfType<"ArrowFunctionExpression">
  | EsTreeNodeOfType<"FunctionExpression">
  | EsTreeNodeOfType<"FunctionDeclaration"> =>
  Boolean(
    node &&
    (isNodeOfType(node, "ArrowFunctionExpression") ||
      isNodeOfType(node, "FunctionExpression") ||
      isNodeOfType(node, "FunctionDeclaration")),
  );

export const isReactFunctionalComponent = (node: EsTreeNode | null | undefined): boolean => {
  if (!node) return false;
  if (isNodeOfType(node, "FunctionDeclaration")) {
    return Boolean(node.id && startsWithUppercase(node.id.name));
  }
  if (isNodeOfType(node, "VariableDeclarator")) {
    if (!isNodeOfType(node.id, "Identifier")) return false;
    if (!startsWithUppercase(node.id.name)) return false;
    const init = node.init;
    if (!init) return false;
    return isNodeOfType(init, "ArrowFunctionExpression") || isNodeOfType(init, "CallExpression");
  }
  return false;
};

export const isReactFunctionalHOC = (
  analysis: ProgramAnalysis,
  node: EsTreeNode | null | undefined,
): boolean => {
  if (!isReactFunctionalComponent(node)) return false;
  if (!isNodeOfType(node, "VariableDeclarator")) return false;
  const init = node.init;
  if (!init) return false;

  // inline: `const MyComponent = withRouter(() => ...)`
  const isWrappedInline = (): boolean => {
    if (!isNodeOfType(init, "CallExpression")) return false;
    if (!isNodeOfType(init.callee, "Identifier")) return false;
    if (KNOWN_PURE_HOC_NAMES.has(init.callee.name)) return false;
    const firstArg = init.arguments?.[0];
    if (!firstArg) return false;
    return (
      isNodeOfType(firstArg, "ArrowFunctionExpression") ||
      isNodeOfType(firstArg, "FunctionExpression")
    );
  };

  // separately: `export default withRouter(MyComponent);` and
  // `const Wrapped = inject('x')(observer(MyComponent))`.
  // We find the Variable for `MyComponent` directly through the
  // scope manager (instead of relying on `getRef(node.id)` resolving
  // the LHS init reference, which depends on scope-analyzer
  // particulars) and inspect each of its references.
  const isWrappedSeparately = (): boolean => {
    if (!isNodeOfType(node.id, "Identifier")) return false;
    const bindingName = node.id.name;
    const containingScope = getOuterScopeContaining(analysis, node as unknown as EsTreeNode);
    if (!containingScope) return false;
    const variable = containingScope.variables.find((v) => v.name === bindingName);
    if (!variable) return false;
    for (const reference of variable.references) {
      const parent = (reference.identifier as unknown as { parent?: EsTreeNode | null }).parent;
      if (!parent || !isNodeOfType(parent, "CallExpression")) continue;
      const args = parent.arguments ?? [];
      const refId = reference.identifier as unknown as (typeof args)[number];
      if (!args.includes(refId)) continue;
      const callee = parent.callee;
      const calleeName = isNodeOfType(callee, "Identifier")
        ? callee.name
        : isNodeOfType(callee, "CallExpression") && isNodeOfType(callee.callee, "Identifier")
          ? callee.callee.name
          : null;
      if (calleeName != null && !KNOWN_PURE_HOC_NAMES.has(calleeName)) {
        return true;
      }
    }
    return false;
  };

  return isWrappedInline() || isWrappedSeparately();
};

export const isCustomHook = (node: EsTreeNode | null | undefined): boolean => {
  if (!node) return false;
  if (isNodeOfType(node, "FunctionDeclaration")) {
    const name = node.id?.name;
    if (!name) return false;
    return name.startsWith("use") && name.length > 3 && name[3] >= "A" && name[3] <= "Z";
  }
  if (isNodeOfType(node, "VariableDeclarator")) {
    if (!isNodeOfType(node.id, "Identifier")) return false;
    const name = node.id.name;
    const init = node.init;
    if (!init) return false;
    if (
      !isNodeOfType(init, "ArrowFunctionExpression") &&
      !isNodeOfType(init, "FunctionExpression")
    ) {
      return false;
    }
    return name.startsWith("use") && name.length > 3 && name[3] >= "A" && name[3] <= "Z";
  }
  return false;
};

const isUseStateNode = (node: EsTreeNode | null | undefined): boolean => {
  if (!node) return false;
  if (isNodeOfType(node, "Identifier")) {
    if (node.name === "useState") return true;
    const parent = (node as unknown as { parent?: EsTreeNode | null }).parent;
    if (
      parent &&
      isNodeOfType(parent, "MemberExpression") &&
      isNodeOfType(parent.object, "Identifier") &&
      parent.object.name === "React" &&
      isNodeOfType(parent.property, "Identifier") &&
      parent.property.name === "useState"
    ) {
      return true;
    }
    return false;
  }
  if (isNodeOfType(node, "MemberExpression")) {
    return (
      isNodeOfType(node.object, "Identifier") &&
      node.object.name === "React" &&
      isNodeOfType(node.property, "Identifier") &&
      node.property.name === "useState"
    );
  }
  return false;
};

export const isUseEffect = (node: EsTreeNode | null | undefined): boolean => {
  if (!node || !isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (isNodeOfType(callee, "Identifier") && callee.name === "useEffect") return true;
  if (
    isNodeOfType(callee, "MemberExpression") &&
    isNodeOfType(callee.object, "Identifier") &&
    callee.object.name === "React" &&
    isNodeOfType(callee.property, "Identifier") &&
    callee.property.name === "useEffect"
  ) {
    return true;
  }
  return false;
};

export const getEffectFn = (node: EsTreeNode): EsTreeNode | null => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  const fn = node.arguments?.[0];
  if (!fn) return null;
  if (!isNodeOfType(fn, "ArrowFunctionExpression") && !isNodeOfType(fn, "FunctionExpression")) {
    return null;
  }
  return fn as EsTreeNode;
};

export const getEffectFnRefs = (
  analysis: ProgramAnalysis,
  node: EsTreeNode,
): Reference[] | null => {
  const fn = getEffectFn(node);
  if (!fn) return null;
  return getDownstreamRefs(analysis, fn);
};

export const getEffectDepsRefs = (
  analysis: ProgramAnalysis,
  node: EsTreeNode,
): Reference[] | null => {
  if (!isNodeOfType(node, "CallExpression")) return null;
  const deps = node.arguments?.[1];
  if (!deps || !isNodeOfType(deps, "ArrayExpression")) return null;
  return getDownstreamRefs(analysis, deps as EsTreeNode);
};

export const isState = (ref: Reference): boolean =>
  Boolean(
    ref.resolved?.defs.some((def) => {
      const node = def.node as unknown as EsTreeNode;
      if (!isNodeOfType(node, "VariableDeclarator")) return false;
      if (!isNodeOfType(node.init, "CallExpression")) return false;
      if (!isUseStateNode(node.init.callee as EsTreeNode)) return false;
      if (!isNodeOfType(node.id, "ArrayPattern")) return false;
      const elements = node.id.elements ?? [];
      if (elements.length !== 1 && elements.length !== 2) return false;
      const first = elements[0];
      return Boolean(
        first && isNodeOfType(first, "Identifier") && first.name === ref.identifier.name,
      );
    }),
  );

export const isStateSetter = (ref: Reference): boolean =>
  Boolean(
    ref.resolved?.defs.some((def) => {
      const node = def.node as unknown as EsTreeNode;
      if (!isNodeOfType(node, "VariableDeclarator")) return false;
      if (!isNodeOfType(node.init, "CallExpression")) return false;
      if (!isUseStateNode(node.init.callee as EsTreeNode)) return false;
      if (!isNodeOfType(node.id, "ArrayPattern")) return false;
      const elements = node.id.elements ?? [];
      if (elements.length !== 2) return false;
      const second = elements[1];
      return Boolean(
        second && isNodeOfType(second, "Identifier") && second.name === ref.identifier.name,
      );
    }),
  );

export const isProp = (analysis: ProgramAnalysis, ref: Reference): boolean =>
  Boolean(
    ref.resolved?.defs.some((def) => {
      if (def.type !== "Parameter") return false;
      const defNode = def.node as unknown as EsTreeNode;
      let declaringNode: EsTreeNode | null | undefined = defNode;
      if (isNodeOfType(defNode, "ArrowFunctionExpression")) {
        const parent = (defNode as unknown as { parent?: EsTreeNode | null }).parent;
        if (parent && isNodeOfType(parent, "CallExpression")) {
          declaringNode = (parent as unknown as { parent?: EsTreeNode | null }).parent;
        } else {
          declaringNode = parent;
        }
      }
      if (!declaringNode) return false;
      return (
        (isReactFunctionalComponent(declaringNode) &&
          !isReactFunctionalHOC(analysis, declaringNode)) ||
        isCustomHook(declaringNode)
      );
    }),
  );

export const isConstant = (ref: Reference): boolean =>
  Boolean(
    (ref.resolved?.defs ?? []).some((def) => {
      const node = def.node as unknown as EsTreeNode;
      if (!isNodeOfType(node, "VariableDeclarator")) return false;
      const init = node.init;
      if (!init) return false;
      return (
        isNodeOfType(init, "Literal") ||
        isNodeOfType(init, "TemplateLiteral") ||
        isNodeOfType(init, "ArrayExpression") ||
        isNodeOfType(init, "ObjectExpression")
      );
    }),
  );

export const isRef = (ref: Reference): boolean =>
  Boolean(
    ref.resolved?.defs.some((def) => {
      const node = def.node as unknown as EsTreeNode;
      if (!isNodeOfType(node, "VariableDeclarator")) return false;
      if (!isNodeOfType(node.init, "CallExpression")) return false;
      const callee = node.init.callee;
      if (isNodeOfType(callee, "Identifier") && callee.name === "useRef") return true;
      if (
        isNodeOfType(callee, "MemberExpression") &&
        isNodeOfType(callee.object, "Identifier") &&
        callee.object.name === "React" &&
        isNodeOfType(callee.property, "Identifier") &&
        callee.property.name === "useRef"
      ) {
        return true;
      }
      return false;
    }),
  );

export const isRefCurrent = (ref: Reference): boolean => {
  const parent = (ref.identifier as unknown as { parent?: EsTreeNode | null }).parent;
  if (!parent || !isNodeOfType(parent, "MemberExpression")) return false;
  if (!isNodeOfType(parent.property, "Identifier")) return false;
  return parent.property.name === "current";
};

export const isStateSetterCall = (analysis: ProgramAnalysis, ref: Reference): boolean =>
  isEventualCallTo(analysis, ref, isStateSetter);

export const isPropCall = (analysis: ProgramAnalysis, ref: Reference): boolean =>
  isEventualCallTo(analysis, ref, (innerRef) => isProp(analysis, innerRef));

export const isRefCall = (analysis: ProgramAnalysis, ref: Reference): boolean =>
  isEventualCallTo(analysis, ref, (innerRef) => isRefCurrent(innerRef) || isRef(innerRef));

export const getUseStateDecl = (analysis: ProgramAnalysis, ref: Reference): EsTreeNode | null => {
  const useStateRef = getUpstreamRefs(analysis, ref).find((upRef) =>
    isUseStateNode(upRef.identifier as unknown as EsTreeNode),
  );
  let node: EsTreeNode | null | undefined = useStateRef?.identifier as unknown as EsTreeNode;
  while (node && !isNodeOfType(node, "VariableDeclarator")) {
    node = (node as unknown as { parent?: EsTreeNode | null }).parent;
  }
  return node ?? null;
};

export const hasCleanup = (node: EsTreeNode): boolean => {
  const fn = node && isNodeOfType(node, "CallExpression") ? node.arguments?.[0] : null;
  if (!fn) return false;
  if (!isNodeOfType(fn, "ArrowFunctionExpression") && !isNodeOfType(fn, "FunctionExpression")) {
    return false;
  }
  if (!isNodeOfType(fn.body, "BlockStatement")) return false;
  return (fn.body.body ?? []).some(
    (stmt) => isNodeOfType(stmt, "ReturnStatement") && stmt.argument != null,
  );
};

export const findContainingNode = (
  analysis: ProgramAnalysis,
  node: EsTreeNode | null | undefined,
): EsTreeNode | null => {
  if (!node) return null;
  if (
    isReactFunctionalComponent(node) ||
    isReactFunctionalHOC(analysis, node) ||
    isCustomHook(node)
  ) {
    return node;
  }
  const parent = (node as unknown as { parent?: EsTreeNode | null }).parent;
  return findContainingNode(analysis, parent);
};

// Re-export `isFunctionLike` so consumers (rules) and tests can use
// it without re-declaring; also keeps the imported helper from being
// reported as unused.
export { isFunctionLike };
