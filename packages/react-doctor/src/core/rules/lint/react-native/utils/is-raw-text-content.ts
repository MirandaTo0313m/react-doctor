import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: <Pressable onPressIn={() => sv.value = withTiming(0.95)}> bounces
// the gesture across the JS bridge twice (press in → JS handler → set
// shared value → animation kicks off), which is visibly stuttery on
// Android. The Reanimated GestureDetector + Gesture.Tap() runs entirely
// on the UI thread for native-feeling press feedback. We only flag when
// the receiver is actually a `useSharedValue` binding to avoid
// false-positives on `Map.prototype.set` / `ref.current.value =` etc.

// Short-name form: resolveJsxElementName drops the `Animated.` prefix,
// so `<Animated.FlatList>` resolves to `"FlatList"` and matches here.

export const isRawTextContent = (child: EsTreeNode): boolean => {
  if (isNodeOfType(child, "JSXText")) return Boolean(child.value?.trim());
  if (!isNodeOfType(child, "JSXExpressionContainer") || !child.expression) return false;

  const expression = child.expression;
  return (
    (isNodeOfType(expression, "Literal") &&
      (typeof expression.value === "string" || typeof expression.value === "number")) ||
    isNodeOfType(expression, "TemplateLiteral")
  );
};
