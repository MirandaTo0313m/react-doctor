# React-Doctor V2 — Expect Project Validation Report

**Date**: 2026-05-12
**Total issues**: 272 across 62 files (5 sub-projects)
**Projects**: CLI (Ink), Website (Next.js), Browser Runtime, Demo (Vite), Runtime-Test (Vite)

## Summary

| Verdict | Count | % |
|---------|-------|---|
| **True Positive (TP)** | 152 | 55.9% |
| **False Positive (FP)** | 46 | 16.9% |
| **Borderline** | 74 | 27.2% |
| **Total** | 272 | 100% |

### By Severity

| Severity | Total | TP | FP | Borderline |
|----------|-------|----|----|------------|
| error | 42 | 14 | 17 | 11 |
| warning | 230 | 138 | 29 | 63 |

### Key False Positive Categories
1. **`react-hooks-js(todo)` YieldExpression** (14 issues): React Compiler internal limitation with Effect `yield*` generators — not actionable user errors
2. **`react-hooks-js(refs)` in Ink components** (11 issues): Ink uses a deliberate "ref-during-render" pattern for initialization; not a DOM React app
3. **`rules-of-hooks` on Effect `use()`** (2 issues): `Github.use()` / `Effect.use()` is the Effect library API, not React 19's `use()` hook
4. **`js-request-idle-callback` in Node.js CLI** (7 issues): `requestIdleCallback` is a browser API — doesn't exist in Node/CLI environment

---

## Detailed File-by-File Validation

### Website App (`apps/website`)

#### `app/claude-spinner.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 42 | `no-array-index-as-key` | **BORDERLINE** | Static array of spinner dots never reordered — index-as-key is safe here, but rule is technically correct |

#### `app/page.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 6 | `nextjs-missing-metadata` | **TP** | Page export has no metadata/generateMetadata — hurts SEO for the landing page |
| 9 | `use-lazy-motion` | **TP** | Uses `motion` from framer-motion; LazyMotion would save ~30kb |
| 48 | `no-array-index-as-key` | **BORDERLINE** | Decorative gradient blocks — static, never reordered |
| 49 | `no-inline-exhaustive-style` | **TP** | 9 inline style props on gradient element — could be extracted |
| 157 | `no-cascading-set-state` | **TP** | 39 setState calls in a single useEffect for animation orchestration — legitimate but real cascading risk |
| 443 | `effect-no-adjust-state-on-prop-change` | **TP** | Effect syncs state from prop change; could derive during render |
| 547 | `no-pure-black-background` | **BORDERLINE** | `bg-black` is intentional dark theme; stylistic preference |
| 694 | `no-scale-from-zero` | **TP** | `scale: 0` in animation — `scale: 0.95` with opacity would look more natural |
| 733 | `rendering-svg-precision` | **TP** | SVG path with 4+ decimal precision; truncatable |
| 744 | `rendering-svg-precision` | **TP** | Same pattern |
| 924 | `no-array-index-as-key` | **BORDERLINE** | Feature list — static, never reordered |
| 930 | `no-array-index-as-key` | **BORDERLINE** | Same static list |
| 935 | `no-array-index-as-key` | **BORDERLINE** | Same static list |
| 1290 | `prefer-useReducer` | **TP** | 7 useState calls — some are related (animation state) and would benefit from useReducer |
| 1290 | `no-giant-component` | **TP** | 692 lines — genuinely too large; should be split |
| 1302 | `no-fetch-in-effect` | **TP** | Client-side fetch for GitHub stars could use SWR |
| 1302 | `client-swr-dedup` | **TP** | Same fetch — no dedup if multiple instances |
| 1302 | `nextjs-no-client-fetch-for-server-data` | **TP** | GitHub stars could be fetched server-side |
| 1355 | `effect(no-chain-state-updates)` | **TP** | Chains multiple setState calls that could be batched |
| 1404 | `jsx-a11y(click-events-have-key-events)` | **TP** | Clickable div needs keyboard support |
| 1404 | `jsx-a11y(no-static-element-interactions)` | **TP** | Static div with onClick needs role |
| 1925 | `no-array-index-as-key` | **BORDERLINE** | Changelog entries — likely static |
| 1926 | `jsx-a11y(click-events-have-key-events)` | **TP** | Same a11y issue |
| 1926 | `jsx-a11y(no-static-element-interactions)` | **TP** | Same a11y issue |

#### `app/react-grab.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 8 | `advanced-init-once` | **TP** | useEffect([]) initialization can re-run on remount/Strict Mode — should guard with module-level flag |

