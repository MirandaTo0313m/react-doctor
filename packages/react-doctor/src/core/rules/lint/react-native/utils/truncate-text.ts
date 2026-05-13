import { RAW_TEXT_PREVIEW_MAX_CHARS } from "../../constants.js";

// HACK: in Reanimated, `useAnimatedStyle(() => ({ height: …, width: … }))`
// runs the animation on the JS layout thread (or worse, triggers actual
// layout passes per frame). transform / opacity stay on the GPU
// compositor. For anything driven by `withTiming` / `withSpring` /
// shared values, animate `transform: [{ translateX/Y }, { scale }]` or
// `opacity` instead.

// HACK: <SafeAreaView> wrapping <ScrollView> (or
// `useSafeAreaInsets()` + `paddingTop: insets.top` in
// `contentContainerStyle`) is the legacy way to handle safe areas.
// Modern RN exposes `contentInsetAdjustmentBehavior="automatic"` which
// the OS computes natively, integrating with sticky headers, large
// titles, and keyboard avoidance for free.

export const truncateText = (text: string): string =>
  text.length > RAW_TEXT_PREVIEW_MAX_CHARS
    ? `${text.slice(0, RAW_TEXT_PREVIEW_MAX_CHARS)}...`
    : text;
