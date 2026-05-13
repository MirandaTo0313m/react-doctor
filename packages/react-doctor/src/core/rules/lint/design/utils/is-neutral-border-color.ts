import { hasColorChroma } from "./has-color-chroma.js";
import { parseColorToRgb } from "./parse-color-to-rgb.js";

// HACK: Map (not plain object) so the `key in BORDER_SIDE_KEYS` guard
// below doesn't accept inherited Object.prototype names. Without this,
// any inline style object whose key happens to be `constructor` /
// `toString` / `hasOwnProperty` / `__proto__` would pass the membership
// check and fall through to a garbage report message that reads off
// `BORDER_SIDE_KEYS["constructor"]` (= the native Object function).

export const isNeutralBorderColor = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  if (["gray", "grey", "silver", "white", "black", "transparent", "currentcolor"].includes(trimmed))
    return true;

  const parsed = parseColorToRgb(trimmed);
  if (parsed) return !hasColorChroma(parsed);

  return false;
};