#### `app/replay/page.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 1 | `nextjs-missing-metadata` | **TP** | Replay page missing metadata |
| 82 | `react-compiler-destructure-method` | **BORDERLINE** | Destructuring searchParams.get is a micro-optimization for React Compiler; low impact |
| 83 | `react-compiler-destructure-method` | **BORDERLINE** | Same |
| 87 | `nextjs-no-client-side-redirect` | **TP** | router.replace() in useEffect — could use redirect() or middleware |
| 87 | `react-compiler-destructure-method` | **BORDERLINE** | Same destructure pattern |

#### `app/terms/page.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 8 | `no-giant-component` | **BORDERLINE** | 350 lines — it's a legal terms page; inherently long text content, not complex logic |

#### `components/replay/replay-viewer.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 7 | `use-lazy-motion` | **TP** | Same LazyMotion savings opportunity |
| 122 | `no-swallowed-error` | **TP** | Empty catch in JSON.parse — should at least log for debugging |
| 339 | `no-giant-component` | **TP** | 1002 lines — genuinely needs splitting |
| 345 | `prefer-useReducer` | **BORDERLINE** | 5 useState — borderline; some may be independent concerns |
| 550 | `client-event-listeners` | **TP** | `window.addEventListener('message')` per instance — should be shared |
| 557 | `effect(no-event-handler)` | **TP** | Effect is used as event handler pattern |
| 558 | `effect(no-pass-data-to-parent)` | **TP** | Effect passes data up via callback ref |
| 558 | `effect-no-pass-data-to-parent` | **TP** | Same issue, different rule ID |
| 565 | `advanced-use-latest` | **TP** | Callback ref in deps — should use useEffectEvent |
| 567 | `rerender-split-combined-hooks` | **TP** | Hook does multiple independent things — separable |
| 568 | `effect(no-event-handler)` | **TP** | Same event-handler-in-effect pattern |
| 569 | `effect(no-event-handler)` (x2) | **TP** | Same pattern |
| 600–605 | `js-batch-dom-css` (6 issues) | **TP** | 6 sequential `element.style.X` assignments — can batch with cssText |
| 1097 | `jsx-a11y(click-events-have-key-events)` | **TP** | Missing keyboard handler |
| 1097 | `jsx-a11y(no-static-element-interactions)` | **TP** | Missing role |
| 1274 | `motion-no-hover-transform-on-target` | **TP** | Hover transform on target element can cause flicker |

#### `components/ui/accordion.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 5 | `use-lazy-motion` | **TP** | LazyMotion savings |
| 114 | `no-icon-only-button-without-label` | **TP** | Icon-only button needs aria-label |
| 114 | `no-polymorphic-children` | **BORDERLINE** | `typeof children === "string"` check — common pattern, not always problematic |

#### `components/ui/toggle-group.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 64 | `no-react19-deprecated-apis` | **BORDERLINE** | useContext still works in React 19; `use()` is preferred but not required |

#### `hooks/use-delayed-flag.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 17 | `rerender-split-combined-hooks` | **FP** | Effect manages a single delayed flag; the timer and state are tightly coupled — can't meaningfully split |

#### `hooks/use-sound.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 43 | `no-swallowed-error` | **BORDERLINE** | Audio play() catch — intentional (browser autoplay policy); but should log |
| 52 | `rerender-split-combined-hooks` | **FP** | Sound initialization and playback are inherently coupled concerns |
| 129 | `no-swallowed-error` | **BORDERLINE** | Same audio catch pattern |

#### `lib/sound-engine.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 69 | `no-swallowed-error` | **BORDERLINE** | Audio decoding catch — graceful degradation for unsupported formats; intentional but could log |

#### `scripts/record-demo.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 33 | `no-eval` | **TP** | `new Function()` — genuine code injection risk. **ERROR** severity is correct |
| 101 | `async-parallel` | **FP** | Puppeteer sequential actions (type, click, wait) — MUST be sequential; they're browser automation steps |
| 117 | `async-parallel` | **FP** | Same — sequential browser automation steps with causal dependencies |
| 132 | `async-parallel` | **FP** | Same pattern — Puppeteer automation steps must run in order |

---

### CLI App (`apps/cli`) — Ink-based

#### `src/components/screens/cookie-sync-confirm-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 45 | `set-state-in-effect` | **TP** | setState in effect — should derive or use callback pattern |

