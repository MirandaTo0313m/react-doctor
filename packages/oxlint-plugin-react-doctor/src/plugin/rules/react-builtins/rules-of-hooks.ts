import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isReactComponentOrHookName } from "../../utils/is-react-component-or-hook-name.js";
import { isReactHookName } from "../../utils/is-react-hook-name.js";
import type { Rule } from "../../utils/rule.js";

// Port of `oxc_linter::rules::react::rules_of_hooks`. Enforces React's
// Rules of Hooks:
//   1. Hook calls must be at the top level of a React function
//      component or a custom Hook — never inside conditionals, loops,
//      or nested non-Hook functions.
//   2. Hook calls must be unconditional (every render hits the same
//      hook calls in the same order).
//   3. Hook calls must not appear after early return / inside try /
//      inside async functions.
//
// Uses the CFG (`context.cfg.isUnconditionalFromEntry`) for the
// "unconditional" check and walks the AST parent chain for the rest.

const buildTopLevelMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` cannot be called at the top level — it must live inside a React function component or a custom Hook.`;
const buildNonComponentMessage = (hookName: string, functionName: string): string =>
  `React Hook \`${hookName}\` is called in function \`${functionName}\` that is neither a React function component nor a custom React Hook.`;
const buildConditionalMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` is called conditionally. React Hooks must be called in the same order on every render.`;
const buildLoopMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` may be executed more than once because it is called inside a loop.`;
const buildAsyncMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` cannot be called inside an async function.`;
const buildClassComponentMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` cannot be called inside a class component — convert to a function component.`;
const buildTryMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` cannot be called inside a try / catch / finally block.`;

interface HookContext {
  hookName: string;
  hookExpression: EsTreeNode;
}

// Mirrors OXC's `is_react_hook` — matches:
//   useFoo(...)                 (bare identifier with use prefix)
//   React.useFoo(...)           (the React namespace)
//   someCall().useFoo(...)      (chained call result)
// Crucially does NOT match `Sinon.useFakeTimers(...)` — third-party
// libraries that just happen to have a use-prefixed member.
//
// For bare identifier calls, additionally consult scope analysis to
// confirm the binding (if resolved) actually comes from React; a local
// `use` parameter / non-React import shouldn't be treated as a hook.
const isHookCall = (
  call: EsTreeNode,
  scopes: import("../../semantic/scope-analysis.js").ScopeAnalysis,
): HookContext | null => {
  if (!isNodeOfType(call, "CallExpression")) return null;
  const callee = call.callee;
  if (isNodeOfType(callee, "Identifier") && isReactHookName(callee.name)) {
    // If the symbol resolves to something demonstrably NOT a React
    // import, skip. Specifically:
    //   - parameter / catch-clause-parameter / for-binding kinds → skip
    //   - `import X from "non-react"` / aliased import → skip if the
    //     import source isn't "react"
    //   - locally declared function / class / const → skip
    // Globals (unresolved) are ambiguous; we treat them as hooks
    // because the user is presumably calling React's `use*` from a
    // global setup.
    const symbol = scopes.symbolFor(callee);
    if (symbol) {
      // For ANY resolved symbol, trace its effective React import
      // name. If null → the symbol doesn't come from React; skip.
      // If it returns a different name from the callee → the local
      // name shadows but the actual React function is something
      // else (e.g. `const use = useState`); skip — we don't want to
      // treat it as the React 19 `use` hook.
      if (symbol.kind === "parameter" || symbol.kind === "catch-clause-parameter") {
        return null;
      }
      const reactName = resolveReactImportName(symbol, scopes);
      if (reactName === null) return null;
      // For the React 19 `use` hook specifically, the local callee
      // must directly map to the React export `use` (not aliased to
      // some other hook).
      if (callee.name === "use" && reactName !== "use") return null;
    }
    return { hookName: callee.name, hookExpression: callee as EsTreeNode };
  }
  if (
    isNodeOfType(callee, "MemberExpression") &&
    !callee.computed &&
    isNodeOfType(callee.property, "Identifier") &&
    isReactHookName(callee.property.name)
  ) {
    const object = callee.object;
    const isReactNamespace = isNodeOfType(object, "Identifier") && object.name === "React";
    const isChainedCall = isNodeOfType(object, "CallExpression");
    if (isReactNamespace || isChainedCall) {
      return {
        hookName: callee.property.name,
        hookExpression: callee as EsTreeNode,
      };
    }
  }
  return null;
};

