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
const buildDuplicateDepMessage = (hookName: string, depName: string): string =>
  `React Hook \`${hookName}\` has duplicate dependency \`${depName}\`.`;
const buildLiteralDepMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` was passed a literal as a dependency. Literals never change so they cannot trigger an update — remove them from the dependency array.`;
const buildRefCurrentDepMessage = (hookName: string, depName: string): string =>
  `React Hook \`${hookName}\` shouldn't include \`${depName}\` in the dependency array — mutable values like \`.current\` aren't valid deps; depend on \`${depName.replace(/\.current$/, "")}\` itself instead.`;
const buildNonArrayDepsMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` has a second argument which is not an array literal. This means oxlint cannot statically verify whether the dependencies are exhaustive — replace the variable with an inline array.`;
const buildMissingDepArrayMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` does nothing when called with only one argument — pass a dependency array as the second argument.`;
const buildMissingCallbackMessage = (hookName: string): string =>
  `React Hook \`${hookName}\` requires an effect callback — pass a function as the first argument.`;
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
//   useEffectEvent's return value
//   primitive-literal local consts (the value never changes between
//     renders unless the literal does)
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
  if (!init) return false;

  // Primitive literal initializer of a `const` binding — the value
  // cannot change between renders, so the captured reference is
  // structurally stable for dep-array purposes. `let` / `var` could
  // be reassigned and don't qualify.
  if (symbol.kind === "const") {
    if (
      isNodeOfType(init, "Literal") &&
      (init.value === null ||
        typeof init.value === "number" ||
        typeof init.value === "string" ||
        typeof init.value === "boolean")
    ) {
      return true;
    }
    if (isNodeOfType(init, "TemplateLiteral") && init.expressions.length === 0) {
      return true;
    }
  }

  if (!isNodeOfType(init, "CallExpression")) return false;
  const hookName = getHookName(init.callee);
  if (!hookName) return false;
  // useRef returns a stable ref; the binding itself is the ref.
  if (hookName === "useRef") return true;
  // useEffectEvent returns a stable callback (React's own RFC).
  if (hookName === "useEffectEvent") return true;
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
  let parent = ident.parent ?? null;
  // Strip ChainExpression wrappers (a?.b parses to `ChainExpression {
  // expression: MemberExpression { object: a, property: b, optional }
  // }`). We want the inner MemberExpression for stringify.
  if (parent && parent.type === "ChainExpression") {
    parent = parent.parent ?? null;
  }
  // If the identifier is .object of a MemberExpression chain, walk up
  // to the outermost MemberExpression and stringify it. EXCEPTION:
  // `.current` access on a ref doesn't include `.current`.
  if (parent && isNodeOfType(parent, "MemberExpression") && parent.object === ident) {
    let outer: EsTreeNode = parent;
    while (true) {
      const grandparent: EsTreeNode | null | undefined = outer.parent;
      if (!grandparent) break;
      // Walk through ChainExpression wrappers.
      const candidate: EsTreeNode | null | undefined =
        grandparent.type === "ChainExpression"
          ? (grandparent as { parent?: EsTreeNode | null }).parent
          : grandparent;
      const expectedObject: EsTreeNode =
        grandparent.type === "ChainExpression" ? grandparent : outer;
      if (
        candidate &&
        isNodeOfType(candidate, "MemberExpression") &&
        candidate.object === expectedObject
      ) {
        outer = candidate;
        continue;
      }
      break;
    }
    const fullName = stringifyMemberChain(outer);
    if (fullName === null) return flattenReferenceRootName(reference);
    // Strip `.current` suffix for ref-like values; that property is
    // mutable but the ref itself is stable.
    if (fullName.endsWith(".current")) {
      return fullName.slice(0, -".current".length);
    }
    return fullName;
  }
  return flattenReferenceRootName(reference);
};

// Strip TypeScript expression wrappers transparently — `(x as T)`,
// `x satisfies T`, `x!`, `(x)` — so they don't change the dep key.
const unwrapExpression = (node: EsTreeNode): EsTreeNode => {
  let current = node;
  while (true) {
    const type: string = (current as { type: string }).type;
    if (
      type === "TSAsExpression" ||
      type === "TSSatisfiesExpression" ||
      type === "TSNonNullExpression" ||
      type === "TSTypeAssertion" ||
      type === "ParenthesizedExpression" ||
      type === "ChainExpression"
    ) {
      const inner = (current as { expression: EsTreeNode }).expression;
      if (!inner) return current;
      current = inner;
      continue;
    }
    return current;
  }
};

// Given a dependency-array element, return its "key" — same canonical
// form as computeDepKey. Returns null when the entry is something
// unanalyzable (computed, spread, etc.).
const computeDeclaredDepKey = (entry: EsTreeNode): string | null => {
  const stripped = unwrapExpression(entry);
  if (isNodeOfType(stripped, "Identifier")) return stripped.name;
  if (isNodeOfType(stripped, "MemberExpression")) {
    return stringifyMemberChain(stripped);
  }
  return null;
};

