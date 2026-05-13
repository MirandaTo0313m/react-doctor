# React Doctor v1↔v2 Parity Report

Generated: 2026-05-13T05:49:06.507Z. CLI flags: `--json --json-compact --no-dead-code --offline`.

v2 issues are filtered to v1's lint rule-ID surface (extracted from `packages/react-doctor/src/oxlint-config.ts`); knip dead-code rules are excluded on both sides.

| Fixture | v1 raw | v1 filt | v2 raw | v2 filt | Δ | v1 time | v2 time | Slowdown | Missing in v2 | Extra in v2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| RhysSullivan/executor | 77 | 66 | 41 | 67 | +1 | 2.5s | 1.2s | 0.48× | 7 | 2 |
| nodejs/nodejs.org | 80 | 74 | 52 | 75 | +1 | 2.9s | 2.7s | 0.93× | 10 | 4 |
| tldraw/tldraw | 67 | 34 | 0 | 35 | +1 | 16.8s | 2.4s | 0.14× | 104 | 1 |
| pingdotgg/t3code | 55 | 55 | 0 | 56 | +1 | 14.5s | 15.1s | 1.04× | 24 | 0 |
| better-auth/better-auth | 65 | 61 | 0 | 63 | +2 | 1.9s | 1.1s | 0.59× | 154 | 1 |
| excalidraw/excalidraw | 62 | 57 | 0 | 56 | -1 | 2.0s | 1.9s | 0.96× | 126 | 425 |
| mastra-ai/mastra | 52 | 41 | 0 | 39 | -2 | 3.9s | 11.0s | 2.79× | 92 | 4391 |
| payloadcms/payload | 31 | 15 | 0 | 17 | +2 | 35.2s | 15.6s | 0.44× | 2185 | 20 |
| baptisteArno/typebot.io | 54 | 48 | 0 | 48 | 0 | 4.4s | 2.9s | 0.66× | 22 | 0 |
| makeplane/plane | 55 | 42 | 0 | 44 | +2 | 8.3s | 3.6s | 0.43× | 40 | 808 |
| medusajs/medusa | 50 | 43 | 0 | 44 | +1 | 7.9s | 8.3s | 1.06× | 295 | 29 |
| RocketChat/Rocket.Chat | 47 | 35 | 0 | 36 | +1 | 9.7s | 7.1s | 0.73× | 775 | 0 |
| twentyhq/twenty | 44 | 24 | 0 | 25 | +1 | 18.8s | 10.1s | 0.54× | 429 | 43 |
| unkeyed/unkey | 43 | 38 | 0 | 39 | +1 | 4.5s | 3.8s | 0.83× | 27 | 0 |
| shadcn-ui/ui | 44 | 45 | 0 | 45 | 0 | 4.8s | 6.2s | 1.30× | 148 | 1956 |
| triggerdotdev/trigger.dev | 42 | 30 | 0 | 31 | +1 | 4.5s | 3.6s | 0.80× | 142 | 9 |
| formbricks/formbricks | 38 | 35 | 0 | 36 | +1 | 6.1s | 5.2s | 0.86× | 157 | 635 |
| langfuse/langfuse | 34 | 32 | 0 | 33 | +1 | 4.5s | 5.0s | 1.10× | 478 | 2 |
| ToolJet/ToolJet | 28 | 30 | 0 | 30 | 0 | 16.8s | 10.8s | 0.65× | 125 | 0 |
| onlook-dev/onlook | 30 | 27 | 0 | 29 | +2 | 5.3s | 5.5s | 1.03× | 59 | 0 |
| calcom/cal.com | 27 | 18 | 0 | 19 | +1 | 11.6s | 5.7s | 0.49× | 587 | 117 |
| PostHog/posthog | 31 | 25 | 0 | 30 | +5 | 25.5s | 10.3s | 0.40× | 433 | 19 |
| appsmithorg/appsmith | 9 | 12 | 0 | 13 | +1 | 30.6s | 29.5s | 0.96× | 222 | 8 |
| getsentry/sentry | 24 | 24 | 0 | 26 | +2 | 8.1s | 11.3s | 1.40× | 301 | 0 |
| lobehub/lobe-chat | 25 | 27 | 0 | 28 | +1 | 23.8s | 13.0s | 0.55× | 1802 | 5 |
| dubinc/dub | 23 | 24 | 0 | 25 | +1 | 5.5s | 5.2s | 0.95× | 60 | 0 |
| TanStack/query | 54 | 50 | 0 | 52 | +2 | 11.2s | 3.4s | 0.30× | 110 | 29 |
| pmndrs/react-three-fiber | 81 | 80 | 46 | 79 | -1 | 2.5s | 1.6s | 0.63× | 18 | 8 |
| react-hook-form/react-hook-form | 75 | 75 | 21 | 76 | +1 | 1.3s | 1.1s | 0.82× | 2 | 0 |
| framer/motion | 50 | 49 | 0 | 51 | +2 | 21.9s | 9.0s | 0.41× | 9 | 2 |
| expo/expo | 55 | 14 | 0 | 15 | +1 | 41.0s | 53.4s | 1.30× | 373 | 412 |
| vercel/next.js | 0 | 0 | 0 | 0 | 0 | 126.0s | 81.0s | 0.64× | 3312 | 50 |
| facebook/react | 54 | 47 | 100 | 100 | +53 | 11.6s | 1.6s | 0.14× | 3273 | 0 |
| bluesky-social/social-app | 22 | 22 | 0 | 23 | +1 | 43.7s | 44.2s | 1.01× | 35 | 0 |
| outline/outline | 45 | 55 | 0 | 56 | +1 | 3.5s | 4.0s | 1.14× | 672 | 0 |
| trpc/trpc | 74 | 60 | 0 | 58 | -2 | 7.1s | 2.3s | 0.33× | 46 | 354 |
| radix-ui/primitives | 72 | 72 | 2 | 72 | 0 | 3.2s | 2.5s | 0.78× | 2 | 0 |
| documenso/documenso | 45 | 45 | 0 | 46 | +1 | 8.1s | 5.1s | 0.63× | 367 | 798 |
| invoke-ai/InvokeAI | — | — | — | — | error | — | — | — | skipped / node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/aidenybai/Developer/react-doctor/packages/react-doctor-v | |
| refinedev/refine | 75 | 21 | 0 | 18 | -3 | 88.6s | 15.4s | 0.17× | 675 | 3050 |
| vercel/ai | 53 | 52 | 0 | 54 | +2 | 11.4s | 6.5s | 0.57× | 294 | 86 |
| vercel/commerce | 81 | 81 | 47 | 81 | 0 | 702ms | 559ms | 0.80× | 0 | 0 |
| cloudflare/next-on-pages | — | — | — | — | error | — | — | — | No React dependency found in /Users/aidenybai/dev/react-doctor-parity-testing/cloudflare__next-on-pages/packages/next-on-pages/package.json. Add "react" to dependencies (or peerDependencies) and re-run. | |
| t3-oss/create-t3-app | 90 | 88 | 80 | 89 | +1 | 1.0s | 654ms | 0.63× | 6 | 4 |
| steven-tey/novel | 91 | 90 | 76 | 90 | 0 | 1.0s | 561ms | 0.55× | 0 | 0 |
| vercel/swr | 77 | 78 | 36 | 80 | +2 | 1.3s | 1.5s | 1.09× | 13 | 75 |
| pmndrs/zustand | 93 | 93 | 83 | 93 | 0 | 1.7s | 708ms | 0.42× | 0 | 14 |
| tannerlinsley/react-ranger | 100 | 100 | 100 | 100 | 0 | 569ms | 433ms | 0.76× | 0 | 0 |
| jaredpalmer/formik | 78 | 76 | 44 | 78 | +2 | 2.8s | 1.8s | 0.67× | 9 | 0 |
| remix-run/react-router | 69 | 66 | 0 | 58 | -8 | 9.3s | 3.6s | 0.38× | 232 | 791 |
| withastro/astro | 96 | 90 | 21 | 81 | -9 | 17.5s | 4.2s | 0.24× | 135 | 634 |
| vitejs/vite | 96 | 94 | 39 | 85 | -9 | 1.2s | 2.2s | 1.90× | 2 | 311 |
| preactjs/preact | — | — | — | — | error | — | — | — | No React dependency found in /Users/aidenybai/dev/react-doctor-parity-testing/preactjs__preact/package.json. Add "react" to dependencies (or peerDependencies) and re-run. | |
| solidjs/solid-start | — | — | — | — | error | — | — | — | No React dependency found in /Users/aidenybai/dev/react-doctor-parity-testing/solidjs__solid-start/package.json. Add "react" to dependencies (or peerDependencies) and re-run. | |
| umami-software/umami | 45 | 45 | 0 | 45 | 0 | 11.0s | 11.8s | 1.07× | 4 | 0 |
| calcom/cal.com | 27 | 18 | 0 | 19 | +1 | 17.3s | 6.0s | 0.35× | 587 | 117 |
| nrwl/nx | 42 | 43 | 0 | 44 | +1 | 7.4s | 13.9s | 1.88× | 84 | 40 |
| novuhq/novu | 33 | 26 | 0 | 27 | +1 | 8.3s | 4.8s | 0.57× | 72 | 0 |
| highlight/highlight | 43 | 26 | 0 | 27 | +1 | 7.8s | 4.0s | 0.51× | 25 | 17 |
| n8n-io/n8n | — | — | — | — | error | — | — | — | No React dependency found in /Users/aidenybai/dev/react-doctor-parity-testing/n8n-io__n8n/package.json. Add "react" to dependencies (or peerDependencies) and re-run. | |
| immich-app/immich | 90 | 87 | 54 | 83 | -4 | 6.4s | 6.8s | 1.07× | 150 | 152 |
| grafana/grafana | 31 | 33 | 0 | 33 | 0 | 18.3s | 18.3s | 1.00× | 543 | 9 |
| pierrecomputer/pierre/packages/trees | 78 | 78 | 42 | 78 | 0 | 1.3s | 950ms | 0.73× | 115 | 0 |
| pierrecomputer/pierre/packages/diffs | 93 | 93 | 82 | 94 | +1 | 1.2s | 935ms | 0.76× | 8 | 0 |
| frontend | — | — | — | — | error | — | — | — | skipped | |
| cheffect | — | — | — | — | error | — | — | — | skipped | |
| bunnings-lite | — | — | — | — | error | — | — | — | skipped | |