const isReactImport = (
  symbol: import("../../semantic/scope-analysis.js").SymbolDescriptor,
): boolean => {
  // The declarationNode is an ImportSpecifier / ImportDefaultSpecifier /
  // ImportNamespaceSpecifier. Its parent is the ImportDeclaration with
  // a source.
  const decl = symbol.declarationNode;
  let importDeclaration: EsTreeNode | null | undefined = decl?.parent;
  while (importDeclaration && !isNodeOfType(importDeclaration, "ImportDeclaration")) {
    importDeclaration = importDeclaration.parent ?? null;
  }
  if (!importDeclaration || !isNodeOfType(importDeclaration, "ImportDeclaration")) return false;
  const source = importDeclaration.source;
  return source && isNodeOfType(source, "Literal") && source.value === "react" ? true : false;
};

// Returns the "effective React import name" that `symbol` ultimately
// resolves to, OR null if the symbol doesn't trace back to React. The
// returned name is the property/member accessed at the React boundary
// (e.g. `useState` for `import { useState } from "react"`, `useFoo`
// for `React.useFoo`, the namespace name for `import * as React`).
//
// Used by the rule to determine whether a local callee that LOOKS
// like a React hook (matches isReactHookName) actually corresponds
// to a React-exported hook of that exact name. This ensures
// `const use = useState; use()` is treated as a useState call, not
// a "use" call.
const resolveReactImportName = (
  symbol: import("../../semantic/scope-analysis.js").SymbolDescriptor,
  scopes: import("../../semantic/scope-analysis.js").ScopeAnalysis,
  visited: Set<number> = new Set(),
): string | null => {
  if (visited.has(symbol.id)) return null;
  visited.add(symbol.id);

  // Direct import: returns the IMPORTED name (not the local alias).
  if (symbol.kind === "import") {
    if (!isReactImport(symbol)) return null;
    const decl = symbol.declarationNode;
    // ImportSpecifier's .imported is the source name; ImportDefault /
    // ImportNamespace use the local name (no .imported).
    if (isNodeOfType(decl, "ImportSpecifier")) {
      const imported = (decl as { imported: EsTreeNode }).imported;
      if (isNodeOfType(imported, "Identifier")) return imported.name;
    }
    // Default / namespace imports: use the local name as the
    // "React identifier" so callers expecting the namespace can see it.
    return symbol.name;
  }

  const init = symbol.initializer;
  if (!init) return null;

  // `const x = React.foo` — return "foo".
  if (
    isNodeOfType(init, "MemberExpression") &&
    isNodeOfType(init.object, "Identifier") &&
    init.object.name === "React" &&
    isNodeOfType(init.property, "Identifier") &&
    !init.computed
  ) {
    return init.property.name;
  }

  // `const x = require("react")` — namespace.
  if (
    isNodeOfType(init, "CallExpression") &&
    isNodeOfType(init.callee, "Identifier") &&
    init.callee.name === "require" &&
    init.arguments[0] &&
    isNodeOfType(init.arguments[0] as EsTreeNode, "Literal") &&
    (init.arguments[0] as { value?: unknown }).value === "react"
  ) {
    return symbol.name; // namespace alias name
  }

  // `const x = require("react").foo` — return "foo".
  if (
    isNodeOfType(init, "MemberExpression") &&
    isNodeOfType(init.object, "CallExpression") &&
    isNodeOfType(init.object.callee, "Identifier") &&
    init.object.callee.name === "require" &&
    init.object.arguments[0] &&
    isNodeOfType(init.object.arguments[0] as EsTreeNode, "Literal") &&
    (init.object.arguments[0] as { value?: unknown }).value === "react" &&
    isNodeOfType(init.property, "Identifier") &&
    !init.computed
  ) {
    return init.property.name;
  }

  // `const x = otherIdentifier` — chase the alias.
  if (isNodeOfType(init, "Identifier")) {
    const aliasSymbol = scopes.symbolFor(init);
    if (aliasSymbol) {
      const aliasName = resolveReactImportName(aliasSymbol, scopes, visited);
      if (!aliasName) return null;
      // For destructured bindings (where init is the destructure
      // source identifier and the alias resolves to a namespace), we
      // need the source-side property key (e.g. `{ use: localName }`
      // → key = "use"). Look at the binding identifier's AST parent
      // chain.
      if (
        aliasSymbol.kind === "import" &&
        // namespace import — the resolveReactImportName returned the
        // namespace name (which equals symbol.name for namespace).
        aliasSymbol.declarationNode.type === "ImportNamespaceSpecifier"
      ) {
        const destructureKey = inferDestructureSourceKey(symbol.bindingIdentifier);
        if (destructureKey !== null) return destructureKey;
        // No destructure context → keep the namespace alias name.
        return aliasName;
      }
      // For destructure of a non-namespace alias (e.g.
      // `const { use } = require('react')`), the property key is the
      // actual exported name.
      const destructureKey = inferDestructureSourceKey(symbol.bindingIdentifier);
      if (destructureKey !== null) return destructureKey;
      return aliasName;
    }
  }

  return null;
};

