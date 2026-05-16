// Mirrors oxc's `is_react_hook_name`: a name is a hook iff it starts
// with `use` and the 4th character (if any) is uppercase or a digit.
// `use` alone is also a hook (the React 19 `use(...)` API).
export const isReactHookName = (name: string): boolean => {
  if (!name.startsWith("use")) return false;
  if (name.length === 3) return true;
  const fourthCharacter = name.charAt(3);
  return fourthCharacter === fourthCharacter.toUpperCase() && /[A-Z0-9]/.test(fourthCharacter);
};
