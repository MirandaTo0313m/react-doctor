// HACK: JS-implemented bottom sheets (gorhom/bottom-sheet et al.) do all
// their gesture handling and animation on the JS thread, which is laggy
// for the kind of velocity-tracking interactions a bottom sheet needs.
// React Native v7+ ships a native form sheet via <Modal presentationStyle=
// "formSheet"> that handles gestures, snap points, and detents on the
// platform's native modal stack.

// HACK: dynamic `paddingBottom`/`paddingTop` on `contentContainerStyle`
// (e.g. `paddingBottom: keyboardHeight`) reflows the entire scroll
// content every time the value changes - the rows visually shift, and
// any sticky headers re-pin. The native equivalent is `contentInset`,
// which the platform applies as an OS-level offset without re-laying out
// the content.

export const LEGACY_SHADOW_KEYS = new Set([
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "elevation",
]);
