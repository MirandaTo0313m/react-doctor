import { BOUNCE_ANIMATION_NAMES } from "../../constants.js";

export const hasBounceAnimationName = (value: string): boolean => {
  const lowerValue = value.toLowerCase();
  for (const name of BOUNCE_ANIMATION_NAMES) {
    if (lowerValue.includes(name)) return true;
  }
  return false;
};
