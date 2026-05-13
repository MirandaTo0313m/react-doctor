// HACK: shared scaffolding for "report deprecated React-package imports".
// Both `noReact19DeprecatedApis` (for `react`) and
// `noReactDomDeprecatedApis` (for `react-dom`) want the same shape:
//   - bind namespace/default imports of the source to a Set
//   - on ImportSpecifier, look the imported name up in a message map
//   - on MemberExpression off a tracked binding, look the property up
// Hoisting the pattern keeps the two call sites tiny and means future
// React deprecations (e.g. a `react/jsx-runtime` rule) need just one
// new factory call.

export const HOOK_OBJECTS_WITH_METHODS = new Map<string, Set<string>>([
  ["useRouter", new Set(["push", "replace", "back", "forward", "refresh", "prefetch"])],
  [
    "useNavigation",
    new Set(["navigate", "push", "goBack", "popToTop", "reset", "replace", "dispatch"]),
  ],
  ["useSearchParams", new Set(["get", "getAll", "has", "set"])],
]);
