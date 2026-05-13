import type { ParsedRgb } from "../../utils/index.js";
import { parseColorToRgb } from "./parse-color-to-rgb.js";

export const extractColorFromShadowLayer = (layer: string): ParsedRgb | null => {
  const rgbMatch = layer.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      red: parseInt(rgbMatch[1], 10),
      green: parseInt(rgbMatch[2], 10),
      blue: parseInt(rgbMatch[3], 10),
    };
  }

  const hexMatch = layer.match(/#([0-9a-f]{3,6})\b/i);
  if (hexMatch) return parseColorToRgb(`#${hexMatch[1]}`);

  return null;
};
