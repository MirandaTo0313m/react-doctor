import { REACT_19_DEPRECATION_MIN_MAJOR } from "../constants.js";

// HACK: detects whether a `react` peer-dependency range advertises
// support for any React major below 19. Used to special-case
// libraries: when a package declares `react` in `peerDependencies`
// and the range admits React 16/17/18, the library MUST keep using
// `forwardRef`, `defaultProps`, and the legacy `react-dom` root API
// to honor that peer contract — so the React-19 deprecation rules
// become noise.
//
// We split the raw range on the boolean operators semver allows
// between comparators (`||`, `,`, whitespace) and treat each
// comparator as a "vote": it admits legacy React if it's a pure
// wildcard (`*` / `x.x.x`) OR its first integer is a major in
// [1, 19). One vote is enough to flip the whole range to "supports
// legacy" — accepting some semantic looseness vs. AND-comparator
// shapes (`* >=19` would falsely trigger) in exchange for a tiny
// parser, since real-world peer ranges almost never combine
// wildcards with concrete bounds.
//
// Reading only the FIRST integer per comparator avoids two classes of
// false positive: trailing minor/patch digits (`^19.0.0` would
// otherwise look legacy because of the `0` patch) and hex digits
// embedded in canary tags (`0.0.0-canary-1a2b3c4d`). The `0.x` major
// is ignored on purpose so `0.0.0-experimental-*` doesn't masquerade
// as "supports legacy".
const COMPARATOR_SEPARATOR = /[\s,|]+/;
const WILDCARD_COMPARATOR = /^[*xX](?:\.[*xX])*$/;

const comparatorAdmitsLegacyReact = (comparator: string): boolean => {
  if (WILDCARD_COMPARATOR.test(comparator)) return true;
  const firstIntegerMatch = comparator.match(/\d+/);
  if (!firstIntegerMatch) return false;
  const major = Number.parseInt(firstIntegerMatch[0], 10);
  return major >= 1 && major < REACT_19_DEPRECATION_MIN_MAJOR;
};

export const peerRangeSupportsLegacyReact = (range: string | null | undefined): boolean => {
  if (typeof range !== "string") return false;
  return range.trim().split(COMPARATOR_SEPARATOR).filter(Boolean).some(comparatorAdmitsLegacyReact);
};

const extractComparatorMajor = (comparator: string): number | null => {
  if (WILDCARD_COMPARATOR.test(comparator)) return null;
  const firstIntegerMatch = comparator.match(/\d+/);
  if (!firstIntegerMatch) return null;
  const major = Number.parseInt(firstIntegerMatch[0], 10);
  return major >= 1 ? major : null;
};

export const peerRangeMinMajor = (range: string | null | undefined): number | null => {
  if (typeof range !== "string") return null;
  let lowestMajor: number | null = null;
  for (const comparator of range.trim().split(COMPARATOR_SEPARATOR).filter(Boolean)) {
    const major = extractComparatorMajor(comparator);
    if (major !== null && (lowestMajor === null || major < lowestMajor)) {
      lowestMajor = major;
    }
  }
  return lowestMajor;
};