**Score divergence from v1** (Δ = v2 filtered − v1 filtered, across 59 fixtures):

| Bucket | Count |
|---|---:|
| Δ = 0 (exact match) | 12 |
| \|Δ\| ≤ 1 | 40 |
| \|Δ\| ≤ 2 | 52 |
| \|Δ\| ≤ 5 | 55 |
| \|Δ\| > 5 | 4 |
| max \|Δ\| | 53 |
| mean \|Δ\| | 2.42 |
| errored | 8 |

**Wall-clock slowdown** (v2 / v1, across 59 fixtures; both CLIs spawned in parallel so the ratio reflects relative cost under shared load, not absolute):

| Bucket | Count |
|---|---:|
| ≤ 1.0× (v2 ≤ v1) | 44 |
| ≤ 1.5× | 56 |
| ≤ 2.0× | 58 |
| ≤ 3.0× | 59 |
| > 3.0× | 0 |
| median | 0.73× |
| mean | 0.79× |
| max | 2.79× |

Top 5 slowest fixtures (by v2/v1 ratio):

- mastra-ai/mastra: 3.9s → 11.0s (2.79×)
- vitejs/vite: 1.2s → 2.2s (1.90×)
- nrwl/nx: 7.4s → 13.9s (1.88×)
- getsentry/sentry: 8.1s → 11.3s (1.40×)
- shadcn-ui/ui: 4.8s → 6.2s (1.30×)

## Per-fixture rule deltas

### RhysSullivan/executor

- v1 filtered score: **66** vs v2 filtered: **67**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-sequential-independent-await`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 4
  - `react-doctor/design-no-three-period-ellipsis` × 1
  - `react-doctor/async-await-in-loop` × 1
  - `react-doctor/js-combine-iterations` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-await-in-loop` × 2

### nodejs/nodejs.org

- v1 filtered score: **74** vs v2 filtered: **75**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/nextjs-no-a-element`
  - `react-doctor/no-barrel-import`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/no-secrets-in-client-code`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 3
  - `react-doctor/nextjs-no-a-element` × 3
  - `react-doctor/no-barrel-import` × 2
  - `react-doctor/no-render-in-render` × 1
  - `react-doctor/async-await-in-loop` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-await-in-loop` × 2
  - `react-doctor/no-secrets-in-client-code` × 1
  - `react-doctor/js-combine-iterations` × 1

### tldraw/tldraw

- v1 filtered score: **34** vs v2 filtered: **35**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/no-barrel-import`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/no-secrets-in-client-code`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 36
  - `react-doctor/async-await-in-loop` × 23
  - `react-doctor/js-combine-iterations` × 17
  - `react-doctor/server-sequential-independent-await` × 14
  - `react-doctor/design-no-three-period-ellipsis` × 6
  - `react-doctor/js-batch-dom-css` × 4
  - `react-doctor/js-length-check-first` × 3
  - `react-doctor/no-barrel-import` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/no-secrets-in-client-code` × 1

### pingdotgg/t3code

- v1 filtered score: **55** vs v2 filtered: **56**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-render-in-render` × 14
  - `react-doctor/design-no-three-period-ellipsis` × 4
  - `react-doctor/async-await-in-loop` × 3
  - `react-doctor/js-combine-iterations` × 3

### better-auth/better-auth

- v1 filtered score: **61** vs v2 filtered: **63**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/no-inline-exhaustive-style`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 98
  - `react-doctor/async-await-in-loop` × 32
  - `react-doctor/no-barrel-import` × 9
  - `react-doctor/js-combine-iterations` × 5
  - `react-doctor/design-no-three-period-ellipsis` × 5
  - `react-doctor/server-fetch-without-revalidate` × 3
  - `react-doctor/no-inline-exhaustive-style` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-combine-iterations` × 1

### excalidraw/excalidraw

- v1 filtered score: **57** vs v2 filtered: **56**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/js-length-check-first`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/js-min-max-loop`
  - `react-doctor/prefer-use-effect-event`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-render-in-render` × 73
  - `react-doctor/no-barrel-import` × 39
  - `react-doctor/js-combine-iterations` × 11
  - `react-doctor/server-sequential-independent-await` × 2
  - `react-doctor/js-length-check-first` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `effect/no-event-handler` × 77
  - `react-doctor/js-combine-iterations` × 56
  - `react-doctor/js-batch-dom-css` × 23
  - `react-doctor/no-react19-deprecated-apis` × 18
  - `react-doctor/js-set-map-lookups` × 17
  - `effect/no-derived-state` × 17
  - `react-doctor/rendering-svg-precision` × 17
  - `jsx-a11y/no-static-element-interactions` × 15
  - `jsx-a11y/click-events-have-key-events` × 14
  - `react-doctor/no-array-index-as-key` × 14
  - `react-doctor/no-render-in-render` × 11
  - `jsx-a11y/no-autofocus` × 11
  - `react-doctor/no-giant-component` × 10
  - `react-doctor/no-cascading-set-state` × 10
  - `react-doctor/rerender-functional-setstate` × 7
  - `effect/no-adjust-state-on-prop-change` × 7
  - `react-doctor/no-dynamic-import-path` × 6
  - `react-doctor/async-await-in-loop` × 6
  - `react-doctor/no-derived-useState` × 6
  - `react-doctor/no-inline-exhaustive-style` × 5

### mastra-ai/mastra

- v1 filtered score: **41** vs v2 filtered: **39**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/js-length-check-first`
  - `react-doctor/js-min-max-loop`
  - `react-doctor/no-secrets-in-client-code`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 57
  - `react-doctor/no-render-in-render` × 10
  - `react-doctor/js-combine-iterations` × 10
  - `react-doctor/async-await-in-loop` × 7
  - `react-doctor/no-barrel-import` × 3
  - `react-doctor/server-sequential-independent-await` × 3
  - `react-doctor/async-parallel` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-await-in-loop` × 730
  - `react-doctor/async-parallel` × 432
  - `react-doctor/design-no-redundant-size-axes` × 424
  - `react-doctor/js-combine-iterations` × 394
  - `effect/no-event-handler` × 366
  - `react-doctor/js-set-map-lookups` × 225
  - `react-doctor/server-sequential-independent-await` × 182
  - `react-doctor/no-react19-deprecated-apis` × 149
  - `react-doctor/rendering-svg-precision` × 146
  - `react-doctor/no-barrel-import` × 122
  - `react-doctor/js-flatmap-filter` × 101
  - `react-doctor/js-index-maps` × 94
  - `react-doctor/js-tosorted-immutable` × 82
  - `react-doctor/js-cache-property-access` × 76
  - `effect/no-derived-state` × 70
  - `react-doctor/rendering-hydration-mismatch-time` × 61
  - `effect/no-adjust-state-on-prop-change` × 58
  - `react-doctor/no-array-index-as-key` × 58
  - `react-doctor/no-effect-event-handler` × 43
  - `react-doctor/prefer-useReducer` × 34

### payloadcms/payload

