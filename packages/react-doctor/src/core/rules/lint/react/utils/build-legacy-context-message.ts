// HACK: React Compiler memoizes inside a component based on stable
// reference equality of *destructured* values. `router.push("/x")`
// reads `push` off the hook return on every render, which the compiler
// can't memoize as cleanly as a destructured `const { push } = useRouter()`.
// The destructured form also makes the dependency graph obvious - if
// you only need `push`, the compiler doesn't need to track all of
// `router`. This is a soft signal even without React Compiler enabled
// (it makes intent clearer and reduces accidental capture).
//
// Heuristic: `router.push(...)` (or any of the canonical hook objects)
// where `router` is bound to a `useRouter()` call in the same component.
// We don't fire when the binding is destructured already.

// HACK: the three legacy class lifecycles `componentWillMount`,
// `componentWillReceiveProps`, and `componentWillUpdate` are unsafe
// under concurrent rendering because the renderer can call them, throw
// the work away, and call them again. React 18.3.1 emits a warning;
// React 19 REMOVES them entirely (the `UNSAFE_` prefix included). We
// flag both forms so the prefix doesn't get treated as a permanent fix.
//
// Stored as a Map (not a plain object) because plain-object lookups inherit
// from `Object.prototype` - `LEGACY_LIFECYCLE_REPLACEMENTS["constructor"]`
// returns the native `Object` function (truthy), which previously made the
// rule false-positive on every class with a constructor (Lexical nodes,
// MobX stores, custom Error subclasses, etc.). Maps return `undefined` for
// missing keys with no prototype fall-through.

export const buildLegacyContextMessage = (memberName: string): string => {
  if (memberName === "childContextTypes" || memberName === "getChildContext") {
    return `${memberName} is part of the legacy context API (REMOVED in React 19). Replace the provider with \`createContext\` + \`<MyContext.Provider value={...}>\` and consume via \`useContext()\` (or \`use()\` on React 19+) - every consumer must migrate together`;
  }
  return "contextTypes is part of the legacy context API (REMOVED in React 19). Replace with `static contextType = MyContext` (single context) or read the modern context with `useContext()` / `use()` from a function component - coordinate with the provider's migration";
};
