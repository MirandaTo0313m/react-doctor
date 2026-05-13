import type { UnsafePrefixSplit } from "./unsafe-prefix-split.js";

export const stripUnsafePrefix = (name: string): UnsafePrefixSplit => {
  if (name.startsWith("UNSAFE_")) {
    return { baseName: name.slice("UNSAFE_".length), hasUnsafePrefix: true };
  }
  return { baseName: name, hasUnsafePrefix: false };
};