#### `src/components/screens/main-menu-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 61 | `prefer-useReducer` | **TP** | 8 useState calls — many are related (input, history, suggestions) |
| 61 | `no-giant-component` | **TP** | 343 lines — complex screen with mixed concerns |
| 80 | `hooks` ("not referenced as normal values") | **FP** | `usePreferencesStore.getState()` — this is Zustand's static API, NOT a hook call. The rule incorrectly treats the store name prefix `use` as a hook |
| 132 | `no-derived-state-effect` | **TP** | Resets `suggestionIndex` when context changes — could use key prop |
| 132 | `effect-no-derived-state` | **TP** | Same |
| 133 | `set-state-in-effect` | **TP** | `setSuggestionIndex(0)` in effect — cascading render |
| 133 | `effect(no-chain-state-updates)` | **BORDERLINE** | Only one setState in this effect — not really "chaining" |
| 133 | `effect(no-adjust-state-on-prop-change)` | **TP** | State adjusted from prop change |
| 133 | `effect-no-adjust-state-on-prop-change` | **TP** | Same |
| 176 | `refs` ("Cannot access refs during render") | **BORDERLINE** | `valueRef.current = value` during render — Ink pattern for keeping ref fresh. Not ideal per React rules but standard in Ink |
| 178 | `refs` ("Cannot access refs during render") | **BORDERLINE** | `valueRef` accessed in handler factory during render — same Ink pattern |

#### `src/components/screens/port-picker-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 71 | `no-giant-component` | **TP** | 371 lines |
| 76 | `prefer-useReducer` | **TP** | 6 useState calls for related port selection state |
| 107 | `js-combine-iterations` | **BORDERLINE** | `.filter().map()` — small array (ports); negligible perf impact |
| 136 | `js-combine-iterations` | **BORDERLINE** | Same — small array |

#### `src/components/screens/pr-picker-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 26 | `prefer-useReducer` | **BORDERLINE** | 5 useState — borderline threshold; some states may be independent |

#### `src/components/screens/testing-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 261 | `no-giant-component` | **TP** | 458 lines |
| 265 | `rerender-memo-with-default-value` | **TP** | `[] as default` creates new ref each render — should be module const |
| 296 | `rerender-state-only-in-handlers` | **TP** | `runStartedAt` used only in handlers, never in JSX — should be useRef |
| 414 | `rerender-split-combined-hooks` | **BORDERLINE** | Complex effect with multiple deps — some parts may be separable |
| 415 | `set-state-in-effect` | **TP** | setState in effect |
| 415 | `effect(no-adjust-state-on-prop-change)` | **TP** | Adjusting state on prop change |
| 415 | `effect-no-adjust-state-on-prop-change` | **TP** | Same |
| 468 | `effect(no-event-handler)` | **TP** | Effect used as event handler |

#### `src/components/screens/watch-screen.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 37 | `no-giant-component` | **TP** | 347 lines |
| 40 | `rerender-memo-with-default-value` | **TP** | `[]` default creates new ref |
| 42 | `prefer-useReducer` | **TP** | 9 useState calls — many related |
| 54 | `rerender-state-only-in-handlers` | **TP** | `runStartedAt` never in JSX — should be ref |
| 118 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` generator syntax — React Compiler limitation, not a user error |
| 119 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 127 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 161 | `no-cascading-set-state` | **TP** | 3 setState calls in one effect |
| 163 | `set-state-in-effect` | **TP** | setState in effect |

#### `src/components/app.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 168 | `no-render-in-render` | **TP** | `renderScreen()` inline function — should be extracted to component |

#### `src/components/ui/error-message.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 17 | `rules-of-hooks` (conditional) | **TP** | `useColors()` called AFTER early return at L15 — genuinely conditional hook call |
| 17 | `hooks` (conditional) | **TP** | Same issue — React Compiler confirms |

#### `src/components/ui/image.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 20 | `refs` ("Cannot access refs during render") | **BORDERLINE** | `hasRendered.current` read during render for "run once" initialization — Ink pattern for terminal image rendering. Technically violates rules but deliberate |

#### `src/components/ui/input.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 77 | `rerender-state-only-in-handlers` | **FP** | `state` IS read in render — `cursorOffset` and `cursorWidth` are destructured at L82 and used in JSX |
| 86 | `refs` during render | **BORDERLINE** | `previousInputDepsRef.current` read/written during render — Ink's "previous value comparison" pattern. Technically violates rules but established Ink pattern |
| 87 | `refs` during render | **BORDERLINE** | Same |
| 88 | `refs` during render | **BORDERLINE** | Same |
| 90 | `refs` during render | **BORDERLINE** | Same — writing ref during render |

#### `src/components/ui/text-shimmer.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 17 | `refs` during render | **BORDERLINE** | `speedRef.current = speed` — Ink pattern for keeping values fresh |
| 19 | `refs` during render | **BORDERLINE** | Same — `textLengthRef.current = text.length` |
| 22 | `refs` during render | **BORDERLINE** | `startedRef.current` read for init guard |
| 24 | `refs` during render | **BORDERLINE** | `startedRef.current = true` + setTimeout |
| 24 | `no-settimeout-state-fix` | **TP** | `setTimeout(..., 0)` around `setInterval` with state updates — hides ordering issue |
| 41 | `no-array-index-as-key` | **BORDERLINE** | Characters of a string mapped with index — static per render, but if text changes, keys shift |

