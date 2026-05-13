import { TAILWIND_DEFAULT_PALETTE_NAMES } from "../../constants.js";
import { TAILWIND_DEFAULT_PALETTE_STOPS } from "../../constants.js";
import { TAILWIND_PALETTE_UTILITY_PREFIXES } from "../../constants.js";

export const buildDefaultPaletteRegex = (): RegExp => {
  const utilityPrefixGroup = TAILWIND_PALETTE_UTILITY_PREFIXES.join("|");
  const paletteNameGroup = TAILWIND_DEFAULT_PALETTE_NAMES.join("|");
  // HACK: anchor the numeric group to the actual Tailwind palette stops
  // rather than `\d{2,3}`. Custom Tailwind themes that re-purpose the
  // utility prefix for a non-Tailwind scale (e.g. Radix Colors uses
  // `gray.1` … `gray.12`) would otherwise false-positive on `text-gray-11`,
  // `fill-gray-12`, etc. - those aren't the Tailwind template default.
  const paletteStopGroup = TAILWIND_DEFAULT_PALETTE_STOPS.join("|");
  // HACK: /g so we can iterate every default-palette token in one
  // className. Without /g the user fixes one token, re-runs, sees the
  // next, fixes that, re-runs… N round-trips for N tokens in a single
  // attribute.
  return new RegExp(
    `(?:^|\\s|:)(${utilityPrefixGroup})-(${paletteNameGroup})-(${paletteStopGroup})(?=$|[\\s:/])`,
    "g",
  );
};
