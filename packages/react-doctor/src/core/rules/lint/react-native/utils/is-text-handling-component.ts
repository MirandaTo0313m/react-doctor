import { REACT_NATIVE_TEXT_COMPONENTS } from "../../constants.js";
import { REACT_NATIVE_TEXT_COMPONENT_KEYWORDS } from "../../constants.js";

// HACK: every row of a virtualized list invokes its `renderItem`
// function - and any `() => onPress(item.id)` arrow created inside that
// function is a fresh closure per row, per render. memo()-wrapped row
// components see a different identity for the handler each time and
// rerender even when the row data didn't change. Hoist the handler at
// list scope (`const handlePress = useCallback((id) => ..., [])`) and
// pass the row's id as a primitive prop.

export const isTextHandlingComponent = (elementName: string): boolean => {
  if (REACT_NATIVE_TEXT_COMPONENTS.has(elementName)) return true;
  return [...REACT_NATIVE_TEXT_COMPONENT_KEYWORDS].some((keyword) => elementName.includes(keyword));
};