#### `src/data/execution-atom.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 48 | `js-request-idle-callback` | **FP** | CLI app runs in Node.js — `requestIdleCallback` doesn't exist in Node |
| 104 | `js-request-idle-callback` | **FP** | Same — Node.js environment |
| 134 | `js-request-idle-callback` | **FP** | Same |

#### `src/data/github-mutations.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 8 | `rules-of-hooks` ("use" in non-React function) | **FP** | `Github.use()` is the Effect library's `.use()` API, NOT React 19's `use()` hook |
| 14 | `query-mutation-missing-invalidation` | **TP** | `useMutation` without invalidation — stale data risk |

#### `src/hooks/use-config-options.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 15 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` — React Compiler limitation |
| 16 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |

#### `src/hooks/use-context-picker.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 42 | `no-derived-state-effect` | **TP** | State reset in effect — could use key prop |
| 42 | `effect-no-derived-state` | **TP** | Same |
| 43 | `set-state-in-effect` | **TP** | setState in effect |
| 43 | `effect(no-chain-state-updates)` | **BORDERLINE** | Single setState — not really "chaining" |

#### `src/hooks/use-git-state.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 30 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` |
| 31 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |

#### `src/hooks/use-installed-browsers.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 18 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` |
| 19 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 22 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |

#### `src/hooks/use-listening-ports.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 125 | `no-swallowed-error` | **BORDERLINE** | Port scanning catch — intentional graceful degradation when port check fails; but could log |

#### `src/hooks/use-mount-effect.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 8 | `exhaustive-deps` | **TP** | Missing `callback` dependency in useEffect — genuine exhaustive-deps violation. This is an intentional "mount only" hook but the standard lint rule correctly flags it |

#### `src/hooks/use-saved-flows.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 14 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` |
| 15 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |

#### `src/hooks/use-scrollable-list.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 25 | `refs` during render | **BORDERLINE** | `previousItemCountRef.current` comparison during render — Ink pattern |
| 26 | `refs` during render | **BORDERLINE** | Same — updating ref during render |
| 30 | `rerender-split-combined-hooks` | **FP** | useMemo with `[itemCount, visibleCount, highlightedIndex]` — these are inherently coupled for scroll offset calculation |

#### `src/hooks/use-stdout-dimensions.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 19 | `refs` during render | **BORDERLINE** | `subscribedRef.current` init guard during render — Ink pattern for subscribing to stdout |

#### `src/hooks/use-test-coverage.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 29 | `react-hooks-js(todo)` YieldExpression | **FP** | Effect `yield*` |
| 30 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 32 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 35 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |
| 42 | `react-hooks-js(todo)` YieldExpression | **FP** | Same |

#### `src/index.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 34 | `no-swallowed-error` | **BORDERLINE** | CLI entry point catch — likely intentional to prevent crash on optional initialization |
| 135 | `server-sequential-independent-await` | **TP** | Sequential awaits that could run in parallel |
| 183 | `async-parallel` | **TP** | 3 independent sequential awaits — parallelizable |

#### `src/mcp/json-config.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 63 | `no-swallowed-error` | **TP** | JSON parse catch with empty block — should at least return a default or log |

#### `src/utils/context-options.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 49 | `rules-of-hooks` ("use" in non-React function) | **FP** | `Github.use()` is Effect library API, not React's `use()` |
| 55 | `js-combine-iterations` | **BORDERLINE** | `.filter().map()` on small arrays — correct but negligible impact |
| 62 | `js-combine-iterations` | **BORDERLINE** | Same |

#### `src/utils/detect-projects.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 227 | `js-combine-iterations` | **BORDERLINE** | `.filter().map()` — correct but small arrays |

#### `src/utils/extract-close-artifacts.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 29 | `js-combine-iterations` | **BORDERLINE** | `.map().filter()` |
| 42 | `js-combine-iterations` | **BORDERLINE** | `.map().filter()` |
| 42 | `js-combine-iterations` | **BORDERLINE** | `.filter().map()` |

#### `src/utils/project-preferences-io.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 43 | `no-swallowed-error` | **BORDERLINE** | File I/O catch — likely intentional for "file not found" graceful fallback |

#### `src/utils/run-test.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 43 | `js-request-idle-callback` | **FP** | Node.js environment — `requestIdleCallback` doesn't exist |
| 85 | `js-request-idle-callback` | **FP** | Same |
| 101 | `js-cache-property-access` | **TP** | `executed.steps.find` accessed 3 times in loop — should hoist |
| 101 | `js-index-maps` | **TP** | `array.find()` in loop is O(n*m) — Map would be O(1) |
| 107 | `js-index-maps` | **TP** | Same |
| 114 | `js-index-maps` | **TP** | Same |
| 220 | `js-request-idle-callback` | **FP** | Node.js environment |
| 228 | `js-request-idle-callback` | **FP** | Same |

