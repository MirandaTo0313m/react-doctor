// HACK: @react-navigation/stack uses a JS-implemented stack with
// imperfect native gesture/feel. native-stack (and native-tabs in v7+)
// uses platform-native UINavigationController / Fragment, giving real
// iOS/Android transitions, swipe-back, and large titles for free.

// HACK: setting React state inside an onScroll handler triggers a re-render
// at scroll-event frequency (60-120Hz). Use a Reanimated shared value
// (useSharedValue + useAnimatedScrollHandler) or a ref + raf throttle so
// the JS thread isn't pegged.

// HACK: short-name only. `resolveJsxElementName` (defined at top of
// file) returns the property name for JSXMemberExpression - e.g.
// `Animated.ScrollView` resolves to `"ScrollView"`, which is what all
// the existing `REACT_NATIVE_*` sets use. Allowlists below use the same
// short-name form.

export const PRESS_HANDLER_PROP_NAMES = new Set(["onPressIn", "onPressOut"]);