- v1 filtered score: **15** vs v2 filtered: **17**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/js-length-check-first`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 874
  - `react-doctor/async-await-in-loop` × 547
  - `react-doctor/no-barrel-import` × 476
  - `react-doctor/async-parallel` × 188
  - `react-doctor/js-combine-iterations` × 38
  - `react-doctor/no-tiny-text` × 31
  - `react-doctor/design-no-three-period-ellipsis` × 12
  - `react-doctor/no-inline-exhaustive-style` × 6
  - `react-doctor/js-length-check-first` × 6
  - `react-doctor/nextjs-no-img-element` × 4
  - `react-doctor/no-outline-none` × 2
  - `react-doctor/nextjs-no-a-element` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 17
  - `react-doctor/js-set-map-lookups` × 1
  - `react-doctor/js-combine-iterations` × 1
  - `react-doctor/no-barrel-import` × 1

### baptisteArno/typebot.io

- v1 filtered score: **48** vs v2 filtered: **48**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 17
  - `react-doctor/js-combine-iterations` × 4
  - `react-doctor/async-await-in-loop` × 1

### makeplane/plane

- v1 filtered score: **42** vs v2 filtered: **44**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-sequential-independent-await`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-render-in-render` × 14
  - `react-doctor/js-combine-iterations` × 12
  - `react-doctor/design-no-three-period-ellipsis` × 8
  - `react-doctor/server-sequential-independent-await` × 4
  - `react-doctor/no-barrel-import` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 808

### medusajs/medusa

- v1 filtered score: **43** vs v2 filtered: **44**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 236
  - `react-doctor/js-combine-iterations` × 30
  - `react-doctor/async-parallel` × 11
  - `react-doctor/async-await-in-loop` × 10
  - `react-doctor/design-no-three-period-ellipsis` × 5
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/no-barrel-import` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-combine-iterations` × 9
  - `react-doctor/server-sequential-independent-await` × 7
  - `react-doctor/js-flatmap-filter` × 5
  - `react-doctor/async-parallel` × 4
  - `react-doctor/async-await-in-loop` × 2
  - `react-doctor/no-barrel-import` × 2

### RocketChat/Rocket.Chat

- v1 filtered score: **35** vs v2 filtered: **36**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/js-length-check-first`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 574
  - `react-doctor/server-sequential-independent-await` × 115
  - `react-doctor/async-await-in-loop` × 48
  - `react-doctor/js-combine-iterations` × 19
  - `react-doctor/no-render-in-render` × 13
  - `react-doctor/design-no-three-period-ellipsis` × 3
  - `react-doctor/no-barrel-import` × 2
  - `react-doctor/js-length-check-first` × 1

### twentyhq/twenty

- v1 filtered score: **24** vs v2 filtered: **25**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/js-length-check-first`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 164
  - `react-doctor/async-parallel` × 111
  - `react-doctor/server-sequential-independent-await` × 74
  - `react-doctor/async-await-in-loop` × 67
  - `react-doctor/design-no-three-period-ellipsis` × 9
  - `react-doctor/no-render-in-render` × 3
  - `react-doctor/js-length-check-first` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-combine-iterations` × 16
  - `react-doctor/async-await-in-loop` × 8
  - `react-doctor/async-parallel` × 7
  - `react-doctor/server-sequential-independent-await` × 2
  - `react-doctor/no-dynamic-import-path` × 2
  - `react-doctor/js-tosorted-immutable` × 2
  - `react-doctor/no-full-lodash-import` × 1
  - `react-doctor/js-set-map-lookups` × 1
  - `react-doctor/async-defer-await` × 1
  - `react-doctor/js-index-maps` × 1
  - `react-doctor/js-cache-property-access` × 1
  - `react-doctor/no-secrets-in-client-code` × 1

### unkeyed/unkey

- v1 filtered score: **38** vs v2 filtered: **39**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 21
  - `react-doctor/js-combine-iterations` × 3
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/server-fetch-without-revalidate` × 1

### shadcn-ui/ui

- v1 filtered score: **45** vs v2 filtered: **45**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/async-parallel`
  - `react-doctor/js-cache-property-access`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 146
  - `react-doctor/js-combine-iterations` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `jsx-a11y/anchor-is-valid` × 309
  - `react-doctor/design-no-redundant-size-axes` × 195
  - `react-doctor/prefer-dynamic-import` × 168
  - `effect/no-event-handler` × 123
  - `react-doctor/no-array-index-as-key` × 123
  - `react-doctor/no-react19-deprecated-apis` × 107
  - `react-doctor/js-combine-iterations` × 97
  - `react-doctor/rendering-hydration-mismatch-time` × 79
  - `react-doctor/design-no-vague-button-label` × 60
  - `react-doctor/rerender-memo-before-early-return` × 38
  - `react/no-danger` × 36
  - `react-doctor/design-no-space-on-flex-children` × 35
  - `react-doctor/js-set-map-lookups` × 35
  - `react-doctor/async-await-in-loop` × 34
  - `react-doctor/rerender-functional-setstate` × 34
  - `react-doctor/js-index-maps` × 32
  - `react-doctor/no-derived-useState` × 29
  - `react-doctor/design-no-bold-heading` × 26
  - `react-doctor/rendering-svg-precision` × 24
  - `effect/no-pass-data-to-parent` × 21

### triggerdotdev/trigger.dev

- v1 filtered score: **30** vs v2 filtered: **31**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 69
  - `react-doctor/async-await-in-loop` × 43
  - `react-doctor/design-no-three-period-ellipsis` × 22
  - `react-doctor/js-combine-iterations` × 4
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/server-fetch-without-revalidate` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/server-sequential-independent-await` × 6
  - `react-doctor/async-await-in-loop` × 1
  - `react-doctor/async-parallel` × 1
  - `react-doctor/js-combine-iterations` × 1

### formbricks/formbricks

- v1 filtered score: **35** vs v2 filtered: **36**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/js-length-check-first`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 54
  - `react-doctor/async-await-in-loop` × 28
  - `react-doctor/no-render-in-render` × 22
  - `react-doctor/js-combine-iterations` × 14
  - `react-doctor/nextjs-missing-metadata` × 12
  - `react-doctor/no-inline-exhaustive-style` × 10
  - `react-doctor/server-fetch-without-revalidate` × 8
  - `react-doctor/no-barrel-import` × 7
  - `react-doctor/js-length-check-first` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `effect/no-event-handler` × 393
  - `react-doctor/async-await-in-loop` × 41
  - `effect/no-pass-data-to-parent` × 18
  - `effect/no-derived-state` × 18
  - `react-doctor/js-combine-iterations` × 16
  - `react-doctor/rerender-lazy-state-init` × 15
  - `react-doctor/no-generic-handler-names` × 13
  - `react-doctor/rendering-svg-precision` × 10
  - `react-doctor/no-effect-event-handler` × 7
  - `react-doctor/js-set-map-lookups` × 6
  - `react-doctor/rerender-state-only-in-handlers` × 6
  - `react-doctor/design-no-redundant-size-axes` × 6
  - `react-doctor/no-cascading-set-state` × 6
  - `react-doctor/design-no-space-on-flex-children` × 6
  - `react-doctor/design-no-default-tailwind-palette` × 5
  - `react-doctor/server-sequential-independent-await` × 4
  - `react-doctor/js-tosorted-immutable` × 4
  - `react-doctor/client-passive-event-listeners` × 4
  - `react-doctor/no-giant-component` × 4
  - `react-doctor/effect-needs-cleanup` × 3

### langfuse/langfuse

- v1 filtered score: **32** vs v2 filtered: **33**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 253
  - `react-doctor/server-sequential-independent-await` × 108
  - `react-doctor/design-no-three-period-ellipsis` × 64
  - `react-doctor/async-await-in-loop` × 31
  - `react-doctor/js-combine-iterations` × 15
  - `react-doctor/js-length-check-first` × 5
  - `react-doctor/no-render-in-render` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-flatmap-filter` × 2

### ToolJet/ToolJet

- v1 filtered score: **30** vs v2 filtered: **30**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-render-in-render` × 98
  - `react-doctor/design-no-three-period-ellipsis` × 16
  - `react-doctor/js-combine-iterations` × 11

### onlook-dev/onlook

- v1 filtered score: **27** vs v2 filtered: **29**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/js-length-check-first`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 32
  - `react-doctor/js-combine-iterations` × 10
  - `react-doctor/nextjs-missing-metadata` × 5
  - `react-doctor/async-await-in-loop` × 4
  - `react-doctor/no-render-in-render` × 3
  - `react-doctor/no-barrel-import` × 3
  - `react-doctor/server-fetch-without-revalidate` × 1
  - `react-doctor/js-length-check-first` × 1

### calcom/cal.com

