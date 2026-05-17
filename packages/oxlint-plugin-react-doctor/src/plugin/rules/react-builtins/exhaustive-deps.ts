import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import { closureCaptures } from "../../semantic/closure-captures.js";
import type { ReferenceDescriptor, SymbolDescriptor } from "../../semantic/scope-analysis.js";

// Port of `oxc_linter::rules::react::exhaustive_deps`. Diffs the
// closure-captured set of an effect / memo callback against its
// declared dependency array. Built on top of Phase A's scope analyzer
// and Phase C's closure-capture helper.

const buildMissingDepMessage = (hookName: string, depName: string): string =>
  `React Hook \`${hookName}\` is missing dependency \`${depName}\` — list it in the dependency array, or call the hook unconditionally.`;
const buildUnnecessaryDepMessage = (hookName: string, depName: string): string =>
  `React Hook \`${hookName}\` has an unnecessary dependency \`${depName}\` — it isn't referenced inside the callback.`;
interface ExhaustiveDepsSettings {
  additionalHooks?: string;
  enableDangerousAutofixThisMayCauseInfiniteLoops?: boolean;
}

const resolveSettings = (
  settings: Readonly<Record<string, unknown>> | undefined,
): Required<ExhaustiveDepsSettings> => {
  const reactDoctor = settings?.["react-doctor"];
  const ruleSettings =
    typeof reactDoctor === "object" && reactDoctor !== null
      ? ((reactDoctor as { exhaustiveDeps?: ExhaustiveDepsSettings }).exhaustiveDeps ?? {})
      : {};
  return {
    additionalHooks: ruleSettings.additionalHooks ?? "",
    enableDangerousAutofixThisMayCauseInfiniteLoops:
      ruleSettings.enableDangerousAutofixThisMayCauseInfiniteLoops ?? false,
  };
};

// Hooks whose callback captures must match a deps array.
const HOOK_REQUIRES_DEPS: ReadonlySet<string> = new Set([
  "useEffect",
  "useLayoutEffect",
  "useCallback",
  "useMemo",
  "useImperativeHandle",
  "useInsertionEffect",
]);

const buildAdditionalHooksRegex = (additional: string): RegExp | null => {
  if (!additional) return null;
  try {
    return new RegExp(additional);
  } catch {
    return null;
  }
};

const getHookName = (callee: EsTreeNode): string | null => {
  if (isNodeOfType(callee, "Identifier")) return callee.name;
  if (
    isNodeOfType(callee, "MemberExpression") &&
    !callee.computed &&
    isNodeOfType(callee.property, "Identifier")
  ) {
    return callee.property.name;
  }
  return null;
};

// True for symbols whose returned value (or destructured pieces) are
// stable across re-renders and don't need to live in deps arrays:
//   useState's setter (`setX`)
//   useReducer's dispatch
//   useRef's ref object
const symbolHasStableHookOrigin = (symbol: SymbolDescriptor): boolean => {
  // We need the binding's parent context. The symbol's
  // declarationNode is the VariableDeclarator (when destructured) or
  // the binding identifier itself.
  const decl = symbol.declarationNode;
  let declarator: EsTreeNode | null | undefined = decl;
  while (declarator && declarator.type !== "VariableDeclarator") {
    declarator = declarator.parent ?? null;
  }
  if (!declarator) return false;
  const init = (declarator as { init: EsTreeNode | null }).init;
  if (!init || !isNodeOfType(init, "CallExpression")) return false;
  const hookName = getHookName(init.callee);
  if (!hookName) return false;
  // useRef returns a stable ref; the binding itself is the ref.
  if (hookName === "useRef") return true;
  // useState / useReducer: the SECOND destructure element (setter /
  // dispatch) is stable; the first is mutable.
  if (hookName === "useState" || hookName === "useReducer") {
    const id = (declarator as { id: EsTreeNode }).id;
    if (!isNodeOfType(id, "ArrayPattern")) return false;
    // Find which array index this binding occupies.
    const elements = id.elements;
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      if (!element) continue;
      // The element is either an Identifier directly or an
      // AssignmentPattern wrapping one. Only index 1 (setter /
      // dispatch) is stable.
      const inner = isNodeOfType(element as EsTreeNode, "AssignmentPattern")
        ? (element as { left: EsTreeNode }).left
        : (element as EsTreeNode);
      if (isNodeOfType(inner, "Identifier") && symbol.bindingIdentifier === inner && index === 1) {
        return true;
      }
    }
    return false;
  }
  return false;
};

