import { DARK_GLOW_BLUR_THRESHOLD_PX } from "../../constants.js";
import { extractColorFromShadowLayer } from "./extract-color-from-shadow-layer.js";
import { hasColorChroma } from "./has-color-chroma.js";
import { parseShadowLayerBlur } from "./parse-shadow-layer-blur.js";
import { splitShadowLayers } from "./split-shadow-layers.js";

export const hasColoredGlowShadow = (shadowValue: string): boolean => {
  for (const layer of splitShadowLayers(shadowValue)) {
    const color = extractColorFromShadowLayer(layer);
    if (
      color &&
      hasColorChroma(color) &&
      parseShadowLayerBlur(layer) > DARK_GLOW_BLUR_THRESHOLD_PX
    ) {
      return true;
    }
  }
  return false;
};
