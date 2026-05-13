// HACK: O(1) lookup. Indexes top-level `const x = useFooBar(...)`
// declarations once per component on enter, so subsequent
// MemberExpression visitors don't re-walk the whole body for every
// access.

export const LEGACY_CONTEXT_NAMES: ReadonlySet<string> = new Set([
  "childContextTypes",
  "contextTypes",
  "getChildContext",
]);