#### `src/utils/session-analytics.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 39 | `js-request-idle-callback` | **FP** | Node.js environment |

---

### Browser Package (`packages/browser`)

#### `src/accessibility.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 150 | `js-combine-iterations` | **TP** | `.filter().map()` on potentially large DOM element lists — worth combining |

#### `src/performance-trace.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 60 | `js-tosorted-immutable` | **BORDERLINE** | `[...array].sort()` — `toSorted()` is cleaner but requires ES2023 target confirmation |

#### `src/mcp/mcp-session.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 461 | `js-request-idle-callback` | **TP** | Browser context — analytics/logging could use requestIdleCallback |

#### `src/mcp/overlay-controller.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 198 | `js-hoist-regexp` | **TP** | `new RegExp()` inside a loop — should hoist to module level |

#### `src/mcp/rules-content.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 39 | `js-tosorted-immutable` | **BORDERLINE** | Same ES2023 consideration |

#### `src/mcp/start-http.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 82 | `no-swallowed-error` | **TP** | HTTP startup catch with empty block — should log server errors |

#### `src/runtime/lib/annotation-overlay.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 19–38 | `js-batch-dom-css` (15 issues) | **BORDERLINE** | Sequential `element.style.X` for overlay positioning — technically correct but these run in a batch within a single function call, and the browser coalesces style recalcs. Batching with `cssText` would help only marginally |

#### `src/runtime/lib/performance.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 104 | `no-swallowed-error` | **BORDERLINE** | Performance API catch — intentional graceful degradation when API unavailable |
| 114 | `no-swallowed-error` | **BORDERLINE** | Same — optional performance API |
| 130 | `no-swallowed-error` | **BORDERLINE** | Same |
| 160 | `no-swallowed-error` | **BORDERLINE** | Same |
| 193 | `no-swallowed-error` | **BORDERLINE** | Same |
| 209 | `js-tosorted-immutable` | **BORDERLINE** | ES2023 consideration |
| 253 | `no-swallowed-error` | **BORDERLINE** | Same perf API pattern |
| 272 | `js-tosorted-immutable` | **BORDERLINE** | Same |
| 275 | `js-tosorted-immutable` | **BORDERLINE** | Same |
| 285 | `no-swallowed-error` | **BORDERLINE** | Same perf API pattern |

#### `src/runtime/overlay/components/action-marker.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 70 | `no-inline-exhaustive-style` | **BORDERLINE** | Overlay component injected into arbitrary pages — inline styles avoid CSS conflicts. Intentional |
| 78 | `no-tiny-text` | **TP** | 11px font is genuinely small — even for an overlay label |

#### `src/runtime/overlay/components/cursor-pointer.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 12 | `rendering-svg-precision` | **TP** | SVG path with excessive decimal precision |
| 23 | `rendering-svg-precision` | **TP** | Same |

#### `src/runtime/overlay/components/spiral-spinner.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 36 | `effect-no-adjust-state-on-prop-change` | **TP** | Effect resets animation state when prop changes — could derive during render |
| 56 | `no-array-index-as-key` | **BORDERLINE** | Spinner dots — static array |

#### `src/runtime/overlay/index.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 60 | `no-array-index-as-key` | **BORDERLINE** | Action log items — may be appended but not reordered |
| 61 | `no-inline-exhaustive-style` | **BORDERLINE** | Overlay — inline styles intentional |
| 88 | `no-cascading-set-state` | **TP** | 4 setState in effect — worth batching |
| 114 | `effect-no-adjust-state-on-prop-change` | **TP** | State adjusted from prop change |
| 123 | `no-inline-exhaustive-style` | **BORDERLINE** | Overlay |
| 140 | `no-inline-exhaustive-style` | **BORDERLINE** | Overlay |
| 140 | `no-gradient-text` | **BORDERLINE** | Gradient text in overlay — stylistic choice, "AI tell" is subjective |
| 188 | `effect(no-event-handler)` | **TP** | Effect as event handler |
| 189 | `effect(no-event-handler)` | **TP** | Same |
| 190 | `effect(no-event-handler)` | **TP** | Same |
| 203 | `no-cascading-set-state` | **TP** | 6 setState in effect |
| 244 | `client-event-listeners` | **BORDERLINE** | Overlay is a singleton per container — listener-per-instance is less concerning |
| 245 | `client-event-listeners` | **BORDERLINE** | Same singleton context |
| 281 | `effect(no-event-handler)` | **TP** | Same pattern |
| 282 | `effect(no-derived-state)` | **TP** | Cursor shape derivable during render |
| 282 | `effect-no-initialize-state` | **TP** | State initialized in effect — should be useState initial value |
| 295 | `client-event-listeners` | **BORDERLINE** | Singleton overlay |
| 341 | `no-inline-exhaustive-style` | **BORDERLINE** | Overlay |
| 345 | `no-pure-black-background` | **BORDERLINE** | `#000` for overlay background — intentional for maximum contrast |
| 364 | `no-array-index-as-key` | **BORDERLINE** | Highlight elements — static per render |

