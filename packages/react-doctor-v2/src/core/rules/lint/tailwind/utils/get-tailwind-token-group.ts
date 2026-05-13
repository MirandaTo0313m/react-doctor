import type { TailwindTokenGroup } from "./tailwind-token-group.js";
import { DISPLAY_TOKENS } from "./display-tokens.js";
import { POSITION_TOKENS } from "./position-tokens.js";
import { TEXT_SIZE_TOKENS } from "./text-size-tokens.js";
import { getOverflowGroup } from "./get-overflow-group.js";
import { getSizeGroup } from "./get-size-group.js";
import { getSpacingGroup } from "./get-spacing-group.js";
import { splitVariant } from "./split-variant.js";

export const getTailwindTokenGroup = (token: string): TailwindTokenGroup | null => {
  const { variant, baseToken } = splitVariant(token);
  const spacingGroup = getSpacingGroup(baseToken);
  if (spacingGroup) return { token, group: `${variant}${spacingGroup}` };
  const sizeGroup = getSizeGroup(baseToken);
  if (sizeGroup) return { token, group: `${variant}${sizeGroup}` };
  const overflowGroup = getOverflowGroup(baseToken);
  if (overflowGroup) return { token, group: `${variant}${overflowGroup}` };
  if (DISPLAY_TOKENS.has(baseToken)) return { token, group: `${variant}display` };
  if (POSITION_TOKENS.has(baseToken)) return { token, group: `${variant}position` };
  if (
    TEXT_SIZE_TOKENS.has(baseToken) ||
    /^text-\[\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)\]$/.test(baseToken)
  ) {
    return { token, group: `${variant}text-size` };
  }
  if (/^bg-gradient-/.test(baseToken)) return { token, group: `${variant}bg-gradient` };
  if (/^bg-(?:cover|contain|auto)$/.test(baseToken)) return { token, group: `${variant}bg-size` };
  if (
    /^bg-(?:center|top|right|bottom|left|left-top|left-bottom|right-top|right-bottom)$/.test(
      baseToken,
    )
  )
    return { token, group: `${variant}bg-position` };
  if (/^bg-(?:repeat|no-repeat|repeat-x|repeat-y|repeat-round|repeat-space)$/.test(baseToken))
    return { token, group: `${variant}bg-repeat` };
  if (/^bg-(?:fixed|local|scroll)$/.test(baseToken))
    return { token, group: `${variant}bg-attachment` };
  if (/^bg-clip-/.test(baseToken)) return { token, group: `${variant}bg-clip` };
  if (/^bg-origin-/.test(baseToken)) return { token, group: `${variant}bg-origin` };
  if (/^bg-(?!opacity-)/.test(baseToken)) return { token, group: `${variant}bg-color` };
  if (/^z-/.test(baseToken)) return { token, group: `${variant}z-index` };
  return null;
};
