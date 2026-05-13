// HACK: inside `renderItem`, JSX prop values that are object literals
// (`style={{...}}`, `user={{...}}`, etc.) allocate a fresh object
// reference per row. Any `memo()`-wrapped row component bails its
// shallow-compare for that prop and rerenders even when the underlying
// data didn't change. Hoist the object outside renderItem (StyleSheet,
// constant, useMemo at list scope) or pass primitives into the row.

export const SCROLLVIEW_NAMES = new Set(["ScrollView"]);
