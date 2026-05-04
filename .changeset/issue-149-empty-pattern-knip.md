---
"react-doctor": patch
---

fix(react-doctor): strip empty pattern strings from knip config so dead-code analysis no longer aborts with `Expected pattern to be a non-empty string` (#149)

`knip` funnels every entry, project, ignore, and plugin pattern through
`picomatch`, which throws `Expected pattern to be a non-empty string` if
any value is `""` or whitespace-only. Empty patterns can sneak in via
`tsconfig.json` `include`, plugin shorthand resolution, or hand-written
`knip.json` entries — knocking out the entire dead-code step with the
single-line "Dead code detection failed (non-fatal, skipping)" message.

`runKnip` now walks the parsed knip config (top-level keys, nested
plugin objects, and per-workspace overrides) and removes empty /
whitespace-only string patterns — both as scalars and as entries inside
arrays — before invoking knip's `main`. Non-string entries (regexes,
booleans, numbers) and intentionally-empty arrays are preserved.