// Walks UP from a Reference's identifier to find the outermost
// MemberExpression chain it's the object of, e.g. for `props.foo.bar`
// returns "props". Used to compute the canonical dep name.
const flattenReferenceRootName = (reference: ReferenceDescriptor): string => {
  const identifier = reference.identifier as { name?: string };
  return typeof identifier.name === "string" ? identifier.name : "";
};

// Computes the dep "key" (root identifier name OR the full member-path)
// for a captured reference. e.g.:
//   reference points to `count`            → "count"
//   reference is `props` in `props.foo`    → "props.foo" (we
//   reference is `ref` in `ref.current`    → "ref" (`.current` access
//                                             doesn't add a dep)
const computeDepKey = (reference: ReferenceDescriptor): string => {
  const ident = reference.identifier;
  const parent = ident.parent;
  // If the identifier is .object of a MemberExpression chain, walk up
  // to the outermost MemberExpression and stringify it. EXCEPTION:
  // `.current` access on a ref doesn't include `.current`.
  if (parent && isNodeOfType(parent, "MemberExpression") && parent.object === ident) {
    let outer: EsTreeNode = parent;
    while (
      outer.parent &&
      isNodeOfType(outer.parent, "MemberExpression") &&
      outer.parent.object === outer
    ) {
      outer = outer.parent;
    }
    // Stringify
    const stringify = (node: EsTreeNode): string => {
      if (isNodeOfType(node, "Identifier")) return node.name;
      if (isNodeOfType(node, "MemberExpression")) {
        const obj = stringify(node.object);
        if (!node.computed && isNodeOfType(node.property, "Identifier")) {
          return `${obj}.${node.property.name}`;
        }
      }
      return (ident as { name?: string }).name ?? "";
    };
    const fullName = stringify(outer);
    // Strip `.current` suffix for ref-like values; that property is
    // mutable but the ref itself is stable.
    if (fullName.endsWith(".current")) {
      return fullName.slice(0, -".current".length);
    }
    return fullName;
  }
  return flattenReferenceRootName(reference);
};

// Given a dependency-array element, return its "key" — same canonical
// form as computeDepKey. Returns null when the entry is something
// unanalyzable (computed, spread, etc.).
const computeDeclaredDepKey = (entry: EsTreeNode): string | null => {
  if (isNodeOfType(entry, "Identifier")) return entry.name;
  if (isNodeOfType(entry, "MemberExpression")) {
    const stringify = (node: EsTreeNode): string | null => {
      if (isNodeOfType(node, "Identifier")) return node.name;
      if (isNodeOfType(node, "MemberExpression")) {
        const obj = stringify(node.object);
        if (obj && !node.computed && isNodeOfType(node.property, "Identifier")) {
          return `${obj}.${node.property.name}`;
        }
      }
      return null;
    };
    return stringify(entry);
  }
  return null;
};

