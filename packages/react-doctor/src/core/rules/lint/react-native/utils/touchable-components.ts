// HACK: <ScrollView>{items.map(...)}</ScrollView> renders every row in
// memory - for any list longer than ~10 items this destroys scroll
// performance on lower-end devices. FlashList / LegendList / FlatList
// recycle row components and only mount the visible window. The cost
// of switching is tiny (same prop API) and the perf win is huge.

export const TOUCHABLE_COMPONENTS = new Set([
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
  "TouchableNativeFeedback",
]);
