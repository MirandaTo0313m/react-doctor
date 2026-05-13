import { DARK_BACKGROUND_CHANNEL_MAX } from "../../constants.js";
import { isPureBlackColor } from "./is-pure-black-color.js";
import { parseColorToRgb } from "./parse-color-to-rgb.js";

export const isBackgroundDark = (bgValue: string): boolean => {
  const trimmed = bgValue.trim().toLowerCase();
  if (isPureBlackColor(trimmed)) return true;

  const parsed = parseColorToRgb(trimmed);
  if (!parsed) return false;

  return (
    parsed.red <= DARK_BACKGROUND_CHANNEL_MAX &&
    parsed.green <= DARK_BACKGROUND_CHANNEL_MAX &&
    parsed.blue <= DARK_BACKGROUND_CHANNEL_MAX
  );
};