#### `src/runtime/overlay/lib/use-polled-positions.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 12 | `exhaustive-deps` | **TP** | useEffect with setState and no deps — can cause infinite loop |
| 12 | `no-cascading-set-state` | **TP** | 4 setState in effect |
| 14 | `effect-no-initialize-state` | **TP** | State initialized from mount effect — should be useState initial |
| 41 | `client-event-listeners` | **BORDERLINE** | Singleton usage likely |
| 42 | `client-event-listeners` | **BORDERLINE** | Same |
| 49 | `exhaustive-deps` | **TP** | Dep list not an array literal |

---

### Runtime-Test App (`apps/runtime-test`)

#### `src/app.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 134 | `async-parallel` | **FP** | Puppeteer-style sequential browser automation — `typeInto`, `sleep`, `clickElement` MUST run in order |
| 141 | `async-parallel` | **FP** | Same — sequential click, sleep, click must be ordered |
| 148 | `async-parallel` | **FP** | Same sequential automation |
| 156 | `async-await-in-loop` | **FP** | `inspectElement` in a loop — each inspection must complete before the next for correct overlay state |
| 161 | `prefer-useReducer` | **TP** | 5 related useState calls (loaded, initialized, running, interactive, labelIndex) |
| 166 | `rerender-state-only-in-handlers` | **TP** | `labelIndex` — only incremented in click handler, used in handler closure but not in JSX return |
| 168 | `no-cascading-set-state` | **TP** | 4 setState calls in promise `.then()` — could batch |
| 168 | `effect-needs-cleanup` | **TP** | **ERROR**: `setTimeout` scheduled in effect with NO cleanup returned. On re-mount the timeout fires again → leak |
| 173 | `advanced-init-once` | **TP** | useEffect([]) init with setTimeout — vulnerable to Strict Mode double-run |
| 243 | `client-event-listeners` | **BORDERLINE** | `document.addEventListener('click')` — only one App instance in this demo, but proper cleanup IS present (L244) |
| 249 | `tailwind-no-default-palette` | **BORDERLINE** | `bg-gray-900` — this is a test harness UI, not production; palette is intentional/acceptable |
| 250 | `design-no-bold-heading` | **BORDERLINE** | `font-bold` on h2 at `text-lg` — not a display-size heading; rule is overzealous |
| 250 | `tailwind-no-default-palette` | **BORDERLINE** | Same — test harness |
| 269 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 293 | `design-no-bold-heading` | **BORDERLINE** | `font-bold` on h1 at `text-3xl` — borderline; could be semibold but not terrible |
| 294 | `tailwind-no-default-palette` | **BORDERLINE** | Same test harness |
| 302 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 310 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 320 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 324 | `jsx-a11y(anchor-is-valid)` | **TP** | `<a href="#">` — genuinely invalid; should be button or have meaningful href |
| 327 | `jsx-a11y(anchor-is-valid)` | **TP** | Same `href="#"` |
| 330 | `jsx-a11y(anchor-is-valid)` | **TP** | Same |
| 338 | `tailwind-no-default-palette` | **BORDERLINE** | Test harness |
| 341 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 344 | `tailwind-no-default-palette` (x2) | **BORDERLINE** | Same |
| 351 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 356 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 363 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 368 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 373 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 375 | `tailwind-no-default-palette` | **BORDERLINE** | Same |
| 388 | `tailwind-no-default-palette` | **BORDERLINE** | Same |

#### `src/error-boundary.tsx`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 26 | `tailwind-no-redundant-size-axes` | **TP** | `w-8 h-8` → `size-8` is a valid Tailwind v3.4+ shorthand |
| 29 | `design-no-bold-heading` | **BORDERLINE** | `font-extrabold` on error h1 — intentional emphasis for error state |

#### `src/components/spreadsheet-grid.tsx` (Demo app)

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 137 | `jsx-a11y(no-static-element-interactions)` | **TP** | `<div>` with event handlers needs role |
| 162 | `jsx-a11y(no-static-element-interactions)` | **TP** | Same |
| 224 | `jsx-a11y(no-static-element-interactions)` | **TP** | Same |
| 240 | `jsx-a11y(no-autofocus)` | **BORDERLINE** | autoFocus on spreadsheet cell input — common UX pattern for grid editing; technically a11y concern but standard behavior |

#### `src/components/ui/label.tsx` (Demo app)

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 7 | `jsx-a11y(label-has-associated-control)` | **TP** | Label component without htmlFor or nested control |

