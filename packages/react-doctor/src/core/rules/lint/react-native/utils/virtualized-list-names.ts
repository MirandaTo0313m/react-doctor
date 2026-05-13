// HACK: TouchableOpacity / TouchableHighlight / TouchableWithoutFeedback /
// TouchableNativeFeedback are legacy and feature-frozen. Pressable is the
// modern, more configurable, more accessible replacement that works the
// same on iOS, Android, and Fabric.

// HACK: react-native's built-in <Image> has no caching, no placeholders,
// no progressive loading, and no priority hints. expo-image is a drop-in
// replacement (same prop API plus more) with disk + memory caching, blur
// placeholders, and crossfades - a major perceived-perf win for any list
// or hero image.

export const VIRTUALIZED_LIST_NAMES = new Set([
  "FlatList",
  "FlashList",
  "LegendList",
  "SectionList",
  "VirtualizedList",
]);