- v1 filtered score: **18** vs v2 filtered: **19**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 425
  - `react-doctor/server-sequential-independent-await` × 52
  - `react-doctor/async-await-in-loop` × 43
  - `react-doctor/nextjs-no-img-element` × 28
  - `react-doctor/design-no-three-period-ellipsis` × 13
  - `react-doctor/js-combine-iterations` × 9
  - `react-doctor/server-fetch-without-revalidate` × 6
  - `react-doctor/nextjs-no-use-search-params-without-suspense` × 6
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/js-length-check-first` × 1
  - `react-doctor/nextjs-missing-metadata` × 1
  - `react-doctor/nextjs-no-native-script` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 94
  - `react-doctor/js-batch-dom-css` × 11
  - `react-doctor/async-parallel` × 4
  - `react-doctor/js-set-map-lookups` × 2
  - `effect/no-initialize-state` × 2
  - `effect/no-pass-data-to-parent` × 1
  - `effect/no-derived-state` × 1
  - `react-doctor/rendering-hydration-no-flicker` × 1
  - `react-doctor/server-sequential-independent-await` × 1

### PostHog/posthog

- v1 filtered score: **25** vs v2 filtered: **30**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/nextjs-missing-metadata`
  - `react-doctor/nextjs-no-client-side-redirect`
  - `react-doctor/nextjs-no-img-element`
  - `react-doctor/no-barrel-import`
  - `react-doctor/react-compiler-destructure-method`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 139
  - `react-doctor/js-combine-iterations` × 79
  - `react-doctor/no-render-in-render` × 50
  - `react-doctor/async-await-in-loop` × 43
  - `react-doctor/design-no-bold-heading` × 26
  - `react-doctor/no-barrel-import` × 15
  - `react-doctor/design-no-default-tailwind-palette` × 14
  - `react-doctor/design-no-space-on-flex-children` × 13
  - `jsx-a11y/label-has-associated-control` × 8
  - `react-doctor/rendering-hydration-mismatch-time` × 8
  - `react-doctor/nextjs-missing-metadata` × 7
  - `react-doctor/server-sequential-independent-await` × 6
  - `react-doctor/nextjs-no-client-side-redirect` × 3
  - `react-doctor/nextjs-no-img-element` × 3
  - `react-doctor/react-compiler-destructure-method` × 3
  - `jsx-a11y/click-events-have-key-events` × 2
  - `react-doctor/no-effect-event-handler` × 2
  - `react-doctor/no-giant-component` × 2
  - `effect/no-initialize-state` × 2
  - `react-doctor/client-localstorage-no-version` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-set-map-lookups` × 6
  - `react-doctor/js-tosorted-immutable` × 3
  - `react-doctor/async-await-in-loop` × 3
  - `react-doctor/js-combine-iterations` × 2
  - `react-doctor/js-flatmap-filter` × 1
  - `react-doctor/js-index-maps` × 1
  - `react-doctor/async-defer-await` × 1
  - `react-doctor/async-parallel` × 1
  - `react-doctor/design-no-redundant-size-axes` × 1

### appsmithorg/appsmith

- v1 filtered score: **12** vs v2 filtered: **13**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 87
  - `react-doctor/no-render-in-render` × 80
  - `react-doctor/no-barrel-import` × 33
  - `react-doctor/server-sequential-independent-await` × 9
  - `react-doctor/async-parallel` × 6
  - `react-doctor/design-no-three-period-ellipsis` × 5
  - `react-doctor/async-await-in-loop` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-hooks-js/refs` × 2
  - `react-doctor/js-index-maps` × 1
  - `react-hooks-js/use-memo` × 1
  - `react-doctor/no-full-lodash-import` × 1
  - `react-doctor/no-mutable-in-deps` × 1
  - `effect/no-event-handler` × 1
  - `react-doctor/advanced-event-handler-refs` × 1

### getsentry/sentry

- v1 filtered score: **24** vs v2 filtered: **26**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/js-length-check-first`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 93
  - `react-doctor/no-render-in-render` × 81
  - `react-doctor/async-await-in-loop` × 56
  - `react-doctor/server-sequential-independent-await` × 24
  - `react-doctor/no-barrel-import` × 22
  - `react-doctor/js-length-check-first` × 21
  - `react-doctor/async-parallel` × 2
  - `react-doctor/design-no-three-period-ellipsis` × 2

### lobehub/lobe-chat

- v1 filtered score: **27** vs v2 filtered: **28**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 844
  - `react-doctor/no-barrel-import` × 509
  - `react-doctor/async-await-in-loop` × 238
  - `react-doctor/js-combine-iterations` × 121
  - `react-doctor/no-render-in-render` × 60
  - `react-doctor/async-parallel` × 14
  - `react-doctor/design-no-three-period-ellipsis` × 6
  - `react-doctor/js-length-check-first` × 4
  - `react-doctor/server-fetch-without-revalidate` × 4
  - `react-doctor/no-inline-exhaustive-style` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-parallel` × 2
  - `react-doctor/async-await-in-loop` × 1
  - `react-doctor/js-flatmap-filter` × 1
  - `react-doctor/js-hoist-regexp` × 1

### dubinc/dub

- v1 filtered score: **24** vs v2 filtered: **25**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-fetch-without-revalidate` × 16
  - `react-doctor/js-combine-iterations` × 14
  - `react-doctor/design-no-three-period-ellipsis` × 13
  - `react-doctor/server-sequential-independent-await` × 8
  - `react-doctor/async-await-in-loop` × 6
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/nextjs-no-img-element` × 1

### TanStack/query

- v1 filtered score: **50** vs v2 filtered: **52**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/no-render-in-render`
  - `react-doctor/server-sequential-independent-await`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 78
  - `react-doctor/no-barrel-import` × 20
  - `react-doctor/server-sequential-independent-await` × 4
  - `react-doctor/no-render-in-render` × 4
  - `react-doctor/async-await-in-loop` × 2
  - `react-doctor/js-combine-iterations` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `jsx-a11y/anchor-is-valid` × 8
  - `react-doctor/async-await-in-loop` × 6
  - `react-doctor/js-combine-iterations` × 3
  - `react-doctor/async-parallel` × 2
  - `react-doctor/no-prevent-default` × 2
  - `react-doctor/rendering-hydration-mismatch-time` × 2
  - `react-doctor/no-barrel-import` × 1
  - `react-doctor/js-index-maps` × 1
  - `react-doctor/js-set-map-lookups` × 1
  - `react-doctor/no-uncontrolled-input` × 1
  - `react-doctor/design-no-vague-button-label` × 1
  - `react-doctor/async-defer-await` × 1

### pmndrs/react-three-fiber

- v1 filtered score: **80** vs v2 filtered: **79**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/server-sequential-independent-await`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/rn-no-raw-text`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-barrel-import` × 12
  - `react-doctor/async-await-in-loop` × 4
  - `react-doctor/server-sequential-independent-await` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/rn-no-raw-text` × 7
  - `react-doctor/rn-prefer-expo-image` × 1

### react-hook-form/react-hook-form

- v1 filtered score: **75** vs v2 filtered: **76**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 2

### framer/motion

- v1 filtered score: **49** vs v2 filtered: **51**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/js-combine-iterations`
  - `react-doctor/server-sequential-independent-await`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-barrel-import` × 4
  - `react-doctor/js-combine-iterations` × 2
  - `react-doctor/server-sequential-independent-await` × 2
  - `react-doctor/async-await-in-loop` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-await-in-loop` × 2

### expo/expo

- v1 filtered score: **14** vs v2 filtered: **15**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 136
  - `react-doctor/server-sequential-independent-await` × 89
  - `react-doctor/async-await-in-loop` × 46
  - `react-doctor/no-render-in-render` × 42
  - `react-doctor/js-combine-iterations` × 25
  - `react-doctor/no-barrel-import` × 17
  - `react-doctor/design-no-three-period-ellipsis` × 14
  - `react-doctor/js-length-check-first` × 4
- Extra in v2 by (file, line) tuple (sampled):
  - `effect/no-event-handler` × 80
  - `react-doctor/js-combine-iterations` × 53
  - `react-doctor/no-dynamic-import-path` × 43
  - `react-doctor/js-set-map-lookups` × 32
  - `react-doctor/async-await-in-loop` × 21
  - `react-doctor/rn-prefer-reanimated` × 20
  - `react-doctor/effect-needs-cleanup` × 18
  - `react-doctor/js-flatmap-filter` × 13
  - `react-doctor/js-index-maps` × 11
  - `react-doctor/no-barrel-import` × 9
  - `react-doctor/js-cache-property-access` × 8
  - `react-doctor/async-parallel` × 8
  - `effect/no-pass-data-to-parent` × 7
  - `react-doctor/rerender-state-only-in-handlers` × 7
  - `react-doctor/js-tosorted-immutable` × 6
  - `react-doctor/no-react19-deprecated-apis` × 6
  - `react-doctor/js-length-check-first` × 6
  - `react-doctor/no-cascading-set-state` × 5
  - `react-doctor/no-effect-event-handler` × 5
  - `react-doctor/rerender-functional-setstate` × 5

### vercel/next.js

- v1 filtered score: **0** vs v2 filtered: **0**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-redundant-size-axes`
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/no-tiny-text`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-set-map-lookups` × 658
  - `react-doctor/async-await-in-loop` × 412
  - `react-doctor/server-sequential-independent-await` × 381
  - `react-doctor/js-cache-property-access` × 317
  - `react-doctor/async-parallel` × 281
  - `react-doctor/js-combine-iterations` × 233
  - `react-doctor/no-dynamic-import-path` × 119
  - `react-doctor/no-nested-component-definition` × 84
  - `react-doctor/no-barrel-import` × 56
  - `react-doctor/no-polymorphic-children` × 50
  - `react-hooks-js/todo` × 48
  - `react-doctor/design-no-three-period-ellipsis` × 39
  - `react-doctor/no-eval` × 39
  - `react-doctor/js-length-check-first` × 36
  - `react-doctor/js-hoist-regexp` × 34
  - `react-doctor/rendering-svg-precision` × 33
  - `react-doctor/nextjs-missing-metadata` × 29
  - `react-doctor/js-index-maps` × 29
  - `react-doctor/js-flatmap-filter` × 29
  - `react-doctor/design-no-redundant-size-axes` × 27
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-await-in-loop` × 15
  - `react-doctor/async-parallel` × 12
  - `react-doctor/js-set-map-lookups` × 8
  - `react-doctor/js-cache-property-access` × 4
  - `react-doctor/js-combine-iterations` × 3
  - `react-doctor/no-dynamic-import-path` × 3
  - `react-doctor/js-index-maps` × 2
  - `react-doctor/no-eval` × 1
  - `react-doctor/js-tosorted-immutable` × 1
  - `react-doctor/server-sequential-independent-await` × 1