// Given a binding-identifier inside an ObjectPattern destructure, find
// the source key (e.g. for `{ use: localName }`, returns "use").
// Returns null when the binding isn't in a destructure or the key
// isn't statically resolvable.
const inferDestructureSourceKey = (bindingId: EsTreeNode): string | null => {
  let current: EsTreeNode | null | undefined = bindingId.parent;
  while (current) {
    if (isNodeOfType(current, "Property")) {
      const key = (current as { key: EsTreeNode; computed: boolean }).key;
      if (!current.computed && isNodeOfType(key, "Identifier")) {
        return key.name;
      }
      if (isNodeOfType(key, "Literal") && typeof key.value === "string") {
        return key.value;
      }
      return null;
    }
    if (
      isNodeOfType(current, "VariableDeclarator") ||
      isNodeOfType(current, "ArrowFunctionExpression") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "FunctionDeclaration")
    ) {
      // Walked too far — not in an ObjectPattern destructure.
      return null;
    }
    current = current.parent ?? null;
  }
  return null;
};

// React 19's `use(...)` hook is intentionally callable in
// conditionals, loops, and after early returns — it's the rule's
// only recognized exception. We still require it to be inside a
// component / custom hook scope.
const isReactUseHook = (hookName: string): boolean => hookName === "use";

interface FunctionInfo {
  node: EsTreeNode;
  // The name we'd display in error messages. Best-effort: the
  // function's own id, the variable it's assigned to, or "anonymous".
  name: string;
  // True iff `name` was actually inferred (vs the "anonymous"
  // fallback). Used to skip the non-component check on truly
  // anonymous functions — OXC's rule conservatively skips those
  // because a callback's runtime context can't be determined.
  hasResolvedName: boolean;
  isAsync: boolean;
  isComponentOrHook: boolean;
}

// Best-effort name inference: looks at the function's parent for a
// VariableDeclarator / AssignmentExpression / Property / CallExpression
// that gives the function a usable name.
const inferFunctionName = (fnNode: EsTreeNode): string | null => {
  if (
    (isNodeOfType(fnNode, "FunctionDeclaration") || isNodeOfType(fnNode, "FunctionExpression")) &&
    (fnNode as { id?: { name?: string } | null }).id
  ) {
    return (fnNode as { id: { name: string } }).id.name;
  }
  let parent: EsTreeNode | null | undefined = fnNode.parent;
  // Skip over wrapper calls like `memo(<fn>)` / `forwardRef(<fn>)` —
  // their named-binding context is one level up. Only standard React
  // HoCs are skipped; arbitrary `hoc(...)` calls are kept as the
  // immediate parent so the function isn't promoted to a component.
  while (parent && isNodeOfType(parent, "CallExpression")) {
    const callee = parent.callee;
    let calleeName: string | null = null;
    if (isNodeOfType(callee, "Identifier")) calleeName = callee.name;
    else if (
      isNodeOfType(callee, "MemberExpression") &&
      isNodeOfType(callee.object, "Identifier") &&
      callee.object.name === "React" &&
      isNodeOfType(callee.property, "Identifier")
    ) {
      calleeName = `React.${callee.property.name}`;
    }
    if (
      calleeName === "memo" ||
      calleeName === "forwardRef" ||
      calleeName === "React.memo" ||
      calleeName === "React.forwardRef"
    ) {
      parent = parent.parent ?? null;
    } else {
      break;
    }
  }
  if (!parent) return null;
  if (isNodeOfType(parent, "VariableDeclarator") && isNodeOfType(parent.id, "Identifier")) {
    return parent.id.name;
  }
  if (isNodeOfType(parent, "AssignmentExpression") && isNodeOfType(parent.left, "Identifier")) {
    return parent.left.name;
  }
  if (
    isNodeOfType(parent, "Property") &&
    !parent.computed &&
    isNodeOfType(parent.key, "Identifier")
  ) {
    return parent.key.name;
  }
  if (isNodeOfType(parent, "ExportDefaultDeclaration")) {
    return "default";
  }
  return null;
};

