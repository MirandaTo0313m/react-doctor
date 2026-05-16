---
"react-doctor": minor
---

Demote `design`-tagged rules (Tailwind shorthand cleanup,
`design-no-redundant-size-axes`, `no-pure-black-background`, etc.)
from the surfaces that drive PR review attention so style cleanup
can no longer dilute meaningful React findings.

Diagnostics now flow through one of four surfaces — `cli`,
`prComment`, `score`, and `ciFailure` — and each can be tuned
independently. Defaults:

- `cli` — still shows everything (devs keep seeing design tips
  when they touch a file locally).
- `prComment` — drops `design`-tagged rules by default.
- `score` — drops `design`-tagged rules from the React Doctor
  score API payload so the headline number reflects React quality.
- `ciFailure` — drops `design`-tagged rules so they never fail a
  build under `--fail-on warning`.

Configure overrides per surface in `react-doctor.config.json`:

```json
{
  "surfaces": {
    "prComment": { "includeTags": ["design"] },
    "ciFailure": { "excludeCategories": ["Performance"] }
  }
}
```

Each surface accepts `includeTags`, `excludeTags`,
`includeCategories`, `excludeCategories`, `includeRules`, and
`excludeRules` (include wins over exclude).

New CLI flag: `--pr-comment` tunes the output for sticky PR
comments. The GitHub Action sets it automatically when
`github-token` is provided. Tailwind version gating is unchanged
(`design-no-redundant-size-axes` still requires Tailwind 3.4+).
