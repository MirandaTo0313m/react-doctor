import { NUMERIC_NAME_HINTS } from "./numeric-name-hints.js";

// HACK: <button> is intentionally omitted. <button type="submit"> (the
// HTML default inside a form) has a real default action, so calling
// preventDefault() on it is legitimate. The narrow case of
// <button type="button"> would need attribute inspection plus form-scope
// detection to be reliable; out of scope until we have evidence of real
// false-negatives.
// HACK: Map (not plain object) so a JSX tag named after an
// Object.prototype property (`<constructor>`, `<toString>`) doesn't
// fall through to a truthy `Object.prototype.X` value and crash on
// `targetEventProps.includes(...)` later in the rule body.

export const isNumericName = (name: string): boolean => {
  for (const hint of NUMERIC_NAME_HINTS) {
    if (name === hint) return true;
    const camelSuffix = hint.charAt(0).toUpperCase() + hint.slice(1);
    if (name.endsWith(camelSuffix)) return true;
    if (name.endsWith(`_${hint}`)) return true;
    if (name.endsWith(`_${hint.toUpperCase()}`)) return true;
  }
  return false;
};