const findEnclosingFunctionInfo = (node: EsTreeNode): FunctionInfo | null => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "FunctionDeclaration") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "ArrowFunctionExpression")
    ) {
      const fnNode = current as EsTreeNodeOfType<
        "FunctionDeclaration" | "FunctionExpression" | "ArrowFunctionExpression"
      >;
      const resolvedName = inferFunctionName(fnNode);
      const name = resolvedName ?? "anonymous";
      return {
        node: fnNode,
        name,
        hasResolvedName: resolvedName !== null,
        isAsync: Boolean((fnNode as { async?: boolean }).async),
        isComponentOrHook: resolvedName === null ? false : isReactComponentOrHookName(name),
      };
    }
    current = current.parent ?? null;
  }
  return null;
};

const isInsideClassComponent = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "FunctionDeclaration") ||
      isNodeOfType(current, "FunctionExpression") ||
      isNodeOfType(current, "ArrowFunctionExpression")
    ) {
      // Stop at the nearest function — anything beyond is irrelevant.
      // BUT if the function we hit is itself a class method, the class
      // is inside, so check for ClassDeclaration/Expression as a
      // closer ancestor first.
      break;
    }
    if (
      isNodeOfType(current, "MethodDefinition") ||
      isNodeOfType(current, "ClassDeclaration") ||
      isNodeOfType(current, "ClassExpression")
    ) {
      // Found a class/method ancestor inside the same scope chain
      // before any function boundary. Treat as class component.
      return true;
    }
    current = current.parent ?? null;
  }
  return false;
};

// True if any AST ancestor between `from` (exclusive) and `to`
// (exclusive) is a try-clause (TryStatement.block / handler / finalizer)
// or a logical / ternary expression that creates a conditional path.
const hasShortCircuitAncestor = (from: EsTreeNode, to: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = from.parent;
  while (current && current !== to) {
    if (isNodeOfType(current, "ConditionalExpression")) return true;
    if (
      isNodeOfType(current, "LogicalExpression") &&
      (current.operator === "&&" || current.operator === "||" || current.operator === "??")
    ) {
      // Only the right side is conditional; check whether `from`'s
      // ancestor chain went via .right.
      const childNode = current as { left: EsTreeNode; right: EsTreeNode };
      // If we entered via .right of a logical expression, conditional.
      // We approximate by checking if the ancestor of `from` (toward
      // `current`) is `.right`.
      // Walking back from `current` via children is awkward; check
      // span ordering instead: if the from node's range is within
      // current.right.range, conditional.
      const fromRange = from as { start?: number; end?: number };
      const rightRange = childNode.right as { start?: number; end?: number };
      if (
        typeof fromRange.start === "number" &&
        typeof rightRange.start === "number" &&
        typeof rightRange.end === "number" &&
        fromRange.start >= rightRange.start &&
        (fromRange.end ?? rightRange.end) <= rightRange.end
      ) {
        return true;
      }
    }
    current = current.parent ?? null;
  }
  return false;
};

const isInsideTry = (from: EsTreeNode, to: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = from.parent;
  while (current && current !== to) {
    if (isNodeOfType(current, "TryStatement")) return true;
    if (isNodeOfType(current, "CatchClause")) return true;
    current = current.parent ?? null;
  }
  return false;
};

const isInsideLoop = (from: EsTreeNode, to: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = from.parent;
  while (current && current !== to) {
    if (
      isNodeOfType(current, "ForStatement") ||
      isNodeOfType(current, "ForInStatement") ||
      isNodeOfType(current, "ForOfStatement") ||
      isNodeOfType(current, "WhileStatement") ||
      isNodeOfType(current, "DoWhileStatement")
    ) {
      return true;
    }
    current = current.parent ?? null;
  }
  return false;
};

