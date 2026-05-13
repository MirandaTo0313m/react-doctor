---
"react-doctor": patch
---

Fixes carried out alongside the v2 rewrite:

- **Restore the v1 error-class surface on `react-doctor/api`.** The compat
  module now re-exports `AmbiguousProjectError`, `NoReactDependencyError`,
  `PackageJsonNotFoundError`, `ProjectNotFoundError`, `ReactDoctorError`, and
  `isReactDoctorError` so existing v1 consumers (sandbox runners,
  third-party diagnose wrappers) keep importing the same names.
- **Fix oxlint category routing.** The runner had a stale duplicate
  `RULE_CATEGORY_MAP` that covered only ~half the v2 rules; the other half
  (`tailwind-*`, `client-*`, `effect-*`, `nextjs-*`, `tanstack-*`, `rn-*`,
  many `no-*`, …) silently fell through to the `Other` category. Switched
  the runner to the comprehensive `resolveOxlintDiagnosticCategory()` that
  already existed in `core/rules/lint/utils`, deleted the duplicated map,
  and added a registry test that asserts every rule resolves to a real
  category (never `Other`). Category breakdowns now look meaningful:
  Performance/Architecture/Accessibility/State & Effects/etc. instead of a
  giant `Other` bucket.
Scoring calibration note: v2's local score function is more expressive
than v1's (`100 - errorRules*1.5 - warningRules*0.75`) — per-category
caps and log-scaled per-rule amplification mean high-instance rules cost
more and many small categories cost more than v1's flat per-unique-rule
penalty. The same project will score lower under v2 than v1 even when v2
finds fewer total issues. The remote `react.doctor` score endpoint
should be updated to use this package's `react-doctor/score` export so
server and local results match; until then, the remote API will reject
the v2 payload shape and clients will silently fall back to local v2
scoring.