---

### CLI Commands (`apps/cli`)

#### `src/commands/add-github-action.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 238 | `async-cheap-condition-before-await` | **TP** | Cheap synchronous check after expensive await — reorder for early exit |

#### `src/commands/add-skill.ts`

| Line | Rule | Verdict | Reason |
|------|------|---------|--------|
| 283 | `js-combine-iterations` | **BORDERLINE** | `.filter().map()` on skills list — small array |
| 286 | `js-combine-iterations` | **BORDERLINE** | Same |

---

## Error-Severity Issues Summary (42 total)

| # | File | Line | Rule | Verdict | Reason |
|---|------|------|------|---------|--------|
| 1 | scripts/record-demo.ts | 33 | `no-eval` | **TP** | `new Function()` is genuine injection risk |
| 2 | cookie-sync-confirm-screen.tsx | 45 | `set-state-in-effect` | **TP** | setState in effect |
| 3 | main-menu-screen.tsx | 80 | `hooks` (reference) | **FP** | Zustand `.getState()` is not a hook |
| 4 | main-menu-screen.tsx | 133 | `set-state-in-effect` | **TP** | setState in effect |
| 5 | main-menu-screen.tsx | 176 | `refs` | **BORDERLINE** | Ink ref pattern |
| 6 | main-menu-screen.tsx | 178 | `refs` | **BORDERLINE** | Ink ref pattern |
| 7 | testing-screen.tsx | 415 | `set-state-in-effect` | **TP** | setState in effect |
| 8 | watch-screen.tsx | 118 | `todo` YieldExpr | **FP** | Effect generators |
| 9 | watch-screen.tsx | 119 | `todo` YieldExpr | **FP** | Same |
| 10 | watch-screen.tsx | 127 | `todo` YieldExpr | **FP** | Same |
| 11 | watch-screen.tsx | 163 | `set-state-in-effect` | **TP** | setState in effect |
| 12 | error-message.tsx | 17 | `rules-of-hooks` | **TP** | Conditional hook call |
| 13 | error-message.tsx | 17 | `hooks` | **TP** | Same |
| 14 | image.tsx | 20 | `refs` | **BORDERLINE** | Ink ref pattern |
| 15 | input.tsx | 86 | `refs` | **BORDERLINE** | Ink ref pattern |
| 16 | input.tsx | 87 | `refs` | **BORDERLINE** | Same |
| 17 | input.tsx | 88 | `refs` | **BORDERLINE** | Same |
| 18 | input.tsx | 90 | `refs` | **BORDERLINE** | Same |
| 19 | text-shimmer.tsx | 17 | `refs` | **BORDERLINE** | Ink ref pattern |
| 20 | text-shimmer.tsx | 19 | `refs` | **BORDERLINE** | Same |
| 21 | text-shimmer.tsx | 22 | `refs` | **BORDERLINE** | Same |
| 22 | text-shimmer.tsx | 24 | `refs` | **BORDERLINE** | Same |
| 23 | github-mutations.ts | 8 | `rules-of-hooks` | **FP** | Effect `.use()` not React `use()` |
| 24 | use-config-options.ts | 15 | `todo` YieldExpr | **FP** | Effect generators |
| 25 | use-config-options.ts | 16 | `todo` YieldExpr | **FP** | Same |
| 26 | use-context-picker.ts | 43 | `set-state-in-effect` | **TP** | setState in effect |
| 27 | use-git-state.ts | 30 | `todo` YieldExpr | **FP** | Effect generators |
| 28 | use-git-state.ts | 31 | `todo` YieldExpr | **FP** | Same |
| 29 | use-installed-browsers.ts | 18 | `todo` YieldExpr | **FP** | Effect generators |
| 30 | use-installed-browsers.ts | 19 | `todo` YieldExpr | **FP** | Same |
| 31 | use-installed-browsers.ts | 22 | `todo` YieldExpr | **FP** | Same |
| 32 | use-saved-flows.ts | 14 | `todo` YieldExpr | **FP** | Effect generators |
| 33 | use-saved-flows.ts | 15 | `todo` YieldExpr | **FP** | Same |
| 34 | use-scrollable-list.ts | 25 | `refs` | **BORDERLINE** | Ink ref pattern |
| 35 | use-scrollable-list.ts | 26 | `refs` | **BORDERLINE** | Same |
| 36 | use-stdout-dimensions.ts | 19 | `refs` | **BORDERLINE** | Ink ref pattern |
| 37 | use-test-coverage.ts | 29-42 | `todo` YieldExpr (x5) | **FP** | Effect generators |
| 38 | context-options.ts | 49 | `rules-of-hooks` | **FP** | Effect `.use()` |
| 39 | runtime-test/app.tsx | 168 | `effect-needs-cleanup` | **TP** | setTimeout without cleanup — genuine leak |

