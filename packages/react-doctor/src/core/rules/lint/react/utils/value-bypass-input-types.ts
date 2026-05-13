// HACK: <input type="checkbox"> / "radio" use the `checked` prop to be
// controlled; `value` is just the form-submission token. <input
// type="hidden"> never needs onChange - React's runtime warning skips
// it for the same reason. Limiting our `value`-needs-onChange check to
// non-hidden, non-checkable inputs keeps us aligned with React's own
// rules.

export const VALUE_BYPASS_INPUT_TYPES = new Set(["hidden", "checkbox", "radio"]);