export const rulesOfHooks = defineRule<Rule>({
  id: "rules-of-hooks",
  severity: "error",
  recommendation: "Call hooks at the top level of a React function component or a custom Hook.",
  category: "Correctness",
  create: (context) => {
    return {
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        const hookContext = isHookCall(node as EsTreeNode, context.scopes);
        if (!hookContext) return;
        const { hookName } = hookContext;
        const enclosing = findEnclosingFunctionInfo(node as EsTreeNode);

        // Top-level hook call — outside any function.
        if (!enclosing) {
          context.report({
            node: node.callee,
            message: buildTopLevelMessage(hookName),
          });
          return;
        }

        // Class component: hooks not allowed.
        if (isInsideClassComponent(node as EsTreeNode)) {
          context.report({
            node: node.callee,
            message: buildClassComponentMessage(hookName),
          });
          return;
        }

        // Async function: hooks not allowed (regardless of name shape).
        if (enclosing.isAsync) {
          context.report({
            node: node.callee,
            message: buildAsyncMessage(hookName),
          });
          return;
        }

        // The `use` hook (React 19) skips the
        // conditional/loop/try-catch/early-return checks. It MUST
        // still be inside a component/hook scope.
        const isUseHook = isReactUseHook(hookName);

        // The `use` hook (React 19) is allowed in callbacks inside a
        // component / hook — walk outward looking for any
        // component/hook context.
        if (isUseHook) {
          let outerCheck: EsTreeNode | null = enclosing.node;
          let isInsideComponentOrHook = enclosing.isComponentOrHook;
          while (!isInsideComponentOrHook && outerCheck) {
            const parentInfo = findEnclosingFunctionInfo(outerCheck);
            if (!parentInfo) break;
            outerCheck = parentInfo.node;
            if (parentInfo.isComponentOrHook) isInsideComponentOrHook = true;
          }
          if (!isInsideComponentOrHook) {
            context.report({
              node: node.callee,
              message: buildNonComponentMessage(hookName, enclosing.name),
            });
          }
          return;
        }

        // Anonymous functions usually skip the non-component checks
        // (OXC's rule can't determine the runtime context for a
        // generic callback). EXCEPT when the callback is a JSX child
        // / attribute value — those are render-prop callbacks where
        // hook usage is unambiguously wrong.
        if (!enclosing.hasResolvedName) {
          const fnParent = enclosing.node.parent;
          const isJsxRenderProp =
            fnParent !== undefined &&
            fnParent !== null &&
            (isNodeOfType(fnParent, "JSXExpressionContainer") ||
              (isNodeOfType(fnParent, "JSXAttribute") && false));
          if (!isJsxRenderProp) return;
        }

        // Function-name check: must be PascalCase component or use<X>
        // hook. Anonymous functions are tolerated when assigned to a
        // PascalCase / use-prefixed binding (handled in
        // findEnclosingFunctionInfo).
        if (!enclosing.isComponentOrHook) {
          context.report({
            node: node.callee,
            message: buildNonComponentMessage(hookName, enclosing.name),
          });
          return;
        }

        // Loop: hooks may execute more than once.
        if (isInsideLoop(node as EsTreeNode, enclosing.node)) {
          context.report({
            node: node.callee,
            message: buildLoopMessage(hookName),
          });
          return;
        }

        // Try/Catch: hooks not allowed.
        if (isInsideTry(node as EsTreeNode, enclosing.node)) {
          context.report({
            node: node.callee,
            message: buildTryMessage(hookName),
          });
          return;
        }

        // Conditional via ternary / short-circuit.
        if (hasShortCircuitAncestor(node as EsTreeNode, enclosing.node)) {
          context.report({
            node: node.callee,
            message: buildConditionalMessage(hookName),
          });
          return;
        }

        // CFG-based check: is this hook call unconditional from the
        // function entry? Catches early-return patterns and
        // if-statement bodies.
        if (!context.cfg.isUnconditionalFromEntry(node as EsTreeNode)) {
          context.report({
            node: node.callee,
            message: buildConditionalMessage(hookName),
          });
        }
      },
    };
  },
});