const stringifyMemberChain = (node: EsTreeNode): string | null => {
  const stripped = unwrapExpression(node);
  if (isNodeOfType(stripped, "Identifier")) return stripped.name;
  if (isNodeOfType(stripped, "ThisExpression")) return "this";
  if (isNodeOfType(stripped, "MemberExpression")) {
    const obj = stringifyMemberChain(stripped.object);
    if (obj && !stripped.computed && isNodeOfType(stripped.property, "Identifier")) {
      return `${obj}.${stripped.property.name}`;
    }
  }
  return null;
};

interface CaptureCollection {
  keys: Set<string>;
  refsByKey: Map<string, ReferenceDescriptor[]>;
  // Names of bindings that the callback captured but that we filtered
  // out of `keys` because their value is structurally stable (literal
  // const, useState setter, useRef, useEffectEvent, module-scope).
  // These are valid-but-redundant deps — flagging them as unnecessary
  // would diverge from upstream's policy.
  stableCapturedNames: Set<string>;
}

// Walks captures grouping by "dep key" (the canonical name of the
// outermost member-expression chain).
const collectCaptureDepKeys = (
  callback: EsTreeNode,
  scopes: import("../../semantic/scope-analysis.js").ScopeAnalysis,
): CaptureCollection => {
  const captures = closureCaptures(callback, scopes);
  const keys = new Set<string>();
  const refsByKey = new Map<string, ReferenceDescriptor[]>();
  const stableCapturedNames = new Set<string>();
  for (const reference of captures) {
    const symbol = reference.resolvedSymbol;
    if (!symbol) continue;
    // Skip stable hook returns (setX, dispatch, ref).
    if (symbolHasStableHookOrigin(symbol)) {
      stableCapturedNames.add(symbol.name);
      continue;
    }
    // Skip bindings declared outside any function — they don't change
    // between renders, so React doesn't need them in deps. Walks the
    // scope chain looking for ANY enclosing function before module;
    // if none, the binding is module-stable (covers `const x = {}`
    // both at module top and inside `{ const x = {}; useEffect(...) }`
    // block-at-module-level). We do NOT mark these as
    // `stableCapturedNames` because module-scope values (especially
    // imports) can technically be mutated externally — upstream
    // still flags them as unnecessary if the user lists them in deps.
    if (isOutsideAllFunctions(symbol)) {
      continue;
    }
    const depKey = computeDepKey(reference);
    if (!depKey) continue;
    keys.add(depKey);
    const list = refsByKey.get(depKey) ?? [];
    list.push(reference);
    refsByKey.set(depKey, list);
  }
  return { keys, refsByKey, stableCapturedNames };
};

