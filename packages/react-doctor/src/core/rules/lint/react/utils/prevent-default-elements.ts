// HACK: word-boundary aware to avoid false positives like `discount` /
// `account` matching "count" or `strength` matching "length". The hint
// must be either the entire identifier OR appear at the end with a
// case/underscore boundary (`userCount`, `user_count`, `USER_COUNT`).

export const PREVENT_DEFAULT_ELEMENTS = new Map<string, string[]>([
  ["form", ["onSubmit"]],
  ["a", ["onClick"]],
]);
