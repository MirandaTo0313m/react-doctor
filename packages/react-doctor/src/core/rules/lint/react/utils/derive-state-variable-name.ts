// HACK: a useEffect cleanup return value MUST be a function (or
// undefined). Anything else is either user error or "I'm using
// `return` for early-exit, not for cleanup". For the chain detector,
// we treat only function-shaped returns as "this effect owns an
// external resource" - bare literals (`return null`, `return 0`) and
// state reads (`return foo`) get ignored so they don't silently
// disable chain detection.

export const deriveStateVariableName = (setterName: string): string | null => {
  if (!setterName.startsWith("set") || setterName.length < 4) return null;
  return setterName.charAt(3).toLowerCase() + setterName.slice(4);
};