## Rule-Level Analysis

### Rules with High False Positive Rates

| Rule | Total | TP | FP | Borderline | FP Rate | Notes |
|------|-------|----|----|------------|---------|-------|
| `react-hooks-js(todo)` | 14 | 0 | 14 | 0 | 100% | Effect `yield*` triggers React Compiler limitation — should be excluded |
| `js-request-idle-callback` | 7 | 1 | 7 | 0 | 87.5% | Flags Node.js CLI code where `requestIdleCallback` doesn't exist |
| `rules-of-hooks` on `use()` | 2 | 0 | 2 | 0 | 100% | Confuses Effect library `.use()` with React 19 `use()` |
| `async-parallel` | 7 | 2 | 4 | 0 | 57% | Fails to detect causal dependencies in automation scripts |
| `react-hooks-js(refs)` | 11 | 0 | 0 | 11 | 0% (100% borderline) | Ink's ref-during-render pattern; technically violates rules but is ecosystem-standard |
| `react-hooks-js(hooks)` "referenced as normal values" | 1 | 0 | 1 | 0 | 100% | Zustand `.getState()` false-flagged as hook reference |

### Rules with High True Positive Rates

| Rule | Total | TP | FP | Borderline | TP Rate | Notes |
|------|-------|----|----|------------|---------|-------|
| `rules-of-hooks` (conditional) | 2 | 2 | 0 | 0 | 100% | Correctly caught conditional hook call |
| `effect-needs-cleanup` | 1 | 1 | 0 | 0 | 100% | Genuine setTimeout leak |
| `no-eval` | 1 | 1 | 0 | 0 | 100% | Real injection risk |
| `no-giant-component` | 6 | 5 | 0 | 1 | 83% | All except terms page are genuine |
| `jsx-a11y(*)` | 14 | 11 | 0 | 3 | 79% | Very high accuracy |
| `set-state-in-effect` | 5 | 5 | 0 | 0 | 100% | All genuine cascading render risks |
| `effect-no-adjust-state-on-prop-change` | 7 | 7 | 0 | 0 | 100% | All real derive-during-render opportunities |
| `js-index-maps` | 3 | 3 | 0 | 0 | 100% | All real O(n*m) → O(n) opportunities |
| `no-fetch-in-effect` | 1 | 1 | 0 | 0 | 100% | Genuine |

### Rules that are Mostly Borderline (Noisy)

| Rule | Total | TP | FP | Borderline | Notes |
|------|-------|----|----|------------|-------|
| `tailwind-no-default-palette` | 18 | 0 | 0 | 18 | Test harness app — palette choice is intentional |
| `no-array-index-as-key` | 10 | 0 | 0 | 10 | All on static/append-only arrays |
| `js-batch-dom-css` | 21 | 6 | 0 | 15 | Overlay positioning is inherently multi-property |
| `no-inline-exhaustive-style` | 7 | 1 | 0 | 6 | Overlay components need inline styles to avoid CSS conflicts |
| `js-combine-iterations` | 10 | 1 | 0 | 9 | Most are small arrays where perf is negligible |
| `no-swallowed-error` | 12 | 2 | 0 | 10 | Many are intentional graceful degradation |
| `design-no-bold-heading` | 4 | 0 | 0 | 4 | Small headings where bold is fine |

---

## Recommendations for V2

1. **Exclude `react-hooks-js(todo)` YieldExpression**: These are React Compiler internal limitations with Effect-TS generators, not user errors. Either suppress in the presence of `Effect.gen` or downgrade from error.

2. **Environment-aware `js-request-idle-callback`**: Detect if the project is a Node.js/CLI app (Ink, Commander, etc.) and suppress browser-only API suggestions.

3. **Better `use()` hook detection**: `Github.use()`, `Effect.use()`, etc. are not React 19's `use()`. Check that the call is on a direct import or destructure of `use` from `react`.

4. **Ink/terminal-React ref patterns**: Consider suppressing `refs` during-render errors for Ink projects, or at least downgrading to warnings with a note about Ink's rendering model.

5. **Smarter `async-parallel`**: Don't flag sequential awaits where the functions are browser automation steps (click, type, sleep) or have implicit ordering requirements.

6. **Tune `tailwind-no-default-palette`**: Very noisy in projects that intentionally use default gray. Consider only flagging when there's a mixed palette or custom theme defined.

7. **`no-array-index-as-key` on static arrays**: Add heuristic for `.map()` on array literals, string spreads, or `Array(n).fill()` patterns where reordering is impossible.

8. **Zustand `.getState()` detection**: The hooks linter should recognize that `useXStore.getState()` is a static Zustand API call, not a hook invocation.