const isOutsideAllFunctions = (symbol: SymbolDescriptor): boolean => {
  let scope: SymbolDescriptor["scope"] | null = symbol.scope;
  while (scope) {
    if (scope.kind === "function" || scope.kind === "arrow-function" || scope.kind === "method") {
      return false;
    }
    if (scope.kind === "module") return true;
    scope = scope.parent ?? null;
  }
  return true;
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

    // Hooks that REQUIRE a deps array (silently doing nothing without
    // one is a common bug). useEffect / useLayoutEffect / useInsertionEffect
    // tolerate omitting deps (intentional run-on-every-render); useMemo /
    // useCallback / useImperativeHandle do not.
    const requiresDepsArray = (hookName: string): boolean =>
      hookName === "useMemo" || hookName === "useCallback" || hookName === "useImperativeHandle";

    return {
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        const hookName = getHookName(node.callee);
        if (!hookName || !isHookOfInterest(hookName)) return;

        const callback = node.arguments[0];
        if (!callback) {
          context.report({ node, message: buildMissingCallbackMessage(hookName) });
          return;
        }
        if (
          !isNodeOfType(callback, "ArrowFunctionExpression") &&
          !isNodeOfType(callback, "FunctionExpression")
        ) {
          // Callback that isn't a function literal (e.g. a passed
          // variable) — can't statically analyze its closure. We
          // still flag missing deps for hooks that require them.
          if (requiresDepsArray(hookName) && !node.arguments[1]) {
            context.report({ node, message: buildMissingDepArrayMessage(hookName) });
          }
          return;
        }

        const depsArgRaw = node.arguments[1];

        if (!depsArgRaw) {
          if (requiresDepsArray(hookName)) {
            context.report({ node, message: buildMissingDepArrayMessage(hookName) });
          }
          return;
        }

        // null / undefined deps arg → treat as "no deps", not as a
        // typed/array deps value. Upstream tolerates these as
        // "intentional no-deps" for useEffect-style hooks but flags
        // them for hooks that require deps.
        const depsArg = unwrapExpression(depsArgRaw as EsTreeNode);
        if (
          (isNodeOfType(depsArg, "Literal") && depsArg.value === null) ||
          (isNodeOfType(depsArg, "Identifier") && depsArg.name === "undefined")
        ) {
          if (requiresDepsArray(hookName)) {
            context.report({ node: depsArg, message: buildMissingDepArrayMessage(hookName) });
          }
          return;
        }

        if (!isNodeOfType(depsArg, "ArrayExpression")) {
          // Non-array deps (e.g. variable reference) — can't statically
          // diff and React itself accepts only array literals. Flag.
          context.report({ node: depsArg, message: buildNonArrayDepsMessage(hookName) });
          return;
        }

        // Collect the captures actually referenced by the callback.
        const { keys: captureKeys, stableCapturedNames } = collectCaptureDepKeys(
          callback as EsTreeNode,
          context.scopes,
        );

        // Collect the declared deps array entries (canonical keys).
        const declaredKeys = new Set<string>();
        const declaredKeyToNode = new Map<string, EsTreeNode>();
        const seenInDepsArray = new Set<string>();
        // Pre-scan: emit a single "literal deps" warning when the
        // deps array contains a non-string-literal value (numeric /
        // boolean / null / bigint). String-literal deps are usually
        // typos of an identifier ("foo" → foo) and upstream emits
        // those via the missing-dep message's hint instead of an
        // extra summary warning, so we suppress this summary when
        // every literal in the array is a string.
        const literalElements = depsArg.elements.filter((element) => {
          if (!element) return false;
          const stripped = unwrapExpression(element as EsTreeNode);
          return (
            isNodeOfType(stripped, "Literal") ||
            (isNodeOfType(stripped, "TemplateLiteral") && stripped.expressions.length === 0)
          );
        });
        const hasNonStringLiteral = literalElements.some((element) => {
          const stripped = unwrapExpression(element as EsTreeNode);
          if (
            isNodeOfType(stripped, "Literal") &&
            typeof (stripped as { value?: unknown }).value !== "string"
          ) {
            return true;
          }
          return false;
        });
        if (hasNonStringLiteral) {
          context.report({ node: depsArg, message: buildLiteralDepMessage(hookName) });
        }

        for (const element of depsArg.elements) {
          if (!element) continue;
          const elementNode = element as EsTreeNode;
          const stripped = unwrapExpression(elementNode);

          // Literals don't act as real deps — skip them silently
          // (the all-literal case was already flagged once above).
          if (
            isNodeOfType(stripped, "Literal") ||
            (isNodeOfType(stripped, "TemplateLiteral") && stripped.expressions.length === 0)
          ) {
            continue;
          }

          // Detect `<ref>.current` member access on a useRef binding.
          // Even though our `computeDeclaredDepKey` strips the
          // `.current` suffix to canonicalize against the ref capture,
          // upstream specifically flags this surface form: developers
          // shouldn't include `.current` in deps because `.current` is
          // mutable.
          const fullChain = stringifyMemberChain(stripped);
          if (
            fullChain &&
            fullChain.endsWith(".current") &&
            isNodeOfType(stripped, "MemberExpression") &&
            isNodeOfType(stripped.object, "Identifier")
          ) {
            const symbol = context.scopes.symbolFor(stripped.object);
            if (symbol && symbolHasStableHookOrigin(symbol)) {
              context.report({
                node: elementNode,
                message: buildRefCurrentDepMessage(hookName, fullChain),
              });
              continue;
            }
          }

          const key = computeDeclaredDepKey(elementNode);
          if (key === null) continue;
          if (seenInDepsArray.has(key)) {
            context.report({
              node: elementNode,
              message: buildDuplicateDepMessage(hookName, key),
            });
            continue;
          }
          seenInDepsArray.add(key);
          declaredKeys.add(key);
          declaredKeyToNode.set(key, elementNode);
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

        // Unnecessary: declared but not captured. We suppress the
        // report ONLY when the binding was filtered out of captureKeys
        // for being STRUCTURALLY STABLE (literal-typed local const,
        // useState setter, useRef, module-scope value, etc.). Those
        // are valid-but-redundant deps and upstream tolerates them.
        // Other "captured by name but at a different chain depth"
        // mismatches (e.g. declared `local.id` while the callback
        // captures `local`) are real redundancies and we flag them.
        for (const declaredKey of declaredKeys) {
          let isUsed = false;
          for (const capture of captureKeys) {
            if (capture === declaredKey || capture.startsWith(`${declaredKey}.`)) {
              isUsed = true;
              break;
            }
          }
          if (isUsed) continue;
          const rootName = declaredKey.split(".")[0]!;
          if (stableCapturedNames.has(rootName)) continue;
          const reportNode = declaredKeyToNode.get(declaredKey) ?? depsArg;
          context.report({
            node: reportNode,
            message: buildUnnecessaryDepMessage(hookName, declaredKey),
          });
        }
      },
    };
  },
});
