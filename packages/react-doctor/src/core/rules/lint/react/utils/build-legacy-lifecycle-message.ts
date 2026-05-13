import { LEGACY_LIFECYCLE_REPLACEMENTS } from "./legacy-lifecycle-replacements.js";
import { stripUnsafePrefix } from "./strip-unsafe-prefix.js";

export const buildLegacyLifecycleMessage = (originalName: string): string | null => {
  const { baseName, hasUnsafePrefix } = stripUnsafePrefix(originalName);
  const replacement = LEGACY_LIFECYCLE_REPLACEMENTS.get(baseName);
  if (!replacement) return null;
  const removalNote = hasUnsafePrefix
    ? `\`${originalName}\` is removed in React 19 (the UNSAFE_ prefix only silences the React 18 warning, it doesn't fix the concurrent-mode hazard).`
    : `\`${originalName}\` is removed in React 19 and warns in React 18.3.1.`;
  return `${removalNote} ${replacement}.`;
};