// Walks captures grouping by "dep key" (the canonical name of the
// outermost member-expression chain).
const collectCaptureDepKeys = (
  callback: EsTreeNode,
  scopes: import("../../semantic/scope-analysis.js").ScopeAnalysis,
): { keys: Set<string>; refsByKey: Map<string, ReferenceDescriptor[]> } => {
  const captures = closureCaptures(callback, scopes);
  const keys = new Set<string>();
  const refsByKey = new Map<string, ReferenceDescriptor[]>();
  for (const reference of captures) {
    const symbol = reference.resolvedSymbol;
    if (!symbol) continue;
    // Skip stable hook returns (setX, dispatch, ref).
    if (symbolHasStableHookOrigin(symbol)) continue;
    // Skip top-level / module-scope bindings whose declaration is
    // outside any function (module-level constants don't change
    // between renders, so React doesn't need them in deps).
    if (symbol.scope.kind === "module") {
      // Imports / module-level consts / functions are stable.
      if (
        symbol.kind === "import" ||
        symbol.kind === "const" ||
        symbol.kind === "function" ||
        symbol.kind === "class" ||
        symbol.kind === "ts-import-equals" ||
        symbol.kind === "ts-enum" ||
        symbol.kind === "ts-type-alias" ||
        symbol.kind === "ts-interface" ||
        symbol.kind === "ts-module"
      ) {
        continue;
      }
    }
    const depKey = computeDepKey(reference);
    if (!depKey) continue;
    keys.add(depKey);
    const list = refsByKey.get(depKey) ?? [];
    list.push(reference);
    refsByKey.set(depKey, list);
  }
  return { keys, refsByKey };
};

export const exhaustiveDeps = defineRule<Rule>({
  id: "exhaustive-deps",
  severity: "warn",
  recommendation: "List every value the hook callback captures in its dependency array.",
  category: "Correctness",
  create: (context) => {
    const settings = resolveSettings(context.settings);
    const additionalRegex = buildAdditionalHooksRegex(settings.additionalHooks);
    const isHookOfInterest = (hookName: string): boolean => {
      if (HOOK_REQUIRES_DEPS.has(hookName)) return true;
      if (additionalRegex && additionalRegex.test(hookName)) return true;
      return false;
    };

    return {
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        const hookName = getHookName(node.callee);
        if (!hookName || !isHookOfInterest(hookName)) return;

        const callback = node.arguments[0];
        if (
          !callback ||
          (!isNodeOfType(callback, "ArrowFunctionExpression") &&
            !isNodeOfType(callback, "FunctionExpression"))
        ) {
          return;
        }

        const depsArg = node.arguments[1];

        if (!depsArg) {
          // No deps array → effect runs every render. React's
          // official rule treats this as a deliberate choice and
          // doesn't flag.
          return;
        }

        if (!isNodeOfType(depsArg, "ArrayExpression")) {
          // Non-array deps (e.g. variable reference) — can't statically
          // diff. Skip to mirror OXC's "unanalyzable deps" branch.
          return;
        }

        // Collect the captures actually referenced by the callback.
        const { keys: captureKeys } = collectCaptureDepKeys(callback as EsTreeNode, context.scopes);

        // Collect the declared deps array entries (canonical keys).
        const declaredKeys = new Set<string>();
        const declaredKeyToNode = new Map<string, EsTreeNode>();
        for (const element of depsArg.elements) {
          if (!element) continue;
          const key = computeDeclaredDepKey(element as EsTreeNode);
          if (key === null) continue;
          declaredKeys.add(key);
          declaredKeyToNode.set(key, element as EsTreeNode);
        }

        // Missing: in captures but not in declared.
        for (const captureKey of captureKeys) {
          // If we've already declared a PREFIX (e.g. captured
          // `props.foo` but declared `props`), accept.
          let coveredByPrefix = false;
          for (const declared of declaredKeys) {
            if (captureKey === declared) {
              coveredByPrefix = true;
              break;
            }
            if (captureKey.startsWith(`${declared}.`)) {
              coveredByPrefix = true;
              break;
            }
          }
          if (coveredByPrefix) continue;
          context.report({
            node: depsArg,
            message: buildMissingDepMessage(hookName, captureKey),
          });
        }

        // Unnecessary: declared but not captured.
        for (const declaredKey of declaredKeys) {
          let isUsed = false;
          for (const capture of captureKeys) {
            if (capture === declaredKey || capture.startsWith(`${declaredKey}.`)) {
              isUsed = true;
              break;
            }
          }
          if (!isUsed) {
            const reportNode = declaredKeyToNode.get(declaredKey) ?? depsArg;
            context.report({
              node: reportNode,
              message: buildUnnecessaryDepMessage(hookName, declaredKey),
            });
          }
        }
      },
    };
  },
});