### facebook/react

- v1 filtered score: **47** vs v2 filtered: **100**
- Unique rules in v1 only (drive v2's higher score):
  - `effect/no-adjust-state-on-prop-change`
  - `effect/no-chain-state-updates`
  - `effect/no-derived-state`
  - `effect/no-event-handler`
  - `effect/no-initialize-state`
  - `effect/no-pass-live-state-to-parent`
  - `jsx-a11y/alt-text`
  - `jsx-a11y/anchor-is-valid`
  - `jsx-a11y/click-events-have-key-events`
  - `jsx-a11y/html-has-lang`
  - `jsx-a11y/iframe-has-title`
  - `jsx-a11y/no-autofocus`
  - `jsx-a11y/no-distracting-elements`
  - `jsx-a11y/no-static-element-interactions`
  - `jsx-a11y/tabindex-no-positive`
  - `react-doctor/async-await-in-loop`
  - `react-doctor/async-parallel`
  - `react-doctor/client-passive-event-listeners`
  - `react-doctor/effect-needs-cleanup`
  - `react-doctor/js-combine-iterations`
  - `react-doctor/js-flatmap-filter`
  - `react-doctor/js-length-check-first`
  - `react-doctor/js-set-map-lookups`
  - `react-doctor/no-array-index-as-key`
  - `react-doctor/no-cascading-set-state`
  - `react-doctor/no-derived-state-effect`
  - `react-doctor/no-derived-useState`
  - `react-doctor/no-effect-event-handler`
  - `react-doctor/no-effect-event-in-deps`
  - `react-doctor/no-fetch-in-effect`
  - `react-doctor/no-generic-handler-names`
  - `react-doctor/no-inline-prop-on-memo-component`
  - `react-doctor/no-legacy-class-lifecycles`
  - `react-doctor/no-legacy-context-api`
  - `react-doctor/no-nested-component-definition`
  - `react-doctor/no-polymorphic-children`
  - `react-doctor/no-prevent-default`
  - `react-doctor/no-render-in-render`
  - `react-doctor/no-set-state-in-render`
  - `react-doctor/no-tiny-text`
  - `react-doctor/no-uncontrolled-input`
  - `react-doctor/no-undeferred-third-party`
  - `react-doctor/no-usememo-simple-expression`
  - `react-doctor/rendering-hoist-jsx`
  - `react-doctor/rendering-hydration-mismatch-time`
  - `react-doctor/rendering-hydration-no-flicker`
  - `react-doctor/rendering-script-defer-async`
  - `react-doctor/rerender-functional-setstate`
  - `react-doctor/rerender-lazy-state-init`
  - `react-doctor/rerender-state-only-in-handlers`
  - `react-doctor/server-sequential-independent-await`
  - `react/jsx-key`
  - `react/jsx-no-script-url`
  - `react/no-children-prop`
  - `react/no-danger`
  - `react/no-direct-mutation-state`
  - `react/no-render-return-value`
  - `react/no-string-refs`
  - `react/no-unknown-property`
  - `react/require-render-return`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react/no-unknown-property` × 1462
  - `jsx-a11y/html-has-lang` × 429
  - `react-doctor/no-legacy-class-lifecycles` × 205
  - `react-doctor/no-legacy-context-api` × 137
  - `jsx-a11y/alt-text` × 134
  - `react-doctor/async-parallel` × 122
  - `react/jsx-key` × 112
  - `jsx-a11y/no-static-element-interactions` × 105
  - `jsx-a11y/click-events-have-key-events` × 102
  - `react/no-danger` × 63
  - `jsx-a11y/anchor-is-valid` × 44
  - `react/no-render-return-value` × 43
  - `react-doctor/rerender-state-only-in-handlers` × 30
  - `react-doctor/no-usememo-simple-expression` × 21
  - `react-doctor/async-await-in-loop` × 21
  - `effect/no-initialize-state` × 19
  - `react-doctor/rerender-functional-setstate` × 15
  - `react-doctor/no-cascading-set-state` × 13
  - `react-doctor/no-derived-useState` × 12
  - `react-doctor/no-array-index-as-key` × 12

### bluesky-social/social-app

- v1 filtered score: **22** vs v2 filtered: **23**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 15
  - `react-doctor/js-combine-iterations` × 5
  - `react-doctor/server-sequential-independent-await` × 3
  - `react-doctor/no-barrel-import` × 3
  - `react-doctor/no-render-in-render` × 3
  - `react-doctor/no-array-index-as-key` × 3
  - `jsx-a11y/alt-text` × 1
  - `react-doctor/async-defer-await` × 1
  - `react-doctor/no-inline-exhaustive-style` × 1

### outline/outline

- v1 filtered score: **55** vs v2 filtered: **56**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/no-barrel-import`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 648
  - `react-doctor/js-combine-iterations` × 10
  - `react-doctor/async-await-in-loop` × 6
  - `react-doctor/no-barrel-import` × 5
  - `react-doctor/no-render-in-render` × 3

### trpc/trpc

- v1 filtered score: **60** vs v2 filtered: **58**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/no-barrel-import`
  - `react-doctor/no-react19-deprecated-apis`
  - `react-doctor/server-after-nonblocking`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-await-in-loop` × 15
  - `react-doctor/no-inline-exhaustive-style` × 14
  - `react-doctor/js-combine-iterations` × 6
  - `react-doctor/design-no-three-period-ellipsis` × 6
  - `react-doctor/server-sequential-independent-await` × 5
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-default-tailwind-palette` × 84
  - `react/no-unknown-property` × 54
  - `react-doctor/async-await-in-loop` × 15
  - `react-doctor/design-no-bold-heading` × 14
  - `react-doctor/no-array-index-as-key` × 13
  - `react-doctor/js-combine-iterations` × 12
  - `react-doctor/js-set-map-lookups` × 12
  - `react-doctor/rendering-hydration-mismatch-time` × 11
  - `react-doctor/no-prevent-default` × 8
  - `react-doctor/async-parallel` × 8
  - `react-doctor/design-no-redundant-size-axes` × 8
  - `react-doctor/no-eval` × 7
  - `react-doctor/rerender-state-only-in-handlers` × 6
  - `effect/no-chain-state-updates` × 6
  - `react-doctor/no-dynamic-import-path` × 6
  - `react-doctor/no-barrel-import` × 5
  - `react-doctor/js-index-maps` × 5
  - `jsx-a11y/alt-text` × 5
  - `react-doctor/js-flatmap-filter` × 5
  - `react-doctor/js-hoist-intl` × 4

### radix-ui/primitives

- v1 filtered score: **72** vs v2 filtered: **72**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/no-long-transition-duration`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-long-transition-duration` × 2

### documenso/documenso

- v1 filtered score: **45** vs v2 filtered: **46**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 229
  - `react-doctor/async-await-in-loop` × 58
  - `react-doctor/design-no-three-period-ellipsis` × 32
  - `react-doctor/server-fetch-without-revalidate` × 18
  - `react-doctor/no-render-in-render` × 10
  - `react-doctor/js-combine-iterations` × 9
  - `react-doctor/async-parallel` × 7
  - `react-doctor/no-inline-exhaustive-style` × 4
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 798

### refinedev/refine

- v1 filtered score: **21** vs v2 filtered: **18**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/nextjs-no-css-link`
  - `react-doctor/nextjs-no-native-script`
- Unique rules in v2 only (drive v1's higher score):
  - `jsx-a11y/html-has-lang`
  - `react-doctor/async-parallel`
  - `react-doctor/js-cache-property-access`
  - `react-doctor/no-long-transition-duration`
  - `react-doctor/no-many-boolean-props`
  - `react-doctor/no-polymorphic-children`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-default-tailwind-palette` × 158
  - `react-doctor/no-barrel-import` × 58
  - `react-doctor/no-react19-deprecated-apis` × 54
  - `react-doctor/design-no-three-period-ellipsis` × 50
  - `effect/no-event-handler` × 32
  - `react-doctor/design-no-bold-heading` × 31
  - `jsx-a11y/label-has-associated-control` × 22
  - `react-doctor/no-render-in-render` × 20
  - `react-doctor/rendering-svg-precision` × 20
  - `react-doctor/design-no-redundant-size-axes` × 20
  - `react-doctor/no-array-index-as-key` × 18
  - `jsx-a11y/no-static-element-interactions` × 16
  - `jsx-a11y/click-events-have-key-events` × 14
  - `react-doctor/no-uncontrolled-input` × 11
  - `react-doctor/js-flatmap-filter` × 9
  - `react-doctor/js-combine-iterations` × 8
  - `react-doctor/prefer-dynamic-import` × 8
  - `jsx-a11y/anchor-is-valid` × 7
  - `react-doctor/rendering-hydration-mismatch-time` × 7
  - `react-doctor/design-no-space-on-flex-children` × 6
- Extra in v2 by (file, line) tuple (sampled):
  - `effect/no-event-handler` × 686
  - `react-doctor/rendering-svg-precision` × 488
  - `react-doctor/design-no-default-tailwind-palette` × 205
  - `react-doctor/no-react19-deprecated-apis` × 191
  - `jsx-a11y/label-has-associated-control` × 128
  - `react-doctor/no-array-index-as-key` × 82
  - `react-doctor/no-render-in-render` × 73
  - `react-doctor/js-combine-iterations` × 73
  - `effect/no-derived-state` × 56
  - `jsx-a11y/no-static-element-interactions` × 53
  - `react-doctor/rerender-functional-setstate` × 48
  - `react-doctor/design-no-bold-heading` × 47
  - `react-doctor/no-inline-exhaustive-style` × 46
  - `jsx-a11y/click-events-have-key-events` × 45
  - `react-doctor/js-flatmap-filter` × 45
  - `effect/no-initialize-state` × 41
  - `react-doctor/no-uncontrolled-input` × 39
  - `react-doctor/no-giant-component` × 35
  - `jsx-a11y/no-autofocus` × 35
  - `react-doctor/no-effect-event-handler` × 33

### vercel/ai

- v1 filtered score: **52** vs v2 filtered: **54**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 122
  - `react-doctor/js-combine-iterations` × 54
  - `react-doctor/server-sequential-independent-await` × 51
  - `react-doctor/async-await-in-loop` × 40
  - `react-doctor/server-fetch-without-revalidate` × 14
  - `react-doctor/async-parallel` × 6
  - `react-doctor/no-barrel-import` × 5
  - `react-doctor/nextjs-missing-metadata` × 2
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 84
  - `react-doctor/async-await-in-loop` × 2

### t3-oss/create-t3-app

- v1 filtered score: **88** vs v2 filtered: **89**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/nextjs-no-a-element`
  - `react-doctor/nextjs-no-img-element`
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/js-cache-storage`
  - `react-doctor/js-flatmap-filter`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 4
  - `react-doctor/nextjs-no-img-element` × 1
  - `react-doctor/nextjs-no-a-element` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-flatmap-filter` × 2
  - `react-doctor/js-combine-iterations` × 1
  - `react-doctor/js-cache-storage` × 1

### vercel/swr

- v1 filtered score: **78** vs v2 filtered: **80**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/async-parallel`
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 11
  - `react-doctor/async-parallel` × 1
  - `react-doctor/async-await-in-loop` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/nextjs-missing-metadata` × 37
  - `effect/no-initialize-state` × 6
  - `react/no-unknown-property` × 4
  - `react-doctor/rendering-hydration-no-flicker` × 3
  - `react-doctor/rerender-state-only-in-handlers` × 2
  - `effect/no-derived-state` × 2
  - `react-doctor/no-array-index-as-key` × 2
  - `jsx-a11y/alt-text` × 2
  - `react-doctor/nextjs-no-img-element` × 2
  - `react-doctor/rerender-functional-setstate` × 2
  - `effect/no-event-handler` × 2
  - `react-doctor/no-prevent-default` × 2
  - `jsx-a11y/html-has-lang` × 1
  - `jsx-a11y/click-events-have-key-events` × 1
  - `jsx-a11y/no-static-element-interactions` × 1
  - `react-doctor/server-auth-actions` × 1
  - `jsx-a11y/no-autofocus` × 1
  - `react-doctor/rendering-hydration-mismatch-time` × 1
  - `react-doctor/client-localstorage-no-version` × 1
  - `react-doctor/no-generic-handler-names` × 1

### pmndrs/zustand

- v1 filtered score: **93** vs v2 filtered: **93**
- Extra in v2 by (file, line) tuple (sampled):
  - `react/no-unknown-property` × 9
  - `react-doctor/no-array-index-as-key` × 3
  - `react-doctor/no-inline-exhaustive-style` × 1
  - `react-doctor/design-no-bold-heading` × 1

### jaredpalmer/formik

- v1 filtered score: **76** vs v2 filtered: **78**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/rn-no-raw-text`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/rn-no-raw-text` × 8
  - `react-doctor/design-no-three-period-ellipsis` × 1

### remix-run/react-router

- v1 filtered score: **66** vs v2 filtered: **58**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Unique rules in v2 only (drive v1's higher score):
  - `jsx-a11y/label-has-associated-control`
  - `jsx-a11y/no-static-element-interactions`
  - `react-doctor/js-index-maps`
  - `react-doctor/js-tosorted-immutable`
  - `react-doctor/no-fetch-in-effect`
  - `react-doctor/no-inline-exhaustive-style`
  - `react-doctor/no-react-dom-deprecated-apis`
  - `react-doctor/no-react19-deprecated-apis`
  - `react-doctor/no-z-index-9999`
  - `react-doctor/prefer-use-effect-event`
  - `react/jsx-key`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 147
  - `react-doctor/no-barrel-import` × 33
  - `react-doctor/server-sequential-independent-await` × 27
  - `react-doctor/async-await-in-loop` × 18
  - `react-doctor/design-no-three-period-ellipsis` × 7
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/async-parallel` × 355
  - `react-doctor/js-set-map-lookups` × 78
  - `react-doctor/async-await-in-loop` × 57
  - `react-doctor/no-react19-deprecated-apis` × 52
  - `react-doctor/js-combine-iterations` × 42
  - `effect/no-event-handler` × 29
  - `react-doctor/no-dynamic-import-path` × 25
  - `react/no-children-prop` × 23
  - `react-doctor/no-uncontrolled-input` × 16
  - `react/no-danger` × 12
  - `react-doctor/server-sequential-independent-await` × 10
  - `react-doctor/js-cache-property-access` × 9
  - `react-doctor/no-generic-handler-names` × 5
  - `react-doctor/no-effect-chain` × 5
  - `react-doctor/js-hoist-regexp` × 5
  - `react-doctor/js-flatmap-filter` × 5
  - `effect/no-chain-state-updates` × 4
  - `react-doctor/rerender-state-only-in-handlers` × 4
  - `effect/no-derived-state` × 4
  - `jsx-a11y/click-events-have-key-events` × 3

### withastro/astro

- v1 filtered score: **90** vs v2 filtered: **81**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-default-tailwind-palette`
  - `react-doctor/design-no-vague-button-label`
- Unique rules in v2 only (drive v1's higher score):
  - `jsx-a11y/label-has-associated-control`
  - `react-doctor/async-defer-await`
  - `react-doctor/async-parallel`
  - `react-doctor/client-localstorage-no-version`
  - `react-doctor/js-batch-dom-css`
  - `react-doctor/js-cache-property-access`
  - `react-doctor/js-hoist-regexp`
  - `react-doctor/js-index-maps`
  - `react-doctor/js-tosorted-immutable`
  - `react-doctor/no-barrel-import`
  - `react-doctor/no-document-start-view-transition`
  - `react-doctor/no-polymorphic-children`
  - `react-doctor/server-hoist-static-io`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react/no-unknown-property` × 82
  - `react-doctor/server-sequential-independent-await` × 20
  - `react-doctor/rerender-functional-setstate` × 13
  - `react-doctor/no-derived-useState` × 13
  - `react-doctor/no-prevent-default` × 3
  - `react-doctor/design-no-default-tailwind-palette` × 1
  - `react-doctor/async-await-in-loop` × 1
  - `react-doctor/design-no-vague-button-label` × 1
  - `react/jsx-key` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/no-barrel-import` × 194
  - `react/no-unknown-property` × 113
  - `react-doctor/async-await-in-loop` × 70
  - `react-doctor/js-set-map-lookups` × 57
  - `react-doctor/js-combine-iterations` × 46
  - `react-doctor/no-dynamic-import-path` × 34
  - `react-doctor/no-derived-useState` × 17
  - `react-doctor/js-index-maps` × 16
  - `react-doctor/js-cache-property-access` × 16
  - `react-doctor/rerender-functional-setstate` × 14
  - `react-doctor/async-parallel` × 12
  - `react-doctor/server-sequential-independent-await` × 9
  - `react-doctor/js-flatmap-filter` × 9
  - `react-doctor/js-tosorted-immutable` × 5
  - `react-doctor/async-defer-await` × 3
  - `react-doctor/js-batch-dom-css` × 3
  - `react-doctor/no-prevent-default` × 3
  - `react-doctor/js-hoist-regexp` × 3
  - `react-doctor/client-localstorage-no-version` × 3
  - `react-doctor/no-polymorphic-children` × 2

### vitejs/vite

- v1 filtered score: **94** vs v2 filtered: **85**
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/async-await-in-loop`
  - `react-doctor/async-defer-await`
  - `react-doctor/js-cache-property-access`
  - `react-doctor/js-hoist-intl`
  - `react-doctor/js-hoist-regexp`
  - `react-doctor/js-index-maps`
  - `react-doctor/js-set-map-lookups`
  - `react-doctor/no-barrel-import`
  - `react-doctor/no-eval`
  - `react-doctor/no-full-lodash-import`
  - `react/no-unknown-property`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 1
  - `react-doctor/async-parallel` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react/no-unknown-property` × 92
  - `react-doctor/no-dynamic-import-path` × 59
  - `react-doctor/js-set-map-lookups` × 45
  - `react-doctor/async-await-in-loop` × 40
  - `react-doctor/js-combine-iterations` × 18
  - `react-doctor/js-flatmap-filter` × 12
  - `react-doctor/js-cache-property-access` × 7
  - `react-doctor/no-barrel-import` × 6
  - `react-doctor/rerender-functional-setstate` × 5
  - `react-doctor/async-parallel` × 5
  - `react-doctor/server-sequential-independent-await` × 5
  - `react-doctor/js-hoist-regexp` × 4
  - `react-doctor/js-index-maps` × 4
  - `react-doctor/no-eval` × 3
  - `react-doctor/async-defer-await` × 2
  - `react-doctor/js-hoist-intl` × 1
  - `react-doctor/rendering-hydration-no-flicker` × 1
  - `effect/no-initialize-state` × 1
  - `react-doctor/no-full-lodash-import` × 1

### umami-software/umami

- v1 filtered score: **45** vs v2 filtered: **45**
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/no-render-in-render` × 4

### calcom/cal.com

- v1 filtered score: **18** vs v2 filtered: **19**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
  - `react-doctor/server-fetch-without-revalidate`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 425
  - `react-doctor/server-sequential-independent-await` × 52
  - `react-doctor/async-await-in-loop` × 43
  - `react-doctor/nextjs-no-img-element` × 28
  - `react-doctor/design-no-three-period-ellipsis` × 13
  - `react-doctor/js-combine-iterations` × 9
  - `react-doctor/server-fetch-without-revalidate` × 6
  - `react-doctor/nextjs-no-use-search-params-without-suspense` × 6
  - `react-doctor/no-render-in-render` × 2
  - `react-doctor/js-length-check-first` × 1
  - `react-doctor/nextjs-missing-metadata` × 1
  - `react-doctor/nextjs-no-native-script` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/design-no-redundant-size-axes` × 94
  - `react-doctor/js-batch-dom-css` × 11
  - `react-doctor/async-parallel` × 4
  - `effect/no-initialize-state` × 2
  - `react-doctor/js-set-map-lookups` × 2
  - `effect/no-pass-data-to-parent` × 1
  - `effect/no-derived-state` × 1
  - `react-doctor/rendering-hydration-no-flicker` × 1
  - `react-doctor/server-sequential-independent-await` × 1

### nrwl/nx

- v1 filtered score: **43** vs v2 filtered: **44**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/js-combine-iterations` × 25
  - `react-doctor/server-sequential-independent-await` × 15
  - `react-doctor/design-no-redundant-size-axes` × 15
  - `react-doctor/no-barrel-import` × 14
  - `react-doctor/async-await-in-loop` × 12
  - `react-doctor/design-no-three-period-ellipsis` × 3
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-set-map-lookups` × 18
  - `react-doctor/no-eval` × 5
  - `react-doctor/js-combine-iterations` × 4
  - `react-doctor/async-await-in-loop` × 4
  - `react-doctor/js-cache-property-access` × 4
  - `react-doctor/js-index-maps` × 2
  - `react-doctor/no-dynamic-import-path` × 2
  - `react-doctor/js-flatmap-filter` × 1

### novuhq/novu

- v1 filtered score: **26** vs v2 filtered: **27**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 24
  - `react-doctor/async-parallel` × 20
  - `react-doctor/js-combine-iterations` × 8
  - `react-doctor/no-render-in-render` × 7
  - `react-doctor/async-await-in-loop` × 7
  - `react-doctor/no-barrel-import` × 2
  - `react-doctor/server-sequential-independent-await` × 2
  - `react-doctor/nextjs-no-img-element` × 2

### highlight/highlight

- v1 filtered score: **26** vs v2 filtered: **27**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/design-no-three-period-ellipsis` × 7
  - `react-doctor/no-render-in-render` × 6
  - `react-doctor/no-inline-exhaustive-style` × 5
  - `react-doctor/server-fetch-without-revalidate` × 3
  - `react-doctor/js-combine-iterations` × 2
  - `react-doctor/no-barrel-import` × 1
  - `react-doctor/nextjs-no-img-element` × 1
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-combine-iterations` × 7
  - `react-doctor/js-set-map-lookups` × 4
  - `react-doctor/async-await-in-loop` × 3
  - `react-doctor/no-barrel-import` × 3

### immich-app/immich

- v1 filtered score: **87** vs v2 filtered: **83**
- Unique rules in v2 only (drive v1's higher score):
  - `react-doctor/client-passive-event-listeners`
  - `react-doctor/js-batch-dom-css`
  - `react-doctor/js-hoist-intl`
  - `react-doctor/js-tosorted-immutable`
  - `react-doctor/no-dynamic-import-path`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 140
  - `react-doctor/async-await-in-loop` × 6
  - `react-doctor/js-combine-iterations` × 4
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/no-full-lodash-import` × 27
  - `react-doctor/async-parallel` × 24
  - `react-doctor/server-sequential-independent-await` × 24
  - `react-doctor/async-await-in-loop` × 22
  - `react-doctor/js-combine-iterations` × 18
  - `react-doctor/js-batch-dom-css` × 8
  - `react-doctor/js-index-maps` × 6
  - `react-doctor/js-set-map-lookups` × 4
  - `react-doctor/js-tosorted-immutable` × 4
  - `react-doctor/async-defer-await` × 4
  - `react-doctor/client-passive-event-listeners` × 4
  - `react-doctor/js-hoist-intl` × 3
  - `react-doctor/js-cache-property-access` × 2
  - `react-doctor/js-flatmap-filter` × 1
  - `react-doctor/no-dynamic-import-path` × 1

### grafana/grafana

- v1 filtered score: **33** vs v2 filtered: **33**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/design-no-three-period-ellipsis`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/server-sequential-independent-await` × 187
  - `react-doctor/no-render-in-render` × 151
  - `react-doctor/js-combine-iterations` × 75
  - `react-doctor/async-await-in-loop` × 72
  - `react-doctor/design-no-three-period-ellipsis` × 51
  - `react-doctor/no-barrel-import` × 7
- Extra in v2 by (file, line) tuple (sampled):
  - `react-doctor/js-combine-iterations` × 3
  - `react-doctor/js-hoist-regexp` × 2
  - `react-doctor/js-index-maps` × 1
  - `react-doctor/no-full-lodash-import` × 1
  - `react-doctor/js-set-map-lookups` × 1
  - `react-doctor/async-await-in-loop` × 1

### pierrecomputer/pierre/packages/trees

- v1 filtered score: **78** vs v2 filtered: **78**
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-parallel` × 67
  - `react-doctor/js-combine-iterations` × 22
  - `react-doctor/async-await-in-loop` × 13
  - `react-doctor/no-barrel-import` × 9
  - `react-doctor/server-sequential-independent-await` × 3
  - `react-doctor/no-render-in-render` × 1

### pierrecomputer/pierre/packages/diffs

- v1 filtered score: **93** vs v2 filtered: **94**
- Unique rules in v1 only (drive v2's higher score):
  - `react-doctor/async-await-in-loop`
  - `react-doctor/server-sequential-independent-await`
- Missing in v2 by (file, line) tuple (sampled — same-rule-different-line entries here don't move the score):
  - `react-doctor/async-await-in-loop` × 4
  - `react-doctor/server-sequential-independent-await` × 3
  - `react-doctor/no-render-in-render` × 1

## Cross-fixture unique-rule rollup

Each rule below is one that fires on at least one fixture in one version but not the other. These are the rules whose alignment would close the score-parity gap.

### Rules firing in v1 but not v2 (sorted by fixture count)

| Rule | Fixtures | Where |
|---|---:|---|
| `react-doctor/design-no-three-period-ellipsis` | 41 | RhysSullivan/executor, tldraw/tldraw, pingdotgg/t3code, better-auth/better-auth, mastra-ai/mastra, payloadcms/payload, baptisteArno/typebot.io, makeplane/plane, medusajs/medusa, RocketChat/Rocket.Chat, twentyhq/twenty, unkeyed/unkey, shadcn-ui/ui, triggerdotdev/trigger.dev, langfuse/langfuse, ToolJet/ToolJet, onlook-dev/onlook, calcom/cal.com, PostHog/posthog, appsmithorg/appsmith, getsentry/sentry, lobehub/lobe-chat, dubinc/dub, TanStack/query, react-hook-form/react-hook-form, expo/expo, vercel/next.js, bluesky-social/social-app, trpc/trpc, documenso/documenso, refinedev/refine, vercel/ai, t3-oss/create-t3-app, vercel/swr, jaredpalmer/formik, remix-run/react-router, calcom/cal.com, nrwl/nx, novuhq/novu, highlight/highlight, grafana/grafana |
| `react-doctor/server-fetch-without-revalidate` | 11 | better-auth/better-auth, unkeyed/unkey, triggerdotdev/trigger.dev, formbricks/formbricks, onlook-dev/onlook, calcom/cal.com, lobehub/lobe-chat, dubinc/dub, documenso/documenso, vercel/ai, calcom/cal.com |
| `react-doctor/js-length-check-first` | 8 | excalidraw/excalidraw, payloadcms/payload, RocketChat/Rocket.Chat, twentyhq/twenty, formbricks/formbricks, onlook-dev/onlook, getsentry/sentry, facebook/react |
| `react-doctor/server-sequential-independent-await` | 7 | RhysSullivan/executor, makeplane/plane, TanStack/query, pmndrs/react-three-fiber, framer/motion, facebook/react, pierrecomputer/pierre/packages/diffs |
| `react-doctor/no-barrel-import` | 4 | nodejs/nodejs.org, tldraw/tldraw, PostHog/posthog, outline/outline |
| `react-doctor/nextjs-no-a-element` | 2 | nodejs/nodejs.org, t3-oss/create-t3-app |
| `react-doctor/nextjs-no-img-element` | 2 | PostHog/posthog, t3-oss/create-t3-app |
| `react-doctor/no-render-in-render` | 2 | TanStack/query, facebook/react |
| `react-doctor/js-combine-iterations` | 2 | framer/motion, facebook/react |
| `react-doctor/no-tiny-text` | 2 | vercel/next.js, facebook/react |
| `react-doctor/async-await-in-loop` | 2 | facebook/react, pierrecomputer/pierre/packages/diffs |
| `react-doctor/async-parallel` | 2 | facebook/react, vercel/swr |
| `react-doctor/no-inline-exhaustive-style` | 1 | better-auth/better-auth |
| `react-doctor/nextjs-missing-metadata` | 1 | PostHog/posthog |
| `react-doctor/nextjs-no-client-side-redirect` | 1 | PostHog/posthog |
| `react-doctor/react-compiler-destructure-method` | 1 | PostHog/posthog |
| `react-doctor/design-no-redundant-size-axes` | 1 | vercel/next.js |
| `effect/no-adjust-state-on-prop-change` | 1 | facebook/react |
| `effect/no-chain-state-updates` | 1 | facebook/react |
| `effect/no-derived-state` | 1 | facebook/react |
| `effect/no-event-handler` | 1 | facebook/react |
| `effect/no-initialize-state` | 1 | facebook/react |
| `effect/no-pass-live-state-to-parent` | 1 | facebook/react |
| `jsx-a11y/alt-text` | 1 | facebook/react |
| `jsx-a11y/anchor-is-valid` | 1 | facebook/react |
| `jsx-a11y/click-events-have-key-events` | 1 | facebook/react |
| `jsx-a11y/html-has-lang` | 1 | facebook/react |
| `jsx-a11y/iframe-has-title` | 1 | facebook/react |
| `jsx-a11y/no-autofocus` | 1 | facebook/react |
| `jsx-a11y/no-distracting-elements` | 1 | facebook/react |
| `jsx-a11y/no-static-element-interactions` | 1 | facebook/react |
| `jsx-a11y/tabindex-no-positive` | 1 | facebook/react |
| `react-doctor/client-passive-event-listeners` | 1 | facebook/react |
| `react-doctor/effect-needs-cleanup` | 1 | facebook/react |
| `react-doctor/js-flatmap-filter` | 1 | facebook/react |
| `react-doctor/js-set-map-lookups` | 1 | facebook/react |
| `react-doctor/no-array-index-as-key` | 1 | facebook/react |
| `react-doctor/no-cascading-set-state` | 1 | facebook/react |
| `react-doctor/no-derived-state-effect` | 1 | facebook/react |
| `react-doctor/no-derived-useState` | 1 | facebook/react |
| `react-doctor/no-effect-event-handler` | 1 | facebook/react |
| `react-doctor/no-effect-event-in-deps` | 1 | facebook/react |
| `react-doctor/no-fetch-in-effect` | 1 | facebook/react |
| `react-doctor/no-generic-handler-names` | 1 | facebook/react |
| `react-doctor/no-inline-prop-on-memo-component` | 1 | facebook/react |
| `react-doctor/no-legacy-class-lifecycles` | 1 | facebook/react |
| `react-doctor/no-legacy-context-api` | 1 | facebook/react |
| `react-doctor/no-nested-component-definition` | 1 | facebook/react |
| `react-doctor/no-polymorphic-children` | 1 | facebook/react |
| `react-doctor/no-prevent-default` | 1 | facebook/react |
| `react-doctor/no-set-state-in-render` | 1 | facebook/react |
| `react-doctor/no-uncontrolled-input` | 1 | facebook/react |
| `react-doctor/no-undeferred-third-party` | 1 | facebook/react |
| `react-doctor/no-usememo-simple-expression` | 1 | facebook/react |
| `react-doctor/rendering-hoist-jsx` | 1 | facebook/react |
| `react-doctor/rendering-hydration-mismatch-time` | 1 | facebook/react |
| `react-doctor/rendering-hydration-no-flicker` | 1 | facebook/react |
| `react-doctor/rendering-script-defer-async` | 1 | facebook/react |
| `react-doctor/rerender-functional-setstate` | 1 | facebook/react |
| `react-doctor/rerender-lazy-state-init` | 1 | facebook/react |
| `react-doctor/rerender-state-only-in-handlers` | 1 | facebook/react |
| `react/jsx-key` | 1 | facebook/react |
| `react/jsx-no-script-url` | 1 | facebook/react |
| `react/no-children-prop` | 1 | facebook/react |
| `react/no-danger` | 1 | facebook/react |
| `react/no-direct-mutation-state` | 1 | facebook/react |
| `react/no-render-return-value` | 1 | facebook/react |
| `react/no-string-refs` | 1 | facebook/react |
| `react/no-unknown-property` | 1 | facebook/react |
| `react/require-render-return` | 1 | facebook/react |
| `react-doctor/no-long-transition-duration` | 1 | radix-ui/primitives |
| `react-doctor/nextjs-no-css-link` | 1 | refinedev/refine |
| `react-doctor/nextjs-no-native-script` | 1 | refinedev/refine |
| `react-doctor/rn-no-raw-text` | 1 | jaredpalmer/formik |
| `react-doctor/design-no-default-tailwind-palette` | 1 | withastro/astro |
| `react-doctor/design-no-vague-button-label` | 1 | withastro/astro |

### Rules firing in v2 but not v1 (sorted by fixture count)

| Rule | Fixtures | Where |
|---|---:|---|
| `react-doctor/js-cache-property-access` | 4 | shadcn-ui/ui, refinedev/refine, withastro/astro, vitejs/vite |
| `react-doctor/no-secrets-in-client-code` | 3 | nodejs/nodejs.org, tldraw/tldraw, mastra-ai/mastra |
| `react-doctor/async-parallel` | 3 | shadcn-ui/ui, refinedev/refine, withastro/astro |
| `react-doctor/no-barrel-import` | 3 | trpc/trpc, withastro/astro, vitejs/vite |
| `react-doctor/js-index-maps` | 3 | remix-run/react-router, withastro/astro, vitejs/vite |
| `react-doctor/js-tosorted-immutable` | 3 | remix-run/react-router, withastro/astro, immich-app/immich |
| `react-doctor/js-min-max-loop` | 2 | excalidraw/excalidraw, mastra-ai/mastra |
| `react-doctor/prefer-use-effect-event` | 2 | excalidraw/excalidraw, remix-run/react-router |
| `react-doctor/no-react19-deprecated-apis` | 2 | trpc/trpc, remix-run/react-router |
| `react-doctor/no-polymorphic-children` | 2 | refinedev/refine, withastro/astro |
| `jsx-a11y/label-has-associated-control` | 2 | remix-run/react-router, withastro/astro |
| `react-doctor/async-defer-await` | 2 | withastro/astro, vitejs/vite |
| `react-doctor/js-batch-dom-css` | 2 | withastro/astro, immich-app/immich |
| `react-doctor/js-hoist-regexp` | 2 | withastro/astro, vitejs/vite |
| `react-doctor/js-hoist-intl` | 2 | vitejs/vite, immich-app/immich |
| `react-doctor/js-length-check-first` | 1 | mastra-ai/mastra |
| `react-doctor/rn-no-raw-text` | 1 | pmndrs/react-three-fiber |
| `react-doctor/server-after-nonblocking` | 1 | trpc/trpc |
| `jsx-a11y/html-has-lang` | 1 | refinedev/refine |
| `react-doctor/no-long-transition-duration` | 1 | refinedev/refine |
| `react-doctor/no-many-boolean-props` | 1 | refinedev/refine |
| `react-doctor/js-cache-storage` | 1 | t3-oss/create-t3-app |
| `react-doctor/js-flatmap-filter` | 1 | t3-oss/create-t3-app |
| `jsx-a11y/no-static-element-interactions` | 1 | remix-run/react-router |
| `react-doctor/no-fetch-in-effect` | 1 | remix-run/react-router |
| `react-doctor/no-inline-exhaustive-style` | 1 | remix-run/react-router |
| `react-doctor/no-react-dom-deprecated-apis` | 1 | remix-run/react-router |
| `react-doctor/no-z-index-9999` | 1 | remix-run/react-router |
| `react/jsx-key` | 1 | remix-run/react-router |
| `react-doctor/client-localstorage-no-version` | 1 | withastro/astro |
| `react-doctor/no-document-start-view-transition` | 1 | withastro/astro |
| `react-doctor/server-hoist-static-io` | 1 | withastro/astro |
| `react-doctor/async-await-in-loop` | 1 | vitejs/vite |
| `react-doctor/js-set-map-lookups` | 1 | vitejs/vite |
| `react-doctor/no-eval` | 1 | vitejs/vite |
| `react-doctor/no-full-lodash-import` | 1 | vitejs/vite |
| `react/no-unknown-property` | 1 | vitejs/vite |
| `react-doctor/client-passive-event-listeners` | 1 | immich-app/immich |
| `react-doctor/no-dynamic-import-path` | 1 | immich-app/immich |

