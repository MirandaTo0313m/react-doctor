// HACK: SVG path strings with 4+ decimals (e.g. `M 10.293847 20.847362`)
// add bytes for sub-pixel precision the user can't see. Most editors
// emit these by default; truncating to 1-2 decimals trims 30-50% off
// markup with no visible difference.

export const SVG_PATH_HIGH_PRECISION_PATTERN = /\d+\.\d{4,}/;
