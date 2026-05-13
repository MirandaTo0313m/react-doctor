# react-doctor v2 Deep Validation Report

Generated: 2026-05-13T07:43:14.425Z

## Scope

Validated 528 repositories cloned under `/tmp/react-doctor-v2-validation/repos/<owner>__<repo>`.

Requested command:

`node packages/react-doctor-v2/bin/react-doctor.js <repo-path> --json --json-compact --offline --yes --full --no-dead-code --fail-on none`

The current CLI rejects `--yes --full` together with `Cannot combine --yes and --full; pick one.` Raw collection therefore used the accepted full-scan equivalent:

`node packages/react-doctor-v2/bin/react-doctor.js <repo-path> --json --json-compact --offline --full --no-dead-code --fail-on none`

## Aggregate Results

- Raw diagnostics: 483758
- Structured validation findings: 24023
- True positives: 16371
- False positives: 613
- Borderline: 6865
- Missed issues: 174
- Per-repo markdown reports read: 528
- Per-repo findings JSON files read: 528

## Fixes Implemented In This Pass

- `packages/react-doctor-v2/src/core/diagnostics.ts`: filters React `no-unknown-property` only for Satori `tw` props in OG/ImageResponse contexts, Emotion `css` props in Emotion files, and styled-jsx `<style jsx>` while reusing cached source reads.
- `packages/react-doctor-v2/src/core/rules/lint/nextjs/nextjs-no-img-element.ts`: skips only `data:`, `blob:`, `.svg`, and `favicon.ico` sources so raster logos/badges still get `next/image` guidance.
- `packages/react-doctor-v2/src/core/rules/lint/server/server-serialization.ts`: keeps the serialization rule scoped to App Router files via `APP_ROUTER_FILE_PATTERN` instead of broad `/app/` path matches.
- `packages/react-doctor-v2/src/core/rules/lint/security/no-secrets-in-client-code.ts`: skips benign URL literals but still inspects URLs with credential-like query params or basic-auth credentials; keeps test/fixture suppression with typed empty visitors.
- `packages/react-doctor-v2/src/core/rules/lint/performance/rendering-hydration-mismatch-time.ts`: preserves test/fixture suppression with typed empty visitors, avoiding visitor-shape type errors.

## Top False-Positive Categories

- `react-doctor/no-icon-only-button-without-label` (29 FP):
  - `AykutSarac/jsoncrack.com` `apps/www/src/features/modals/NodeModal/index.tsx:40`: Mantine's CloseButton component provides an accessible close label by default; the JSX wrapper does not need an explicit aria-label at this call site.
  - `ChatGPTNextWeb/NextChat` `app/components/auth.tsx:53`: Grouped 95 diagnostics where the project passes accessible-name props such as text, title, or aria to its IconButton wrapper. IconButton renders visible text and aria-label/title on a real button, but the rule only checks aria-label/aria-la
  - `RhysSullivan/executor` `apps/cloud/src/web/shell.tsx:460`: `<SupportButton />` is an opaque wrapper at the call site, but its implementation renders a `Button` with visible text `Get support`.
- `react-doctor/async-await-in-loop` (28 FP):
  - `BlackHatDevX/openspot-music-app` `components/FullScreenPlayer.tsx:399`: Grouped 12 diagnostics. The await appears intentionally ordered, delayed, transactional, or rate-limited, so parallelizing would change behavior.
  - `BradGroux/veritas-kanban` `src/components/settings/tabs/ManageTab.tsx:78`: Grouped 3 diagnostics. The await appears intentionally ordered, delayed, transactional, or rate-limited, so parallelizing would change behavior.
  - `KittyCAD/modeling-app` `src/lib/commandBarConfigs/applicationCommandConfig.ts:79`: Grouped 31 diagnostics. The await appears intentionally ordered, delayed, transactional, or rate-limited, so parallelizing would change behavior. Representative source: src/lib/commandBarConfigs/applicationCommandConfig.ts:79 `const code =
- `react-hooks/rules-of-hooks` (16 FP):
  - `PostHog/posthog` `frontend/src/lib/lemon-ui/LemonBadge/LemonBadgeNumber.stories.tsx:14`: useState is inside a Storybook meta render callback. 702 of the 710 rules-of-hooks diagnostics are in .stories.tsx render functions, which Storybook invokes as component renderers even though the callback is syntactically anonymous.
  - `RhysSullivan/executor` `apps/cloud/src/auth/workos.ts:111`: The reported `use` calls are calls to a local helper declared in the same Effect service, not React's `use()` hook. The helper wraps WorkOS calls with service logging.
  - `RhysSullivan/executor` `apps/cloud/src/routes/sources.add.$pluginKey.tsx:16`: `Route.useParams()` and `Route.useSearch()` are called inside the TanStack Router `component` callback. That callback is a route component even though it is an anonymous object property.
- `react-hooks-js/todo` (16 reviewed):
  - `Fanzzzd/repo-wizard` `src/hooks/usePromptGenerator.ts:191`: Keep this enabled for React Compiler projects; these diagnostics identify code the compiler cannot currently lower and should be treated as compiler-compatibility findings.
  - `Fanzzzd/repo-wizard` `src/hooks/usePromptGenerator.ts:225`: Same React Compiler compatibility signal.
  - `Fanzzzd/repo-wizard` `src/hooks/useReviewSession.ts:31`: Same React Compiler compatibility signal.
- `react-doctor(no-icon-only-button-without-label)` (15 FP):
  - `AmanVarshney01/create-better-t-stack` `src/components/ui/select.tsx:89`: Grouped 5 diagnostics. The representative is a self-closing custom Button-like component usage; the rule cannot prove it is icon-only from this call site. Representative line: `<SelectScrollUpButton />`.
  - `PostHog/posthog` `frontend/src/scenes/web-analytics/tabs/marketing-analytics/frontend/components/MarketingAnalyticsFilters/ConversionGoalFilterButton.tsx:29`: The flagged icon-only LemonButton has tooltip="Save conversion goal". PostHog's LemonButton implementation maps a string tooltip to aria-label for native buttons, so this instance already has an accessible name at render time.
  - `Uniswap/interface` `src/app/features/home/PortfolioActionButtons.tsx:118`: <ActionButton Icon={<CoinConvert />} label={t('home.label.swap')} onClick={onSwapClick} /> — call site already supplies a label prop. The rule only checks aria-label/aria-labelledby and has no awareness of React Native accessibilityLabel or
- `react-doctor/rendering-hydration-mismatch-time` (14 FP):
  - `ChatGPTNextWeb/NextChat` `app/components/settings.tsx:173`: Date.now() is nested inside an onClick handler that creates a prompt after user interaction, not during JSX render or hydration.
  - `DaiYz/react-native-easy-chat-ui` `app/chat/ChatItem.js:66`: This is a React Native runtime; there is no SSR hydration. The rule is duplicating the random-key issue at the same line.
  - `Grashjs/cmms` `frontend (CRA) / mobile (Expo):1`: Same as hydration-no-flicker — applied to non-SSR projects.
- `react-hooks/exhaustive-deps` (13 FP):
  - `pingdotgg/t3code` `src/components/ChatView.tsx:1783`: The diagnostics ask for composerRef.current in dependency arrays. Mutable ref current values are not stable dependencies and should not generally be listed.
  - `plasmicapp/plasmic` `src/cart/use-add-item.tsx:67`: Represents 5 diagnostic(s). The reported source path could not be resolved in the checkout, so the diagnostic cannot be actioned without correcting path/root handling.
  - `plasmicapp/plasmic` `src/cart/use-remove-item.tsx:96`: Represents 4 diagnostic(s). The reported source path could not be resolved in the checkout, so the diagnostic cannot be actioned without correcting path/root handling.
- `react-doctor/server-serialization` (13 FP):
  - `ChatGPTNextWeb/NextChat` `app/components/chat.tsx:685`: Grouped 8 diagnostics in client-shell components reached from app/components/home.tsx, which has a use client directive. The rule treats child component files as server files because they lack a local directive.
  - `DaiYz/react-native-easy-chat-ui` `app/chat/components/pop-view/ActionPopover/ActionPopoverItem.js:55`: The rule pattern APP_DIRECTORY_PATTERN = /\/app\// matches any path containing /app/. This is a React Native package whose source lives in app/; there is no Next.js App Router, no use server/use client boundary, and no RSC serialization.
  - `OHIF/Viewers` `src/routes/WorkList/WorkList.tsx:586`: Grouped 4 diagnostic(s). The rule is specific to Next.js App Router server/client serialization, but this project was not detected as Next.js. Representative examples: src/routes/WorkList/WorkList.tsx:586 `tableDataSource={tableDataSource.s
- `react-doctor/no-secrets-in-client-code` (11 FP):
  - `RhysSullivan/executor` `apps/cloud/src/mcp-auth.node.test.ts:15`: `dynamicOAuthClientId` is a test fixture OAuth client id in a `.test.ts` file, not a secret embedded in client code.
  - `RocketChat/Rocket.Chat` `app/api/server/ApiClass.ts:1119`: tokenLocation is a Mongo field path string, not a hardcoded token secret. The rule matched the variable name rather than secret evidence in the value.
  - `baptisteArno/typebot.io` `apps/builder/src/features/blocks/integrations/openai/components/OpenAICredentialsDialog.tsx:16`: openAITokensPage is a public documentation URL to the OpenAI API keys page, not a hardcoded secret.
- `react-doctor/js-set-map-lookups` (10 FP):
  - `RhysSullivan/executor` `apps/cloud/scripts/dev-db.ts:37`: `cmd.includes("dev-db.ts")` is a substring check on a command string returned by `execSync`, not an array membership check in a loop.
  - `aidenybai/bippy` `packages/bippy/src/source/owner-stack.ts:203`: Grouped 3 diagnostics. The flagged `.includes()` calls are string substring checks (`sampleLines[sampleIndex].includes(...)`, `controlLines[controlIndex].includes(...)`, and `stackFrame.includes(...)`), not array membership inside a loop.
  - `aidenybai/react-grab` `packages/react-grab/e2e/fixtures.ts:1593`: Grouped 2 diagnostics. The arrays are small constant option-name lists in Playwright test support code, not performance-sensitive runtime collections.
- `effect/no-event-handler` (10 FP):
  - `AykutSarac/jsoncrack.com` `packages/jsoncrack-react/src/JSONCrackComponent.tsx:168`: Most reports from the external effect rule are on normal synchronization effects, ref mirrors, memoized collapse derivations, and layout coordination in JSONCrackComponent, not effects being used as user-event handlers.
  - `adrianhajdin/react_native-restate` `components/Search.tsx:1`: External plugin same misclassification.
  - `buildship-ai/rowy` `src/layouts/Navigation/NavDrawer/HelpMenu.tsx:22`: react-doctor and the upstream effect plugin both report the same effect locations, doubling counts. Several reports also flag subscription setup wrappers, not actual event handlers.
- `react-doctor/no-react19-deprecated-apis` (9 FP):
  - `Grashjs/cmms` `frontend (grash, React 17):1`: Frontend project is React 17.0.2. The rule's requires: ['react:19'] should exclude it but appears to fire anyway in monorepo per-file linting.
  - `aidenybai/bippy` `packages/website/providers/site-provider.tsx:1`: Grouped 7 `useContext` diagnostics. The rule implementation lists `useContext` as a React 19 deprecated API, but `useContext` remains a valid React API.
  - `aidenybai/react-scan` `kitchen-sink/src/examples/e2e-fixture/index.tsx:1`: The rule reports the React import of useContext, but React 19 has not deprecated useContext. The implementation's React 19 deprecated message table incorrectly lists useContext as superseded by use().
- `react-doctor/rerender-state-only-in-handlers` (9 FP):
  - `AykutSarac/jsoncrack.com` `apps/chrome-extension/src/content-script.tsx:306`: The state value JSONCrackComponent is read in render both as a loading guard and as a JSX component at lines 345-351, so replacing it with a ref would break rendering.
  - `aidenybai/bippy` `packages/website/components/copy-button.tsx:9`: `copied` is read through `const Icon = copied ? Check : Copy;`, and `<Icon />` is rendered. The state does affect render output.
  - `aidenybai/react-grab` `apps/website/components/grab-element-button.tsx:103`: Grouped 2 diagnostics. isMobile is read in guard returns in both GrabElementButton and InstallTabs, but the rule only considers identifiers reachable from returned JSX expressions.
- `react-hooks-js(todo)` (9 reviewed):
  - `DefiLlama/defillama-app` `src/containers/LlamaAI/index.tsx:2126`: Compiler `BuildHIR` notices are useful compatibility diagnostics when React Compiler is enabled.
  - `Expensify/App` `src/pages/ReimbursementAccount/USD/ConnectBankAccount/components/BankAccountValidationForm.tsx:72`: Keep these surfaced for compiler projects so teams can decide whether to refactor, suppress locally, or wait for compiler support.
  - `Uniswap/interface` `src/hooks/useUniswapXSwapCallback.ts:206`: `Support ThrowStatement inside of try/catch` is a React Compiler lowering signal, not a reason to disable the rule globally.
- `oxlint/unknown` (9 FP):
  - `Brainfock/Brainfock` `src/client/auth/login.react.js:59`: Parse errors (Unexpected token) on legacy 2016 JSX/Babel syntax that oxlint cannot parse. These are infra errors, not rule findings.
  - `RocketChat/Rocket.Chat` `definition/externals/meteor/meteor.d.ts:18`: The file is a Meteor TypeScript declaration augmentation. The duplicate Meteor namespace diagnostic is a tooling/framework compatibility issue, not a React Doctor finding.
  - `catalinmiron/react-native-dribbble-app` `app/helpers/api.js:15`: All 6 'Expected , or ) but found :' parse errors are in Flow-typed JS files (e.g. `function(type: string, pageNumber: ?number)`, `?Object`). The codebase predates TypeScript adoption and uses Flow annotations that the oxlint parser does not
- `react-doctor(no-react19-deprecated-apis)` (8 FP):
  - `PostHog/posthog` `products/tracing/frontend/TracingTabContext.tsx:1`: This product workspace declares peerDependencies.react as "\*", but the monorepo root pins React and React DOM to 18.3.1 through pnpm.overrides. react-doctor treated the unknown workspace React version as latest and enabled React 19-only dia
  - `Uniswap/interface` `src/app/features/onboarding/import/PasskeyImportContextProvider.tsx:1`: useContext is reported as 'superseded by use()'. useContext is a fully supported React 19 API; use() is an additional API for conditional reads. The deprecation message overstates React's API surface.
  - `bluesky-social/social-app` `src/state/threadgate-hidden-replies.tsx:1`: useContext flagged as 'superseded by use()'. useContext is not deprecated in React 19. Same FP class as onyx/Uniswap/posthog/typebot.
- `react-doctor/client-passive-event-listeners` (8 FP):
  - `better-auth/better-auth` `docs/components/ai-chat.tsx:348`: The wheel listener explicitly uses `{ passive: false }` because its handler calls `preventDefault()` to stop scroll chaining.
  - `bigint/hey` `src/hooks/usePreventScrollOnNumberInput.tsx:16`: The nearby handler calls preventDefault(), so blindly making this listener passive would change behavior. Source: input.addEventListener("wheel", preventScroll, { passive: false });
  - `excalidraw/excalidraw` `packages/excalidraw/index.tsx:160`: The touchmove listener explicitly uses passive: false because the handler calls event.preventDefault() to block iOS pinch zoom. Adding passive: true would break the behavior.
- `react-doctor/nextjs-no-img-element` (8 FP):
  - `baptisteArno/typebot.io` `packages/ui/src/components/IconPicker.tsx:312`: packages/ui is a reusable component library incorrectly detected as a Next.js app because it depends on next. It should not be forced to use next/image.
  - `betterlytics/betterlytics` `src/components/icons/BrowserIcon.tsx:31`: A Next.js-specific diagnostic appears outside an identifiable Next.js project/file context. Source: (source line unavailable)
  - `karakeep-app/karakeep` `components/public/lists/PublicBookmarkGrid.tsx:51`: 2 diagnostic(s) in generated. `nextjs-no-img-element` is a Next.js-specific rule, but this project was not detected as Next.js and no Next dependency/config is present. Representative examples: `components/public/lists/PublicBookmarkGrid.ts
- `react-doctor/async-parallel` (7 FP):
  - `ChatGPTNextWeb/NextChat` `app/components/realtime-chat/realtime-chat.tsx:249`: commitAudio(), handleInputAudio(inputAudio), and generateResponse() are causally dependent; handleInputAudio consumes the first awaited result and response generation should follow commit/processing.
  - `OneKeyHQ/app-monorepo` `development/perf-ci/run-android-perf-detox.js:215`: Grouped 13 diagnostic(s). The awaited operations are in test/demo, polling, animation, stream, or user-interaction code where sequencing is intentional. Representative examples: development/perf-ci/run-android-perf-detox.js:215 `const devic
  - `millionco/expect` `apps/cli/src/index.tsx:183`: Lines 183: These awaits are causally ordered browser/CLI automation steps or depend on earlier results; running them in Promise.all would change behavior.
- `react-doctor(server-serialization)` (7 FP):
  - `TeXlyre/texlyre` `src/components/app/EditorApp.tsx:720`: No React Server Components in this Vite SPA — there is no server boundary to serialize across.
  - `appsmithorg/appsmith` `src/components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData.tsx:106`: Appsmith is a React 17 SPA built with create-react-app/scripts/start.js (no SSR, no React Server Components). The rule message ('spreading server data into a client boundary can serialize unused fields') framing has no cost model that appli
  - `getsentry/sentry` `static/app/views/explore/components/schemaHints/schemaHintsList.spec.tsx:49`: 3169 grouped diagnostic(s). False positive: rule uses APP_DIRECTORY_PATTERN=/\/app\// and treats Sentry static/app as a Next App Router server-component tree; repo has no next.config.\* and uses Rspack/React Router.

## Recommendation Mix

| Recommendation                         | Findings |
| -------------------------------------- | -------: |
| Keep rule                              |    21870 |
| improve rule logic                     |      791 |
| improve ignore/generated-file handling |      580 |
| improve project/framework detection    |      341 |
| Improve rule logic                     |      213 |
| add missing detection                  |      156 |
| Improve project/framework detection    |       48 |
| Improve ignore/generated-file handling |       17 |
| Add missing detection                  |        7 |

## Rule Reliability Notes

| Rule                                              | Findings |  TP |  FP | Borderline | Missed |
| ------------------------------------------------- | -------: | --: | --: | ---------: | -----: |
| `react-doctor/tailwind-no-default-palette`        |     1074 |   1 |   0 |       1073 |      0 |
| `react-doctor/tailwind-no-redundant-size-axes`    |      716 |  18 |   0 |        698 |      0 |
| `react-doctor/no-array-index-as-key`              |      562 |  64 |   1 |        481 |     16 |
| `react-doctor/tailwind-no-space-on-flex-children` |      263 |   6 |   0 |        257 |      0 |
| `react-doctor/client-event-listeners`             |      264 |  63 |   4 |        193 |      4 |
| `react-doctor/js-combine-iterations`              |      504 | 305 |   5 |        193 |      1 |
| `react-doctor/prefer-useReducer`                  |      274 |  93 |   0 |        181 |      0 |
| `react-doctor/no-react19-deprecated-apis`         |      207 |  28 |   9 |        170 |      0 |
| `react-doctor/design-no-bold-heading`             |      154 |   1 |   0 |        153 |      0 |
| `react-doctor/react-compiler-destructure-method`  |      155 |  15 |   0 |        140 |      0 |
| `react-doctor/server-serialization`               |      162 |  27 |  13 |        122 |      0 |
| `react-doctor/rendering-svg-precision`            |      192 |  84 |   4 |        103 |      1 |
| `react-doctor/no-inline-exhaustive-style`         |      117 |  11 |   0 |        106 |      0 |
| `react-doctor/no-full-lodash-import`              |      266 | 162 |   5 |         96 |      3 |
| `react-doctor/no-barrel-import`                   |      129 |  32 |   6 |         91 |      0 |
| `react-doctor/rerender-split-combined-hooks`      |      287 | 191 |   1 |         95 |      0 |
| `react-doctor/no-swallowed-error`                 |      163 |  72 |   0 |         31 |     60 |
| `react-doctor/async-await-in-loop`                |      219 | 131 |  28 |         60 |      0 |
| `react-doctor/bundle-conditional`                 |      140 |  56 |   0 |         84 |      0 |
| `react-doctor/prefer-dynamic-import`              |      139 |  56 |   1 |         82 |      0 |
| `react-doctor/tailwind-no-redundant-padding-axes` |       87 |   4 |   0 |         83 |      0 |
| `react-doctor/no-giant-component`                 |      295 | 215 |   2 |         77 |      1 |
| `react-doctor/client-localstorage-no-version`     |      116 |  46 |   2 |         37 |     31 |
| `react-doctor(tailwind-no-default-palette)`       |       67 |   0 |   0 |         67 |      0 |
| `react-doctor/no-icon-only-button-without-label`  |      808 | 742 |  29 |         35 |      2 |
| `effect/no-event-handler`                         |      241 | 178 |  10 |         53 |      0 |
| `react-doctor/use-lazy-motion`                    |      175 | 118 |   0 |         57 |      0 |
| `react-doctor/no-render-in-render`                |      157 | 102 |   1 |         54 |      0 |
| `react-doctor/design-no-vague-button-label`       |       63 |   9 |   0 |         54 |      0 |
| `react-doctor/no-pure-black-background`           |       54 |   0 |   0 |         54 |      0 |
| `react-doctor/js-set-map-lookups`                 |      148 | 100 |  10 |         38 |      0 |
| `react-doctor(no-array-index-as-key)`             |       71 |  27 |   0 |         44 |      0 |
| `react-doctor/no-generic-handler-names`           |      226 | 184 |   1 |         41 |      0 |
| `react-doctor(server-serialization)`              |       44 |   4 |   7 |         33 |      0 |
| `react-hooks(exhaustive-deps)`                    |      551 | 513 |   0 |         38 |      0 |
| `react-doctor(no-icon-only-button-without-label)` |      198 | 160 |  15 |         19 |      4 |
| `react-doctor/rerender-memo-with-default-value`   |      124 |  87 |   0 |         37 |      0 |
| `react-doctor/rendering-hydration-mismatch-time`  |      219 | 182 |  14 |         23 |      0 |
| `react-doctor/no-fetch-in-effect`                 |       84 |  47 |   0 |         36 |      1 |
| `react-doctor/js-flatmap-filter`                  |      124 |  87 |   0 |         37 |      0 |
| `react-doctor/no-z-index-9999`                    |       69 |  33 |   0 |         35 |      1 |
| `react-doctor(react-compiler-destructure-method)` |       40 |   4 |   1 |         35 |      0 |
| `react-doctor/testing-no-container-query`         |       41 |   5 |   0 |         34 |      2 |
| `react-doctor/i18n-no-dynamic-translation-key`    |      208 | 173 |   4 |         31 |      0 |
| `react-doctor/no-usememo-simple-expression`       |       77 |  42 |   2 |         33 |      0 |
| `react-hooks/exhaustive-deps`                     |      570 | 536 |  13 |         21 |      0 |
| `react-doctor/rn-prefer-reanimated`               |       47 |  13 |   3 |         31 |      0 |
| `react-doctor/js-cache-storage`                   |       67 |  33 |   1 |         33 |      0 |
| `react-doctor/rerender-state-only-in-handlers`    |      283 | 253 |   9 |         21 |      0 |
| `react-doctor/async-parallel`                     |      132 | 103 |   7 |         22 |      0 |
| `react-doctor/tailwind-no-conflicting-classes`    |       67 |  38 |   3 |         26 |      0 |
| `react-doctor/effect-no-event-handler`            |      220 | 192 |   3 |         25 |      0 |
| `react-doctor(no-barrel-import)`                  |       33 |   5 |   0 |         28 |      0 |
| `react-doctor/client-passive-event-listeners`     |       81 |  54 |   8 |         18 |      1 |
| `react-doctor/no-many-boolean-props`              |       53 |  26 |   0 |         27 |      0 |
| `react-doctor/no-tiny-text`                       |       31 |   5 |   2 |         24 |      0 |
| `react-doctor/js-tosorted-immutable`              |       90 |  65 |   1 |         24 |      0 |
| `react-doctor/client-swr-dedup`                   |       63 |  38 |   0 |         25 |      0 |
| `react(no-danger)`                                |       73 |  50 |   3 |         20 |      0 |
| `jsx-a11y/no-autofocus`                           |       77 |  54 |   0 |         23 |      0 |

## Repo Matrix

| Repo                                                    | Commit                                     | Raw Diagnostics |  TP |  FP | Borderline | Missed |
| ------------------------------------------------------- | ------------------------------------------ | --------------: | --: | --: | ---------: | -----: |
| `pierrecomputer/pierre`                                 | `7288f63848eaf5d36836133cc166a78b87e7e977` |             551 |  60 |   9 |         37 |      2 |
| `aidenybai/react-grab`                                  | `ded2843b8514f6e7e416e2b5e5db794ea5e9cea7` |             249 |  20 |  12 |         19 |      3 |
| `aidenybai/bippy`                                       | `01338495471adfef59b203717a295d78938001dd` |             101 |   2 |   8 |         15 |      0 |
| `millionco/react-doctor`                                | `8556b31d8e4e165f791db0aa60a6b038b18ec777` |              10 |   0 |   6 |          3 |      1 |
| `millionco/same`                                        | `a2443fca509e22e26678107b58e0681a11517ada` |            1504 |  12 |   0 |          9 |      0 |
| `millionco/ami`                                         | `bbcdc172ee485a0c4eb1351639d6f86b19efe08e` |            1713 |  20 |   0 |          2 |      0 |
| `nisargio/scissors`                                     | `621fcf66a8c041c523613eba348c262c20fe1399` |             458 |   9 |  11 |          9 |      1 |
| `millionco/expect`                                      | `39e97500725783490136a8fc7040e6e4dbaafa44` |             218 |  88 |  19 |         40 |      1 |
| `aidenybai/react-scan`                                  | `ec7b00f6ea1a98fbe06e753194d9e945d5013bea` |             202 |   6 |   9 |          6 |      1 |
| `pingdotgg/t3code`                                      | `b83e9c95e4f3bd1dcb771ee436dcfafcfaf6b3fa` |             671 |   5 |  11 |          7 |      1 |
| `tldraw/tldraw`                                         | `f9a046be5822ee980fde3e8c67f83bc44c837bb0` |            1187 |   9 |   9 |         10 |      1 |
| `excalidraw/excalidraw`                                 | `0457ac90634b8556feaa9c0e56be94d3f13fd9bd` |             517 |  19 |  13 |         14 |      2 |
| `twentyhq/twenty`                                       | `7ade9e3aab6eea38867e6bcf722a4e811bad62c1` |            4201 |   0 |   0 |          0 |      0 |
| `makeplane/plane`                                       | `4225bc59de784f8991a8c30de77ca8b2b3fd8cc7` |            4385 |   0 |   0 |          0 |      0 |
| `formbricks/formbricks`                                 | `3005c44c493a8739f0731b8041ff0560eb5e34fe` |            9430 |   0 |   0 |          0 |      0 |
| `PostHog/posthog`                                       | `696b444135bb47cb87e210529759f4a646e05c9b` |               0 |   2 |   3 |          3 |      2 |
| `supabase/supabase`                                     | `de30257ed568923711cb5ac969a4689a1ad2d50d` |            8785 | 140 |   2 |         61 |      3 |
| `onlook-dev/onlook`                                     | `a242be584fa9c71ca5be9e5e7a2640595c4200be` |            2837 |   5 |  14 |          6 |      0 |
| `payloadcms/payload`                                    | `5375636a86070e86a1f2033467fd06c09f39a804` |            6689 |   0 |   0 |          0 |      0 |
| `getsentry/sentry`                                      | `b493f8b81ff8d40375cf47fc873ee5621aabaadf` |            9068 |  61 |  10 |         52 |      0 |
| `calcom/cal.com`                                        | `fb0149453e97a047f44ec21e99f9d8af420d8365` |            3259 |   0 |   0 |          0 |      0 |
| `dubinc/dub`                                            | `39cc2e3f9637912bfa6f7fc6884368a3ddb6f61a` |            5883 |  10 |   3 |          9 |      0 |
| `nodejs/nodejs.org`                                     | `125b760694fd99bf482aa2819965cd992cbfbf56` |             284 |   9 |   1 |          5 |      0 |
| `shadcn-ui/ui`                                          | `15ac1be92b889480010802151324924005918047` |            2770 |  13 |  16 |          7 |      0 |
| `lobehub/lobe-chat`                                     | `690098dcb931a4a05d1e5e07442ebe58b37b9a9c` |            4401 |   0 |   0 |          0 |      0 |
| `langfuse/langfuse`                                     | `1b0039671ec5fb408d2d664c5b838fb30b0d06e0` |            3445 |   0 |   0 |          0 |      0 |
| `unkeyed/unkey`                                         | `eb49343af6e6358678bfd4d09befb6f6b482add9` |            1846 |  17 |   0 |          7 |      0 |
| `triggerdotdev/trigger.dev`                             | `6b0e78f1db651afd25940673b997a334e50e0d98` |            2818 |  10 |  10 |         11 |      0 |
| `baptisteArno/typebot.io`                               | `67c7c86b1a9cb255260d562446ba5010327382b7` |            1309 |   6 |   8 |          4 |      2 |
| `medusajs/medusa`                                       | `2b21d15640ae459386b0acea4c83804c6f502b9d` |            2952 |   0 |   0 |          0 |      0 |
| `appsmithorg/appsmith`                                  | `5574db21aa72cb89e05200197828201ae1ad088f` |            6668 |  27 |   4 |          4 |      0 |
| `ToolJet/ToolJet`                                       | `f33ff86cbb2c5a1bc3ff7d62ff4fc6ab00e8358b` |               0 |   0 |   0 |          0 |      7 |
| `RocketChat/Rocket.Chat`                                | `b6b04aadfcc8558f888b334e37c46a77e5816237` |            2925 |   7 |   9 |          6 |      0 |
| `RhysSullivan/executor`                                 | `60e4b33ed466f519b6c46746f4ee5c344ba58431` |             200 |   4 |  12 |          3 |      1 |
| `better-auth/better-auth`                               | `7a120724c5c3fdd9d60d59169b32d693e9497fec` |             583 |   9 |  13 |          4 |      0 |
| `mastra-ai/mastra`                                      | `0661e5c4e3187ae82fde162355f27d131c387335` |            2354 |   0 |   0 |          0 |      0 |
| `freeCodeCamp/freeCodeCamp`                             | `0da7c6de9810487f444009c1dc61324e93a51b05` |             658 |   4 |   8 |          4 |      1 |
| `facebook/create-react-app`                             | `6254386531d263688ccfa542d0e628fbc0de0b28` |              82 |   0 |   4 |          4 |      2 |
| `ChatGPTNextWeb/NextChat`                               | `c3b8c1587c04fff05f7b42276a43016e87771527` |             458 |   7 |   9 |          4 |      3 |
| `lobehub/lobehub`                                       | `690098dcb931a4a05d1e5e07442ebe58b37b9a9c` |            4401 |   0 |   0 |          0 |      0 |
| `grafana/grafana`                                       | `95f3b8a6ed8d0450636c9970b97d54d7923ba152` |            8876 |   3 |   5 |          4 |      2 |
| `apache/superset`                                       | `e2a8a88d366c09bf675434446ba1dc7ddcb4b2dd` |            6191 |   0 |   0 |          0 |      0 |
| `toeverything/AFFiNE`                                   | `f19a922793f482e912d36ef3a7b0da97257beba4` |               6 |   2 |   4 |          0 |      0 |
| `usememos/memos`                                        | `ca2bc4eb84512bf30f02c9c576b73af2789a74ba` |             648 |   5 |   5 |          5 |      1 |
| `laurent22/joplin`                                      | `8b72b0aad77e850ac8f298f79871c276c9a780d8` |            1714 |  15 |   3 |          2 |      0 |
| `mastodon/mastodon`                                     | `bbb3392dbe35da834b0f31a5d3b15b19480fb688` |             744 |   4 |  13 |          6 |      1 |
| `penpot/penpot`                                         | `1e746add31b4735a4d10b2d72b5a913aa0477ad4` |             104 |   9 |  10 |         10 |      0 |
| `metabase/metabase`                                     | `d37e4773e3f8dc0e9ba7a0e3b0adcb9b0d7644b8` |            4016 |   5 |  10 |          4 |      1 |
| `AykutSarac/jsoncrack.com`                              | `ffd250b5cbcab410a2985f9e379ad86c644d0e57` |             100 |  10 |  13 |          9 |      0 |
| `usebruno/bruno`                                        | `dd922c7163b609c52db76d4e1916ef1327705d44` |            2190 |   0 |   0 |          0 |      0 |
| `calcom/cal.diy`                                        | `fb0149453e97a047f44ec21e99f9d8af420d8365` |            3259 |   0 |   0 |          0 |      0 |
| `nexu-io/open-design`                                   | `b2841f60459a467bfc8e35b61f88567b4df4be5a` |            1259 |   0 |   0 |          0 |      0 |
| `outline/outline`                                       | `7c070df9428a802384260b0b4dc095deed8708aa` |            1583 |  83 |   1 |          6 |      1 |
| `Kong/insomnia`                                         | `b711ecaa6fbb00b11c86ec926c32ca228cfe133f` |            1456 |  78 |   0 |         35 |      3 |
| `LAION-AI/Open-Assistant`                               | `f1e6ed9526f5817531f3ab85441a40b3671ddccb` |             278 |  46 |   1 |         13 |      0 |
| `drawdb-io/drawdb`                                      | `5cfea2c1e890e1a36d6adc4130931fc5ebb3b8b0` |             242 | 148 |   0 |         37 |      0 |
| `amruthpillai/reactive-resume`                          | `c5787fe1550904ed926dbadba682e37d9b53f648` |             665 |  55 |   0 |         15 |      0 |
| `mattermost/mattermost`                                 | `8a8a4ac8b14ff50f3423008024c6751cd0852b32` |            5428 |  29 |   5 |          9 |      1 |
| `umami-software/umami`                                  | `a9508e7aaeb5440897c70a803b5933fd69b492e6` |            1718 |  12 |   0 |          5 |      0 |
| `Dokploy/dokploy`                                       | `aff200f84f30647658149b6487feca7a86f25ac5` |            2014 |   0 |   0 |          0 |      0 |
| `hasura/graphql-engine`                                 | `9b5d3400903fbb85642e601435dc79ca945ffaf8` |            3877 |  16 |   4 |          3 |      1 |
| `conductor-oss/conductor`                               | `de11d13f64f6b4ae311eb65fb9bc02fae0b07fcf` |             935 | 401 |   1 |        365 |      0 |
| `CopilotKit/CopilotKit`                                 | `75303218c67fdc17505e790b0b35afe9f522f32b` |            1504 |  83 |   0 |         37 |      0 |
| `gitroomhq/postiz-app`                                  | `7cc3d9bd78a883cf4c01bbb71b2337ba5cfa8a6f` |            2156 |  27 |   1 |          6 |      0 |
| `gethomepage/homepage`                                  | `02a9d74c95f33cddefbf33dffd4eabbefc47c2d8` |             597 |  60 |   0 |         16 |      0 |
| `bigint/hey`                                            | `941a2e6d639b74cf65078538f2f75527e61dc905` |             595 | 239 |   1 |        443 |      0 |
| `onyx-dot-app/onyx`                                     | `416d9f36338d646c822c1fde70ce136042db8b4c` |            4769 |   9 |   3 |          3 |      1 |
| `jitsi/jitsi-meet`                                      | `fc582405dc49d6f81cf286dd128e24de51267729` |            2461 |   0 |   0 |          0 |      0 |
| `t3-oss/create-t3-app`                                  | `4709861f7e67a15564c0460c13e7b4b6cfcae40d` |              68 |  11 |   0 |          7 |      0 |
| `nrwl/nx`                                               | `07b16e43d42c73b57a73f43cdc7e7779e6f655a3` |            1947 |  59 |   0 |         21 |      0 |
| `getredash/redash`                                      | `4956e6d17cf429cbf2a2ac4330855cff1b98d92a` |             835 |   6 |   3 |          0 |      1 |
| `labring/FastGPT`                                       | `011e718bcdadb4db98f5216313337eda38e2ed43` |            3663 |   0 |   0 |          0 |      0 |
| `srbhr/Resume-Matcher`                                  | `25af0d9cad27743e9a5eab56f21070a2d0867d36` |             518 |  52 |   0 |          6 |      0 |
| `SigNoz/signoz`                                         | `515220194d53f1649ec7aa9b109c192af66e7026` |            3565 |   0 |   0 |          0 |      0 |
| `Infisical/infisical`                                   | `6c7713bb2546c4ce37332646ba308749d5abfe8b` |               0 |   0 |   0 |          0 |      0 |
| `actualbudget/actual`                                   | `b61732e20ecc71ed959b229fd9ca3829db18e164` |            1693 |  50 |   4 |          8 |      0 |
| `karakeep-app/karakeep`                                 | `66a7ac48cc2cd18243652b32fea5d7b9d9888598` |            1410 | 121 |  26 |         41 |      1 |
| `responsively-org/responsively-app`                     | `426e7e8ed44273c6c659d5acc2d517280f7967ea` |             632 |   2 |   2 |          1 |      0 |
| `nocobase/nocobase`                                     | `cc6665607f2938507d90d5b90859c8596e4a2b1c` |            9196 |  72 |   5 |         27 |      1 |
| `chartdb/chartdb`                                       | `c24936a402bb3e24b4858f05282d69a04fcfe25b` |            1029 |  68 |   0 |         12 |      0 |
| `teableio/teable`                                       | `bda82ee5c1553e560a8db7f3ac9ff1131d7c3628` |            3337 |   0 |   0 |          0 |      0 |
| `navidrome/navidrome`                                   | `2b3b879c57d3560bdaecf4559869b60254981e16` |             296 |  19 |   1 |         10 |      0 |
| `readest/readest`                                       | `058d58b4f2080f266cb558b00ce4bc0136f74cac` |            2058 |  16 |   0 |          6 |      0 |
| `dyad-sh/dyad`                                          | `0aa8579626bfaf6a9bce7f414a7ca538fde54692` |            2795 |  24 |   3 |          6 |      0 |
| `wulkano/Kap`                                           | `c42692fa63ac71ed192e01684beb78a1b864aa88` |             244 |  38 |   1 |          5 |      0 |
| `decaporg/decap-cms`                                    | `d4d4cd4bb9728c6e20bdcd06de69747d06d09175` |             776 | 326 |   0 |         70 |      0 |
| `CapSoftware/Cap`                                       | `72fb5b6a1f97baa526887c0a1ed5ebd6aa961246` |            2277 |   0 |   0 |          0 |      0 |
| `linkwarden/linkwarden`                                 | `22723575b04503eb67c9733c63d55179c069903d` |             786 |  10 |   0 |          2 |      0 |
| `bluesky-social/social-app`                             | `e776c37d1720db8f801b8d51314b6dae9957a5b9` |            4842 |   4 |   5 |          4 |      0 |
| `signalapp/Signal-Desktop`                              | `1b2a3e7b283c32c5654a39da12fc04139fd26dbd` |            1153 |   0 |   0 |          0 |      0 |
| `infinitered/reactotron`                                | `44f935edee51615e7ec568393dc6e11261793901` |             232 |  27 |   5 |          2 |      3 |
| `apache/answer`                                         | `fca80abbaf3807cf50c2927982033f282dc7effa` |             940 |  14 |   2 |          3 |      0 |
| `apitable/apitable`                                     | `88b24ce9f359cc434778be75d03603182882dc76` |           17237 | 105 |   0 |         12 |      0 |
| `midday-ai/midday`                                      | `e5f45ed0d49cdb34576373623c4579b72daa74c1` |            3735 |  17 |   5 |          1 |      1 |
| `streetwriters/notesnook`                               | `8093f44a70a781df3ebeb1e6cf2eb9323923b751` |            1823 |  13 |   1 |          8 |      0 |
| `vercel/commerce`                                       | `1df2cf6f6c935f4782eed27351fa18f276917a4d` |             100 |  48 |   0 |         37 |      0 |
| `tinacms/tinacms`                                       | `8cbed247e265b8f539b8ba7047af46b3640b9718` |            1215 |   0 |   0 |          0 |      0 |
| `element-hq/element-web`                                | `13dd1a0b5e4594d2c1f60ba6c39c3454b2552b71` |            1708 |  55 |   5 |         11 |      0 |
| `documenso/documenso`                                   | `abbca79b4867c6ac2327977654c4c9ed00ae8ade` |            5922 |  18 |   2 |          9 |      0 |
| `Automattic/wp-calypso`                                 | `b17c2f3f3080778774455f42650756d07676fba5` |           23519 |   0 |   0 |          0 |      0 |
| `alibaba/formily`                                       | `d9a46442a575aa5f0fc1bd945e34d9a85d191d0e` |             341 |  35 |   1 |          7 |      3 |
| `BasedHardware/omi`                                     | `c1b84fff755e444e1aebe00c62592622e229127c` |            3064 |   0 |   0 |          0 |      0 |
| `illacloud/illa-builder`                                | `a468660903e2a17b1778ba97dd17a375181a72e0` |            2296 |  61 |   0 |          2 |      0 |
| `openreplay/openreplay`                                 | `1452c569641f3b2d889c1b658ef161de77de41dd` |            4283 |   0 |   0 |          0 |      0 |
| `logto-io/logto`                                        | `d7fdf28e926d90fa8aa7197e48af9a35d9168748` |            1533 |   0 |   0 |          0 |      0 |
| `plankanban/planka`                                     | `a8dcd7cef3ee8d19ad05b8c734ac43f3103489e8` |             363 | 239 |   0 |          7 |      0 |
| `codexu/note-gen`                                       | `8da153013cbbcdda8fc09ea691ccf7e41164a452` |            2293 |   0 |   0 |          0 |      0 |
| `giscus/giscus`                                         | `d90866dfb460308e7ed745b3b040657622845f82` |              79 |  25 |   1 |          8 |      1 |
| `wojtekmaj/react-pdf`                                   | `5dc80a8af3d87676d00a39f290596d5791322399` |              94 |  11 |   0 |          3 |      0 |
| `kusti8/proton-native`                                  | `ab482b120542951628292211b989e504fa4a3985` |              20 |   5 |   0 |         13 |      0 |
| `elie222/inbox-zero`                                    | `7edc3a657f07a4381c4ced95199e8a5bb2ced262` |            2275 |   0 |   0 |          0 |      0 |
| `reactide/reactide`                                     | `564d8c3bdd26ddc05424257c5ec497fe7ad60792` |             154 |   0 |   0 |          0 |      0 |
| `jhen0409/react-native-debugger`                        | `bd3435a456a29e1eda017ad37b94451834b4ee3a` |              11 |   5 |   1 |          2 |      0 |
| `blinkospace/blinko`                                    | `8bd89a6b4d7f07a2ee3ab2e01cb6dfb855017f91` |            1113 |  64 |   0 |         19 |      0 |
| `hackjutsu/Lepton`                                      | `a1b2c4f0ec268a9ee3979d0b4d3875d525542d73` |             106 |   0 |   0 |          0 |      0 |
| `woocommerce/woocommerce`                               | `45076b80178cd2337b9470d7c0816d62907704ce` |            1254 |   0 |   0 |          0 |      0 |
| `devhubapp/devhub`                                      | `1d0d66a388245b43582b3f478846b1c470dd88a3` |            1676 |  22 |   4 |          8 |      1 |
| `polarsource/polar`                                     | `2cc6c16c31394de73401586ad3e9f5299056c3df` |            3123 |   0 |   0 |          0 |      0 |
| `zuiidea/antd-admin`                                    | `f28bae8f3ea60c2477b5c88dfb71c128fd472eff` |              68 |  20 |   0 |          5 |      0 |
| `InsForge/InsForge`                                     | `bb680ba4428352ece97ab11cf32fcdc26855ad70` |            1338 |  76 |   0 |          4 |      0 |
| `hyperdxio/hyperdx`                                     | `790488ef79df355fd454e79579661cb07fced579` |            1539 |  22 |   6 |          9 |      0 |
| `yang991178/fluent-reader`                              | `cd331fbe3d5b208035eba2e8c3d4cd18871ad013` |             133 |   0 |   0 |          0 |      0 |
| `berty/berty`                                           | `a91c26801241d2726a78ab89e647c5d0889b9a2a` |            1699 |  71 |   1 |         11 |      0 |
| `nhost/nhost`                                           | `d21f27d7c8cc83698e551cd581a0e326e9d536b1` |               1 |   0 |   0 |          1 |      0 |
| `gridstack/gridstack.js`                                | `d6e2d90f77b1bda0ad8f35fe8c87e5e9ed335672` |               3 |   0 |   0 |          1 |      0 |
| `heyform/heyform`                                       | `2f20e9ce02b97df1a449a0b81cb3fcc5af89d8c2` |               0 |   0 |   0 |          0 |      0 |
| `BuilderIO/builder`                                     | `0864c0db5833ad1c319dee98ac55ff7968cb7ee2` |             210 |   0 |   0 |          0 |      0 |
| `openstatusHQ/openstatus`                               | `8d870e086fa8c066b1bd007bc5175d0de0165509` |             871 |   8 |   3 |          3 |      0 |
| `webstudio-is/webstudio`                                | `ac14670d9e8490796aecab87d91901263dff35bf` |            2790 |  28 |   5 |          4 |      0 |
| `xanderfrangos/twinkle-tray`                            | `4fce279da9acb6085d42cb66efd93a516c7bdede` |             173 |  54 |   0 |          5 |      0 |
| `idurar/idurar-erp-crm`                                 | `5b2cf28969dc9a720c3fca20f0d2c7606534b277` |             246 |  29 |   0 |          0 |      3 |
| `Shopify/react-native-skia`                             | `0d47d50fee4399f629be4d4edd85c4783c0f3c8d` |               0 |   0 |   0 |          0 |      0 |
| `maotoumao/MusicFreeDesktop`                            | `f3b526a6c1ea9313b277810a8e12003605a98982` |               0 |   0 |   0 |          0 |      0 |
| `papermark/papermark`                                   | `8ffa04af64651f8cf4d04dc3842577d7f4234030` |            5425 |  36 |   2 |         13 |      0 |
| `relax/relax`                                           | `75943ce5e9c4ce8f503398487b35f89cf4974d7e` |             628 |  24 |   1 |          1 |      0 |
| `Snouzy/workout-cool`                                   | `77f25a922b51be7d96bd051c5d2096959f0d61a8` |            2118 |  15 |   0 |          3 |      0 |
| `dilanx/craco`                                          | `56840ceaedaa5f71cc580099e72f0048fafcc44f` |              19 |   3 |   3 |          0 |      0 |
| `ajnart/homarr`                                         | `c5873c6e481144cd18a70139ef23ac04ca8ab158` |             272 |  13 |   0 |          5 |      0 |
| `react-native-webview/react-native-webview`             | `eb8ccacd35740af39993725ad1b592d45364a510` |              31 |   0 |   0 |          0 |      0 |
| `yinxin630/fiora`                                       | `d741c006c5a0a5b904dec742ac09dbc51bd7860d` |             177 |  73 |   0 |          7 |      0 |
| `buildship-ai/rowy`                                     | `a5b4316cf04c7b653f007e8420ca189b587637cf` |             646 |  18 |   3 |          5 |      0 |
| `plasmicapp/plasmic`                                    | `c0db8c2a17cf5065a0d6b4d68a41d0fe130e33c6` |             641 | 306 |  32 |        111 |      0 |
| `hexclave/stack-auth`                                   | `3385d6e2b010cd7746edb25bb4c7c5c03d46cb33` |            4638 | 130 |   0 |         27 |      1 |
| `software-mansion/react-native-gesture-handler`         | `ea5f23f3b04032c537cfcd50c7d07ded6d7e2a20` |             250 |  40 |   0 |         10 |      3 |
| `nraiden/cofounder`                                     | `19ba19f61737d654493175208df468395e2193f4` |             276 |  11 |   0 |          6 |      0 |
| `ganeshrvel/openmtp`                                    | `ac02705fa9bcb81715ae328fb6c7324e126b2483` |             107 |   0 |   0 |          0 |      0 |
| `jpuri/react-draft-wysiwyg`                             | `4743d7387474d7f88a16e40d3c0e3a9cc9c7a3f9` |             220 |   0 |   0 |          0 |      0 |
| `standardnotes/app`                                     | `a5984ae5b49b43d11a82288270289f0f249aac12` |            1281 |   0 |   0 |          0 |      0 |
| `Flagsmith/flagsmith`                                   | `913daeb930339435083d5557667f43bbec1193cb` |            1290 |   0 |   0 |          0 |      0 |
| `OpenSignLabs/OpenSign`                                 | `197c00dd79f8ceded909c2edb4560355fb0f8e07` |            1476 |   0 |   0 |          0 |      0 |
| `sanity-io/sanity`                                      | `3d2b9de30b1837e2f34146ef28e7edb13583cfb0` |               0 |  91 |   1 |         29 |      3 |
| `jvalen/pixel-art-react`                                | `73b57b6b2305146b5a9f94ec9786ea701749c356` |              11 |   7 |   0 |          4 |      0 |
| `lightdash/lightdash`                                   | `3e54e254eca79de5b56cdfed1e11edba41c30538` |               0 |  90 |   0 |         11 |      0 |
| `Uniswap/interface`                                     | `e011a5ba955dbd5a0b1b76147b65450bd92be811` |               0 |   8 |   4 |          3 |      0 |
| `czy0729/Bangumi`                                       | `6f2e0654abaa53e7663ce435ce1e8373a55c2961` |               0 |   0 |   0 |          0 |      0 |
| `Flipkart/recyclerlistview`                             | `3485036e6c5e78bdf9f1a7a7e994da36612272bd` |              13 |   0 |   0 |          0 |      0 |
| `lingodotdev/lingo.dev`                                 | `19955fb8013f312facc55f7bdbc395a9b0d08473` |               0 |  37 |   3 |         14 |      0 |
| `AmanVarshney01/create-better-t-stack`                  | `163de4d098d580e000fb2374f6783e972c3b6643` |               0 |  47 |   2 |         10 |      2 |
| `gitify-app/gitify`                                     | `HEAD`                                     |               0 |  21 |   0 |          6 |      0 |
| `benoitvallon/react-native-nw-react-calculator`         | `4f9628fa75d5ad2c2b8d29b611768990087abc15` |              25 |   0 |   0 |          0 |      0 |
| `rcbyr/keen-slider`                                     | `520c757a80aa10ff224e9c89b0917edfa811adcf` |              13 |   0 |   0 |          0 |      0 |
| `edp963/davinci`                                        | `74a8cbf4d46b94048bfaa373642741769889b55d` |            1042 | 520 |   0 |        164 |      0 |
| `react-native-config/react-native-config`               | `b6f8bd140c7c9f35bd83395c6604b7431fa339df` |               0 |   0 |   0 |          0 |      0 |
| `mediacms-io/mediacms`                                  | `c7a1d60d730048b81cf4998f4eba430b3d274a0a` |            1607 |  40 |   0 |         65 |      2 |
| `Expensify/App`                                         | `ba0f6c4f9a3280fe1e855335413d9fb75b86a300` |            6321 |  28 |   1 |          6 |      0 |
| `clidey/whodb`                                          | `HEAD`                                     |               0 | 351 |   0 |        163 |      0 |
| `streamlabs/desktop`                                    | `HEAD`                                     |               0 |  13 |   1 |          6 |      0 |
| `gitpoint/git-point`                                    | `3f01534440ab5bda689209f50b3e08891b3e87dd` |              80 |  11 |   0 |          1 |      2 |
| `sqlectron/sqlectron`                                   | `e06d34a34183437072e6ee87146f14babc7f6b6b` |             240 |  30 |   0 |          6 |      3 |
| `liveblocks/liveblocks`                                 | `b4c02b59cbbbe9ebc1d42c3642c394e1650496db` |               0 |   0 |   0 |          0 |      0 |
| `oliverschwendener/ueli`                                | `1f87145c5c2d21b9f9f09e40398ffe3f02d3abee` |             246 |  36 |   1 |          1 |      0 |
| `Yooooomi/your_spotify`                                 | `96582310f83d1f620d1e6f55b26842fd9bc93db2` |             125 |  53 |   1 |         42 |      0 |
| `Bowen7/regex-vis`                                      | `a6d920601ca44ab2d4e9cd02306510ab6d5e4b38` |             115 |  19 |   0 |          4 |      0 |
| `rainbow-me/rainbow`                                    | `2c38c133cc20648f4de1089674d2e85c8d7c5dc5` |            2400 |  85 |   0 |         19 |      3 |
| `OHIF/Viewers`                                          | `b058ec7c722a8dfe676f6ee19655dff86190eeb3` |            1599 |  78 |   2 |         16 |      0 |
| `outsourc-e/hermes-workspace`                           | `372b18a8e4e3fa7947ff3cf5651865560daca0a1` |            4842 |  10 |   2 |          2 |      0 |
| `prazzon/Flexbox-Labs`                                  | `39416e136100825caf10e1963579e6bd3c19f873` |              75 |  26 |   0 |          6 |      0 |
| `chartbrew/chartbrew`                                   | `275043235af2ecebaa880852dc901a437d99f2c3` |            2200 |   0 |   0 |          0 |      0 |
| `wojtekmaj/react-calendar`                              | `30eee6d6121d0a8f393220b3c276ae879d868b85` |             238 |   6 |   0 |          4 |      0 |
| `iSimar/HackerNews-React-Native`                        | `4ab83c05b863a142bba58bf63036f54e46c85d89` |               4 |   4 |   0 |          0 |      0 |
| `software-mansion/react-native-screens`                 | `e6b354434e71eb4dc03300e963ffda139e3e6eae` |            1305 |  26 |   2 |          8 |      0 |
| `plouc/mozaik`                                          | `5fc9070d9c3aeb1c53ef1719daa3a7239c23a31b` |              29 |   0 |   0 |          0 |      0 |
| `Pagedraw/pagedraw`                                     | `aba1bd1b8ef6bb7f58866a9d11ebb7f1e0e18a8e` |              78 |  13 |   0 |          1 |      3 |
| `lbryio/lbry-desktop`                                   | `d14c9141db0bfa2db9b5dcf78fcaa72912cc767a` |             249 |  16 |   0 |          7 |      3 |
| `chaskiq/chaskiq`                                       | `8ddcac9380461f0a7b37798d79acb4629f4dfca2` |            1883 |  14 |   2 |          8 |      0 |
| `React-Proto/react-proto`                               | `e5e988c7afd961891e3dd8afc2c5c7bf813ae534` |              13 |   0 |   0 |          0 |      0 |
| `MauriceNino/dashdot`                                   | `9d169fc77fefe6e50ce8a326584a8602588e6987` |             109 |   0 |   0 |          0 |      0 |
| `attentiveness/reading`                                 | `13df95d35ee8ccdc7fb5ba51544965494cefb70c` |              35 |   0 |   0 |          0 |      0 |
| `pashpashpash/vault-ai`                                 | `60ec5f21f8222e942f266971b630b9f0f4575693` |               6 |   2 |   1 |          0 |      0 |
| `CherryHQ/cherry-studio-app`                            | `1167eabbd5a8bacc27759ca9cb9c0dc1c1776b74` |             694 |  55 |   0 |         25 |      0 |
| `Peppermint-Lab/peppermint`                             | `ba6e2179f9409db76abeb9a3007a262160e24628` |            2242 |   0 |   0 |          0 |      0 |
| `creativetimofficial/material-dashboard-react`          | `a4db3e60d3b9e152c1db4aaa93b311aa164ad68b` |             116 |   0 |   0 |          0 |      0 |
| `fangpenlin/avataaars-generator`                        | `c191c6c2d27f41245e803912d43c7213436a34d3` |              15 |   3 |   0 |          0 |      1 |
| `MetaMask/metamask-mobile`                              | `6137dfd24f82091d43d61be25a46418c02429f1b` |           11856 |   0 |   0 |          0 |      0 |
| `chrisvel/tududi`                                       | `c63ac5fadcff896d1443fb50c7a6cf94aceb1149` |            3488 |   0 |   0 |          0 |      0 |
| `microsoft/vscode-react-native`                         | `e53f37f2cb607058588478871c479d905229feb4` |               2 |   2 |   0 |          0 |      0 |
| `edrlab/thorium-reader`                                 | `6a27a373a7ff8530981f935e501925aff7da9a99` |               0 |   0 |   0 |          0 |      3 |
| `kentcdodds/bookshelf`                                  | `32e9e87db958de863bead65761bfbe2dec0eafd4` |             116 |   0 |   0 |          0 |      0 |
| `ohmplatform/FreedomGPT`                                | `f3c77cc83e02051350e10cd93fc450f4802e02ef` |             349 |  40 |   0 |         21 |      2 |
| `IceEnd/Yosoro`                                         | `2a01decad39ac1455128bbef652c2f7d0600c39b` |              62 |  23 |   0 |         20 |      2 |
| `batnoter/batnoter`                                     | `8722c3af2b81233f158ca17e4818b9251c8cc1d3` |              30 |   0 |   0 |          0 |      0 |
| `nz-m/SocialEcho`                                       | `4dc6c7822bfff5c0b13e1b8098e8d7ae0084939a` |             398 |   0 |   0 |          0 |      0 |
| `adrianhajdin/aora`                                     | `d782c5f795c71f1fecce460f04320eedf2c6f76f` |              77 |  16 |   0 |          3 |      0 |
| `RocketChat/Rocket.Chat.ReactNative`                    | `fca8b8ed41f2c3cf6fa663279e592bbc83b8b22c` |            1195 |   0 |   0 |          0 |      0 |
| `OneKeyHQ/app-monorepo`                                 | `f61c2ae5d1c4c18deb0af65ae96d9b1e01a3776e` |            7652 | 102 |   4 |         69 |      0 |
| `adrianhajdin/ecommerce_sanity_stripe`                  | `c4d1c0593769004d912bedbfe269ed9180f74939` |              28 |   0 |   0 |          0 |      0 |
| `running-elephant/datart`                               | `1af9c5d3ea46db2366d9daedc76e4d97881738b7` |            1241 |   0 |   0 |          0 |      0 |
| `Flaque/quirk`                                          | `3e7fa234cdb3538d7e23ba6e819da0dce1a0f5f6` |             432 |   0 |   0 |          0 |      0 |
| `wwayne/react-native-nba-app`                           | `f0cdfcadca396b9b2e306fc8023fce4b9677d5ea` |              49 |   0 |   0 |          0 |      0 |
| `ammarahm-ed/react-native-actions-sheet`                | `32064ccb0374b24a1ed8bd924d5c21e1629068d4` |              93 |  27 |   1 |         33 |      0 |
| `BlackHatDevX/openspot-music-app`                       | `b523adbd2f62670e54edd26d38f480991fa70d8b` |             467 |  42 |  15 |          0 |      3 |
| `martpie/museeks`                                       | `15854f9ff2fb8a50bf53530893fed018e1c57dfc` |              49 |   0 |   0 |          0 |      0 |
| `Matterwiki/Matterwiki`                                 | `92ca38c897196ce64c27eec7d798346dc798a4d5` |             101 |  15 |   0 |          0 |      1 |
| `catalinmiron/react-native-dribbble-app`                | `45c1634752c4ff9ac85fa15b8ffb56bc7f6c3a33` |               8 |   1 |   1 |          0 |      0 |
| `mohamedsamara/mern-ecommerce`                          | `7f73dfbd68a27b6945fe7fbf654067004816d09e` |             189 |  18 |   1 |          1 |      0 |
| `LucasBassetti/react-simple-chatbot`                    | `fd81c7d6e92030f5dc1972ced01e4045aad88e41` |              14 |   0 |   0 |          0 |      0 |
| `stoneWeb/elm-react-native`                             | `ea0f9a27d617e91640f2573a09e94e0cfe80f40a` |             126 |  13 |   0 |          1 |      0 |
| `adrianhajdin/project_shareme_social_media`             | `0989dcbe0e5133581ea3170ef6451e3238dc7991` |              48 |   0 |   0 |          0 |      0 |
| `birkir/prime`                                          | `336f50c0d30c88f2b4fdf2d390c0e221ad15f129` |             130 |   0 |   0 |          0 |      0 |
| `Jellify-Music/App`                                     | `d1f044af2e297a95d8e24f2efd93d1e84bdd0563` |             376 |  56 |   0 |         24 |      0 |
| `binaricat/Netcatty`                                    | `344b226ce83fe26e3abaa5f344881042a044042b` |            2130 |  22 |   1 |          3 |      0 |
| `CaviraOSS/PageLM`                                      | `bd6087d230d9771096db4b2dedd648b1076f4133` |             275 |  14 |   0 |          8 |      0 |
| `ed-roh/react-admin-dashboard`                          | `adc9e57f76b5e722bd9109a09d85035dae09d15f` |              19 |   2 |   0 |          1 |      0 |
| `learnhouse/learnhouse`                                 | `53e76e95ac4fa36eb619c725dcbc53ca3cd06c9d` |            8699 |  93 |   0 |         27 |      3 |
| `expo/react-native-action-sheet`                        | `9dd71637bb346c29ba996fb2b01fbfa246cbf927` |              44 |   9 |   0 |          5 |      0 |
| `adrianhajdin/project_medical_pager_chat`               | `b5a536baf8092c76f4b88eb99c71d95f7f4baae9` |              59 |  45 |   0 |          3 |      0 |
| `adrianhajdin/social_media_app`                         | `9fa032dd198c92aa498db82d248c0d93f28ebf5c` |              27 |   0 |   0 |          0 |      0 |
| `growilabs/growi`                                       | `3b7c2192c9e402feb221493598bcd08174a5430c` |            2121 |  14 |   2 |          8 |      0 |
| `027xiguapi/pear-rec`                                   | `73df24f79d47c316f5faf15862033103931894d1` |             483 |  35 |   0 |          9 |      0 |
| `Raathigesh/dazzle`                                     | `c4a46f62401a0a1b34efa3a45134a6a34a121770` |               0 |   0 |   0 |          0 |      0 |
| `seniv/react-native-notifier`                           | `99bdea4df1d094195b06ad29d67cd9d9c223a81b` |             155 |   0 |   0 |          0 |      0 |
| `79E/ChatGpt-Web`                                       | `91bbcb4986623f1e2c3bbff6f65bd57409faed88` |             219 |   0 |   0 |          0 |      0 |
| `jgudo/ecommerce-react`                                 | `8d37028200dc1475d78f27d3b352a4d0384a4ab1` |              54 |  16 |   0 |          4 |      0 |
| `DeadWaveWave/opencove`                                 | `ae33b8dc1c2306bf218c100a2ee9efc3dcd1becd` |            1638 |  61 |   0 |         39 |      0 |
| `qiutongxue/oba-live-tool`                              | `1fbc37f1b8fe52d30b077dda6f53a46010e3a2b7` |             278 |  11 |   0 |          5 |      0 |
| `aws-samples/bedrock-chat`                              | `f2f1c98fffaccfbe709d1d4ba34275236c300033` |             321 | 182 |   0 |         51 |      0 |
| `storybookjs/react-native`                              | `c74a80968fca1888925a203e16b5da1f16ef2724` |             328 |  48 |   1 |         19 |      0 |
| `mb21/panwriter`                                        | `3bc3d60b700e83781369a789bd0078625e2756c6` |              18 |  12 |   0 |          0 |      1 |
| `amicalhq/amical`                                       | `27c0117a9e9356624a75c479d5ffed404a142680` |             481 |  49 |   0 |         19 |      3 |
| `bangle-io/bangle-io`                                   | `c000a5750e31d1693e9f910d3d60bc9cbbbacab4` |             234 |  76 |   0 |          4 |      0 |
| `KittyCAD/modeling-app`                                 | `8ca41bfa5e25c1bcf6b9d9516e85f22350a2dd5f` |            1317 |  77 |   1 |         17 |      3 |
| `Shpendrr/react-app-structure`                          | `ba37c8218eb625ff885c42c89636564b1caa42d1` |               1 |   1 |   0 |          0 |      0 |
| `mariusandra/insights`                                  | `025c6b4b4619fde9fa9d87498d1546735bb01dd2` |             114 |  17 |   0 |          1 |      1 |
| `ed-roh/mern-social-media`                              | `9f0617f625a9b6df2a87d24aae78be8ccc9c27d8` |              16 |   0 |   0 |          0 |      0 |
| `alishobeiri/thread-notebook`                           | `1c905d9855007f5084e917aec2264cfb3bb27beb` |             322 |  55 |   2 |         27 |      0 |
| `JasonStu/ReactNative_Shopping`                         | `a8eeacd05ace782e8a52c46cd415a58d0099819f` |              55 |   4 |   2 |          2 |      0 |
| `estevanmaito/windmill-dashboard-react`                 | `da542836f945d08639fc34a3b6f91315965dc030` |              79 |   8 |   0 |          5 |      0 |
| `mCodex/react-native-sensitive-info`                    | `aee6d552771debf246252b590e962acda81b0bd9` |              54 |   0 |   0 |          0 |      0 |
| `r-park/todo-react-redux`                               | `957b72a3bcec56ee97b0de638b423f350bf2163b` |              16 |   0 |   0 |          0 |      0 |
| `KieSun/Chat-Buy-React`                                 | `9cc39de9eb7205a30d6ff57cafa5915ce095acce` |              12 |   9 |   0 |          1 |      0 |
| `saleor/saleor-dashboard`                               | `d4808cc130c7a5d132e23a04c656fae222a38129` |            1488 |   0 |   0 |          0 |      0 |
| `hasan-py/Hayroo`                                       | `9714947bb43ec8559287aa3962b70a7be8c8d6b1` |             663 | 139 |   0 |        207 |      0 |
| `Rabithua/Rote`                                         | `ba98b47c777f80f3baffebe55fef6cfcd5568bce` |             343 |  59 |   0 |          9 |      0 |
| `pupilfirst/pupilfirst`                                 | `001ec461da8042f94d31288931a434898fc29a2a` |              20 |   6 |   0 |          3 |      3 |
| `raineroviir/react-redux-socketio-chat`                 | `0739e285243a06a8ecef504d885735c9bf268acc` |              15 |   0 |   0 |          0 |      0 |
| `koolkishan/chat-app-react-nodejs`                      | `acb6e130150d7eca375526c551b8342db881800a` |              47 |   0 |   0 |          0 |      0 |
| `777genius/agent-teams-ai`                              | `3f3569e1ae69121c66a669ec6b660747b1a0b1bc` |            3992 |  13 |   3 |          2 |      1 |
| `chatwoot/chatwoot-mobile-app`                          | `9e91785f0cf69d1fabf899e5e0d5a28c9d1ddc4b` |             511 |  48 |   0 |          6 |      1 |
| `blueberrycongee/Lumina-Note`                           | `35926f3a27a13a8402d4b486b040c5b1926d0ff7` |            1063 |  63 |   0 |         16 |      3 |
| `fireship-io/react-firebase-chat`                       | `f92b3fdcaa9047875d8ad23d6baeffb07fcbc8c0` |               1 |   1 |   0 |          0 |      0 |
| `jamaljsr/polar`                                        | `711755f150769cb7d541b34fc716bb654cde3806` |             298 |  15 |   1 |         10 |      0 |
| `victoralvesf/aonsoku`                                  | `25512728f1ebe2a18e2938400a1a3418eb0b89ce` |             605 | 195 |   0 |        192 |      0 |
| `sahat/newedenfaces-react`                              | `653bfa2f1470cbe44cb55167020f0551053ca756` |              18 |   8 |   0 |          1 |      1 |
| `kizuna-ai-lab/sokuji`                                  | `7d348c288493ffa2968c342dd5eb7e107742d4d1` |             456 |  55 |   0 |         22 |      3 |
| `victorbalssa/abacus`                                   | `d27b11261e982dd071cd28346111a043d9c9dc7f` |             209 |   0 |   0 |          0 |      0 |
| `zhufengketang/app`                                     | `a79246fce9a18deb2009cceb9c432beda6b56d24` |             137 |   0 |   0 |          0 |      0 |
| `shamahoque/mern-social`                                | `4a81f6c87b98fe54a8c92d33a6302f58876ecde1` |              58 |  13 |   0 |          4 |      0 |
| `kuwala-io/kuwala`                                      | `44d73c2cd0be03acc5984b79597f40695fdeff4c` |             199 |  28 |   0 |          7 |      0 |
| `aws-samples/swift-chat`                                | `b452cbfa8aef232bd7bbf8503e0516137ef7e3c3` |             409 |   0 |   0 |          0 |      0 |
| `LiuYuYang01/ThriveX-Blog`                              | `b95545dae2e2d91bf11e3df08af523fd0007fa61` |             625 |  43 |   0 |         37 |      0 |
| `shwosner/realtime-chat-supabase-react`                 | `2c0a5002fc1e9b7c8cb6fa6e30fbbc1d6fa100c7` |              31 |   0 |   0 |          0 |      0 |
| `bukinoshita/taskr`                                     | `83f0a65c6c1df5e888268511759ed53bccb7b46c` |             105 |  42 |   0 |         24 |      0 |
| `MrXujiang/next-admin`                                  | `9e64c9f3f4648b31ba46ab85bb79dbbff236e15b` |              99 |  31 |   0 |          1 |      0 |
| `letterpad/letterpad`                                   | `91d3e2516987ea00b1f068bda20dcd8fd14eb90d` |            1376 |  86 |   0 |         24 |      1 |
| `expo/orbit`                                            | `bb326166de67613a95c06827baea5d9aace0ca8b` |              84 |   0 |   0 |          0 |      0 |
| `cometchat/cometchat-uikit-react-native`                | `21e3052c03988adbc046dd3f60996824a91314d3` |            1596 | 732 |   0 |        149 |      0 |
| `C-JSN/D3-ID3`                                          | `6dead30cb522b350f0ddd1b9dd5e87d13a2414cd` |              39 |   8 |   0 |          3 |      0 |
| `anisul-Islam/react-assignment-1-products-listing-app`  | `98d06a63fdb1bbc1b9063232e1abd3c16b9e16c3` |               0 |   0 |   0 |          0 |      0 |
| `cometchat/cometchat-uikit-react`                       | `b73a06e728f006ebdceb8f7a19962071e456faa0` |            1432 |   0 |   0 |          0 |      0 |
| `TeXlyre/texlyre`                                       | `a12440768c6ac371f458d310e5b0308c0d9ea130` |            2172 |  24 |   6 |          7 |      0 |
| `Ohh-889/skyroc-admin`                                  | `6fc2446e15a37e727a00d0b3a30fc26b59bbbfa2` |             132 |   0 |   0 |          0 |      0 |
| `unigraph-dev/unigraph-dev`                             | `a209dfde958f01b14a2bafb9327b9abb56364b10` |            1078 | 553 |   0 |        241 |      0 |
| `CromwellCMS/Cromwell`                                  | `ab00131c8a589e4e3e06b77b4360830fcfe8c75d` |            1058 |  84 |   0 |         11 |      3 |
| `KSJaay/Lunalytics`                                     | `efb0b72e8081e1fea86c888676985d7e040a94ea` |             510 |  37 |   0 |         18 |      0 |
| `ftzi/react-native-shadow-2`                            | `5dd75aba5a5a9d4a0c13c8666b91d893685fe2b8` |              12 |   3 |   0 |          0 |      0 |
| `hitarth-gg/zenshin`                                    | `4571d3b8d52a32450af75df82c55ebf338c70caa` |             585 | 340 |   0 |        100 |      0 |
| `heylinda/heylinda-app`                                 | `a073e1e2feabb2e6a9bd244cee87a251b059f6d6` |              53 |   0 |   0 |          0 |      0 |
| `awehook/blink-mind-desktop`                            | `9592a35003239d7ac9765fc3f59af2dad64666c9` |              99 |  15 |   0 |          5 |      1 |
| `RameshMF/ReactJS-Spring-Boot-CRUD-Full-Stack-App`      | `394c537340f305c2feced7060480da6472534b55` |               9 |   1 |   0 |          0 |      0 |
| `tsurupin/portfolio`                                    | `d3d3cb8a03d5aa428f478a60042038a63f2ee9d8` |              97 |  66 |   0 |         14 |      0 |
| `BradGroux/veritas-kanban`                              | `175de9571757ac3ffb489a2bacff2e81b1fefffc` |            1311 |  52 |   1 |         11 |      3 |
| `transmute-app/transmute`                               | `f7f520159b32f192bf38fc06994fc601ac65a0b3` |             162 |  58 |   0 |         69 |      0 |
| `EkiZR/Portofolio_V5`                                   | `67909d7010ecd504c85be9e1ca8340d7c1605757` |             457 |  38 |   0 |         10 |      0 |
| `functionland/fx-fotos`                                 | `f41e97aba8cf333379f58ad4779c58ec4e4ac514` |             262 |  43 |   0 |          8 |      2 |
| `dharness/react-chat-window`                            | `14f682fa56b2067e58ac7501ad3a6c66e1b14d7b` |              16 |   6 |   1 |          1 |      0 |
| `Sherlockouo/music`                                     | `fa687ea39405ca6696932c9f2852c11620631a67` |             493 | 314 |   0 |         82 |      0 |
| `adrianhajdin/react_native-restate`                     | `d551b8a06b753d11f06851d76bf68ee22c59a9bf` |              55 |  11 |   5 |          5 |      0 |
| `yoonic/nicistore`                                      | `6396e7c9bda270506487c1025046baeb5e231ea8` |             326 |  19 |   0 |          3 |      1 |
| `songxiaoliang/ReactNativeApp`                          | `28764ef3f970ae790dc73740c4cdbcf14981ffd9` |             842 |   1 |   5 |          0 |      0 |
| `bndkt/react-native-app-clip`                           | `54d6b52e533296745f85084e2a3a9b19ddc893b0` |               2 |   1 |   0 |          1 |      0 |
| `WJZ-P/TFT-Hextech-Helper`                              | `34afcaad0bdae081d223cd30766a0b0e783c6cda` |             146 |   0 |   0 |          0 |      0 |
| `misa-j/social-network`                                 | `d99ef7b3c56599e95db7b3d14bbcda76ec3e6714` |              61 |  35 |   0 |         15 |      0 |
| `overlayeddev/overlayed`                                | `f212755853d7a081dad92f65776b33922febd89d` |             112 |  27 |   0 |          6 |      0 |
| `bbplayer-app/BBPlayer`                                 | `44e0a7422a8536b9bbbfa5ac2514d004e04f0411` |             670 |  50 |   0 |         29 |      1 |
| `sneljo1/auryo`                                         | `5180622e43d236feaebd00013f3d78e93f02cac1` |             203 |   0 |   0 |          0 |      0 |
| `nguymin4/react-videocall`                              | `76125f183dfa79bc9645092403ca5fdddd020bc7` |              20 |  11 |   0 |          0 |      0 |
| `Grashjs/cmms`                                          | `6d4934490a760703994f53f61ad0964e58ae13b5` |            2023 |  15 |   3 |          1 |      0 |
| `nfl/react-metrics`                                     | `90786c2631b228a7e97707000247d6dbd92af61f` |              55 |   6 |   1 |          2 |      0 |
| `febobo/react-native-redux-FeInn`                       | `93dd1fa94791df15d822d31dd48ec4482ff8df84` |              89 |   0 |   0 |          0 |      0 |
| `fireyy/react-antd-admin`                               | `7da893392511023941970ba5f1d20274fb3c51be` |              21 |  15 |   1 |          2 |      0 |
| `nelsonkuang/ant-admin`                                 | `4f27ca9c1ea5cc1f6acf6ac72e5154b0fe3247c4` |              33 |   0 |   0 |          0 |      0 |
| `rgommezz/react-native-chatgpt`                         | `5c642347b043a164d3c9afeb9e6609ef1e75922b` |              43 |  36 |   0 |          1 |      0 |
| `nikunjsingh93/react-glass-keep`                        | `043ecd3bef2c1161518afd268cf5d2369ed0d31e` |             433 |  42 |   0 |          4 |      0 |
| `unvalley/ephe`                                         | `4ba31e6cd198491dbf4834050ae804178fb412b3` |             177 |  27 |   0 |         12 |      0 |
| `safe-global/safe-wallet-monorepo`                      | `4e0b23eb1dfcf53ce699909cab0ae4ba2b303d1e` |            2566 |  79 |   9 |         19 |      0 |
| `lionsharecapital/lionshare-desktop`                    | `815ea8769e3891fdc532028ff735b33143c519d6` |              32 |   0 |   0 |          0 |      0 |
| `ltadpoles/react-admin`                                 | `091914e636267ceceed9346eb83c483465e3caaa` |              32 |   0 |   0 |          0 |      0 |
| `santifer/cv-santiago`                                  | `0e5e92954bbd41a06e72bdd23db4b812d80799fa` |             838 |   5 |   1 |          4 |      0 |
| `RARgames/4gaBoards`                                    | `46dca302ef3c826540569015d588dd9b70343dad` |             567 |  30 |   0 |          6 |      3 |
| `southliu/south-admin-react`                            | `9f24027a4a2749094e566c00b382bcbee7e694a4` |             275 |  16 |   0 |          5 |      0 |
| `mrktsm/codecafe`                                       | `877f542643cdf7b5ca1f10098ffbb02bfa8d9726` |             162 |  38 |   0 |          6 |      0 |
| `crisanlucid/vite-react-tailwind-bionic-reading`        | `6aa012a53600967c0703277bd1fa1365d81e1893` |              24 |   0 |   0 |          0 |      0 |
| `creativetimofficial/purity-ui-dashboard`               | `0cdbec0b17661abd280d3e38fafee8b8a3d81d97` |              39 |  10 |   0 |          2 |      1 |
| `NiceDash/Vibe`                                         | `522f299959a6a8e7f36af31c081de0dc13a9c8c5` |              23 |   0 |   0 |          0 |      0 |
| `DLand-Team/moderate-react-admin`                       | `8efd855d60b8a876f3f28350f5893bf8af18a506` |             461 |  63 |   1 |         13 |      0 |
| `netbirdio/dashboard`                                   | `dc86c304637f272dce62380b7b63fa69c90a3f8b` |            1326 | 713 |   0 |        260 |      0 |
| `api-platform/admin`                                    | `0c6efc661e1fed7e3b6f83fb41534be6dec12d93` |              36 |   0 |   0 |          0 |      0 |
| `f/agentlytics`                                         | `d87e4f237448eb8ad3f8f1a77a1df760a3d91d28` |             306 |  29 |   0 |         12 |      2 |
| `clawwork-ai/ClawWork`                                  | `394ec4afac03808d4de7a8001883b7359918c686` |             783 |  54 |   0 |         18 |      3 |
| `Brainfock/Brainfock`                                   | `0474cae83902539012afc22ab148f6b1ef4bbf82` |             645 |  11 |   2 |          1 |      0 |
| `biaochenxuying/blog-react-admin`                       | `220b0aee82506c4daa2d67228f319ad214d0795e` |              92 |  21 |   0 |          2 |      1 |
| `creativetimofficial/black-dashboard-react`             | `26b59be1f1e5e3111f67461ebae393c31f95fa50` |              20 |   3 |   0 |          9 |      0 |
| `LinMoQC/Memory-Blog`                                   | `d9604241e2c6c55c66fcb9f37df87232fecf23da` |             213 |  34 |   0 |          4 |      0 |
| `SolidZORO/leaa`                                        | `78432d6082b50354d189b2a2f20dcb2af1ebc1d5` |             187 |  21 |   0 |          5 |      0 |
| `walljser/cms_community_e_commerce`                     | `d3be35d184cc9b168de7f3a6402d9d6baec91694` |              32 |   0 |   0 |          0 |      0 |
| `open-source-labs/ReacType`                             | `778f660d11575f0d5d701b7ecf2c6ac7fe428856` |             471 | 247 |   0 |         57 |      0 |
| `creativetimofficial/argon-dashboard-react`             | `04b58c36799220d0af4bb8f6e4b1f4a563f17994` |              75 |   2 |   0 |          6 |      0 |
| `phongna07/fireverse`                                   | `c6c18bbe6d8a31f6b19693f608ea264bfc71b190` |             155 |   9 |   0 |          2 |      0 |
| `creativetimofficial/material-tailwind-dashboard-react` | `721f312c444ee7caa300963a042915c6bdcc883b` |              38 |   0 |   0 |          0 |      0 |
| `picturama/picturama`                                   | `b79f0058b7ed3f46ae1f3704e531d3fe9c1d7389` |             118 |  60 |   0 |         10 |      0 |
| `rock-solid/pwa-theme-woocommerce`                      | `a8cd20c7509714121d526ae429e777672fa2bb55` |              38 |   0 |   0 |          0 |      0 |
| `lucavallin/verto`                                      | `f9c0bb05ceb2a1d5f2552060584e315dd876b2c5` |              45 |   0 |   0 |          0 |      0 |
| `sqlrooms/sqlrooms`                                     | `40b6de7dc73c4130db5e23ea6d05360e4843f719` |            2664 |  80 |   0 |         41 |      0 |
| `soroushchehresa/unsplash-wallpapers`                   | `61f0c3ae7d287643f4da5d335e6973b4e19fd7de` |               3 |   3 |   0 |          0 |      0 |
| `Justin-lu/react-redux-antd`                            | `c769cfc6487d8c966ab5b6b232e35f13f8a3b363` |              16 |   6 |   0 |          1 |      0 |
| `itzpradip/react-native-firebase-social-app`            | `ad09dba33ed71ccd2effffe8573be46e8787d7b1` |              78 |  64 |   0 |          1 |      0 |
| `LanceMoe/openai-translator`                            | `3536d2869175a5211a88523a44183d9fc9136fda` |              38 |   0 |   0 |          0 |      0 |
| `RavelloH/NeutralPress`                                 | `8974ae90dae947569c8150208d0d312d90c92728` |            4428 |   0 |   0 |          0 |      0 |
| `alextselegidis/plainpad`                               | `00bc97421399f6e6b38f25258cf91ba2cb5397ab` |              40 |   9 |   0 |          4 |      0 |
| `mihir0699/Video-Chat`                                  | `7717235e7df13e5a1bb5a3325a42eede372143f6` |              36 |   0 |   0 |          0 |      0 |
| `computing-den/unforget`                                | `e519aca810b4175afd408b7c752aae2ecbf75d43` |              88 |   0 |   0 |          0 |      0 |
| `ketchuphq/ketchup`                                     | `3f0355d8fb11177c9bcd25df76a263d40b66949a` |              67 |  42 |   0 |          2 |      0 |
| `wangrongding/wallpaper-box`                            | `d2e488e0e74701811cef0e18b32fd27ebfa93e2e` |             154 |  31 |   0 |          6 |      0 |
| `JSLancerTeam/crystal-dashboard`                        | `a5eb21b0b59c9c8a146e042eaab9b49d945738d7` |             147 |   0 |   0 |          0 |      0 |
| `bluedaniel/Kakapo-app`                                 | `494f5573039a8c9f4070104821a1e560cdd585c9` |              38 |   0 |   0 |          0 |      0 |
| `merikbest/ecommerce-spring-reactjs`                    | `464e610bb11cc2619cf6ce8212ccc2d1fd4277fd` |              98 |  74 |   0 |         11 |      0 |
| `segmentio/analytics-react-native`                      | `4604cffb84967d5145b66c81e0c9b2e8a42e3b37` |              31 |   0 |   0 |          0 |      0 |
| `namespace-ee/upcount`                                  | `65a1abcc99ef4daabfddfb1abc4ab80926db1cb6` |              82 |  27 |   0 |          4 |      1 |
| `moollaza/repo-remover`                                 | `150ef6c7f978162581e3725cadbdd424c9398752` |             194 |  27 |   0 |         14 |      3 |
| `SuperViz/superviz`                                     | `a85943280b11333a1dedbdd94cef7463cd240efd` |             602 |  53 |   0 |         27 |      0 |
| `levelopers/Ecommerce-Reactjs`                          | `d16f0868e9f32d08fbc4f9f5a43896ebd8593edd` |              42 |   6 |   0 |          1 |      2 |
| `davehowson/chat-app`                                   | `7e1cc2bf2b716c75f13a21a8182670377493a1f9` |              21 |  15 |   0 |          1 |      0 |
| `quintuslabs/fashion-cube`                              | `9b1f46b24e6469343e595d304f56638f9c0ecc33` |             161 |  11 |   0 |          1 |      1 |
| `lvwangbeta/Poplar`                                     | `5efad9b9f0184e7091e935f0448aa307c8baa572` |             146 |   0 |   0 |          0 |      0 |
| `Xtrendence/Cryptofolio`                                | `51f7263e77cad118bd8f2244d0ded81e5d647261` |             240 |  32 |   0 |          2 |      0 |
| `mvdicarlo/postybirb`                                   | `afefc76e867694a860308ffd2522d7b14a638422` |             570 | 381 |   0 |         56 |      0 |
| `proshoumma/Mister-Poster`                              | `17b6a1a99ba7c1b4d433cadeac80e4ea75490369` |              25 |   0 |   0 |          0 |      0 |
| `CodeWithHarry/iNotebook-React`                         | `6eaf2b6c919f4d2c6d2fa8327de60bb43319cf7e` |              11 |   5 |   0 |          1 |      1 |
| `seenaburns/isolate`                                    | `608ae13c2ccaed5188f5e1c6225f37bab787ba1d` |              31 |   0 |   0 |          0 |      0 |
| `Cezerin2/Cezerin2`                                     | `256397ed0d8900ccc351a9c1c394e8b4a1ad8081` |             353 |  79 |   0 |          1 |      0 |
| `ErickKS/vite-deploy`                                   | `19f6b9e8e6235a0f36c6f0a6e65ba4d596e7b5a9` |               0 |   0 |   0 |          0 |      0 |
| `tinode/webapp`                                         | `ac779ef31bc46e45b98083625dcf33c4946e6777` |             379 |   0 |   0 |          0 |      0 |
| `ujjavaldesai07/spring-boot-react-ecommerce-app`        | `9ff8fb2994a90514f14b959043d4fd3de7879d84` |              81 |  20 |   0 |          2 |      1 |
| `goshacmd/pabla`                                        | `d7420128103ef594b31046a5bff48375482bcef0` |              83 |   0 |   0 |          0 |      0 |
| `lydiahallie/React-Ecommerce`                           | `10710c7750c3c02d8310e29361b6bd4c71d7b7d7` |               5 |   1 |   0 |          0 |      0 |
| `patrick-michelberger/serverless-shop`                  | `75d14e8f7eb50b35bb05831164ba81c9fa3a6090` |               8 |   5 |   1 |          0 |      0 |
| `dhatGuy/PERN-Store`                                    | `7f25c1b6ef983aff708afbadd21ddc69a970ca8c` |             126 |  21 |   0 |          8 |      0 |
| `dxx/mango-music`                                       | `9497c05b4231092d4c3cf3e35db105522f6c1295` |             108 |   0 |   0 |          0 |      0 |
| `z-9527/admin`                                          | `72aaf2dd05cf4ec2e98f390668b41e128eec5ad2` |              64 |  14 |   0 |          4 |      0 |
| `elbwalker/walkerOS`                                    | `0e21ee4c4d8d81d6dec363cc27766680393e5062` |             445 |  27 |   2 |         11 |      0 |
| `yeahhe365/Prisma`                                      | `f1dc7563b79415b3faff5620c536b7e9ddce3bd2` |             260 |  26 |   1 |          7 |      1 |
| `Fanzzzd/repo-wizard`                                   | `b8b7b2adaee5c542b84a9b098d09771eebffa678` |             368 |  70 |   3 |        192 |      0 |
| `rocketseat-education/nlw-expert-react`                 | `a610fdc6d2c4d1cdbf50557505ce706954ef11cf` |              23 |   3 |   0 |          1 |      0 |
| `inovex/scrumlr.io`                                     | `893bf5524435b03d626573118f3c84a4b4f3cb37` |             334 |  44 |   0 |          9 |      0 |
| `abahmed/Deer`                                          | `6c05356876b74178e664c3074df2f981933acdf6` |              28 |   0 |   0 |          0 |      0 |
| `jrussbautista/dress-shop`                              | `de85642632de6260b7a4ef1fcab33565dcf7f0a8` |             110 |   0 |   0 |          0 |      0 |
| `creativetimofficial/soft-ui-dashboard-react`           | `e282bac09a784b2bab0371e18fd5fd024e798d9e` |             144 |   0 |   0 |          0 |      0 |
| `software-mansion-labs/react-native-rag`                | `ae10ae5ccdbf51a6176d839ed3d118c8e67f098f` |              22 |   7 |   0 |          2 |      0 |
| `Beever-AI/beever-atlas`                                | `a682e62c0bcc4e93000e08d65acaefddfbc5cf05` |             958 |  15 |   1 |          4 |      0 |
| `earthcomfy/lets-chat`                                  | `7a21eac8a0c30565fe5e621baafb1b5a034881e9` |             151 |   0 |   0 |          0 |      0 |
| `veyliss/ai-localbase`                                  | `c64b00806d6f613b8874ddec3ffbd645b477743d` |              77 |  24 |   1 |          0 |      0 |
| `DaiYz/react-native-easy-chat-ui`                       | `4bcdcaf834d84c0638ce8a81e93666d90928a07d` |             117 |  14 |   3 |          9 |      0 |
| `Bourhjoul/Mern-Ecommerce-website`                      | `ceeeeeb17975d91937c22f3df2932e136a612778` |             318 |  33 |   0 |          2 |      1 |
| `LeDat98/NexusRAG`                                      | `1d4791c6b352091f773f276ccbc86a605f55e5b2` |             294 |  16 |   0 |          5 |      0 |
| `1ven/do`                                               | `8ab805130a3104d99b32173c3de34b9742467f83` |             102 |  18 |   0 |          1 |      0 |
| `jotyy/Mantine-Admin`                                   | `8b6f5dcdda08d355b9bb91a0355303ff18593995` |              27 |  16 |   0 |         10 |      0 |
| `Levix0501/notra`                                       | `5e86e77b8af5e7b7646a689bf00fa6cbfadffbf8` |             273 |  16 |   0 |          5 |      0 |
| `sanjeevyadavIT/magento_react_native`                   | `d8233e76d8d934f64ab6a954e8f50900c2a52ad6` |               7 |   2 |   2 |          2 |      0 |
| `ZahraMirzaei/online-shop`                              | `d1133090b03b1c3b2733b1b3a28b9bcf6a66d6e0` |             180 |  25 |   0 |         10 |      0 |
| `DefiLlama/defillama-app`                               | `9d68111635b78984ea9d3dc329c981fee495d86e` |            3996 |  16 |   3 |          6 |      1 |
| `machadop1407/react-socketio-chat-app`                  | `5de1839dda0df003799f6bf9fd18abd5afafc368` |               3 |   3 |   0 |          0 |      0 |
| `arifszn/ezfolio`                                       | `ee272e095ab524efdb23572edef7f8f7ba61398b` |               0 |   0 |   0 |          0 |      0 |
| `leemonade/leemons`                                     | `b1ca5d84d8b2f704e80dea127c9769e16a22201f` |            4698 |  94 |   1 |         41 |      0 |
| `schneidmaster/socializer`                              | `f33cf1d1d6a5afade927b1e98320d4509f4f504d` |              12 |   5 |   0 |          1 |      0 |
| `betaacid/expo-analytics`                               | `bc96553722f75c3c54794b26dccaab9ed86d3ff6` |               1 |   1 |   0 |          0 |      0 |
| `basementstudio/commerce-toolkit`                       | `e6cb9776fe332730fe80b38752ea20fb46172adf` |              22 |  14 |   0 |          4 |      0 |
| `raj074/mern-social-media`                              | `a263449e79a73e70f7c88342f2e4da74caf885bb` |             214 |   0 |   0 |          0 |      0 |
| `kaloraat/react-node-ecommerce`                         | `68a8832b9795873e1823209df3340a0ec72a9094` |             144 |   0 |   0 |          0 |      0 |
| `mohammadoftadeh/next-ecommerce-shopco`                 | `f360acb62dbccdeb421d0c261652deedc74829fd` |              94 |  13 |   0 |          7 |      0 |
| `Syncano/syncano-dashboard`                             | `1db0b4bb20e6fbae3d33a2b575ba3db5c6cee6b5` |             455 |  79 |   0 |          1 |      0 |
| `Rajatm544/MERN-Blog-App`                               | `94f8dc183061a4e12f9b3a062010f0f024c1df8a` |              23 |   0 |   0 |          0 |      0 |
| `LiuYuYang01/ThriveX-Admin`                             | `6ef1271b52408ee16de1c571ec505147d5a8ca89` |             577 | 146 |   0 |        211 |      0 |
| `TheCoderDream/React-Ecommerce-App-with-Redux`          | `a83dde725a9256c784853718edcbc65b4ec8222f` |              23 |   0 |   0 |          0 |      0 |
| `meilisearch/mini-dashboard`                            | `db4553b9aff43c0aa96ebc768a1c384be9099380` |              36 |   0 |   0 |          0 |      0 |
| `kamjin3086/chatless`                                   | `37221c5277d97334544f5d478bd009bd64153e33` |            3597 |   0 |   0 |          0 |      0 |
| `papercups-io/chat-widget`                              | `6349cd16929de29930c230c4dce83a23c59af65f` |              17 |   3 |   2 |          1 |      0 |
| `design-sparx/antd-multipurpose-dashboard`              | `8e0844adca5413aab1f7ddec1274161ed6d4f481` |             229 |   0 |   0 |          0 |      0 |
| `stephensanwo/fullstack-ai-chatbot`                     | `256471e51d69c30034ac2c57b197c41c548a4a0b` |              18 |   8 |   1 |          2 |      0 |
| `DanialK/ReactJS-Realtime-Chat`                         | `0de312909cd87dbea84106a2364775017c063aa1` |              27 |   0 |   0 |          0 |      0 |
| `funador/react-auth-client`                             | `828aff3648f474f713897b312c83959739a7fda0` |               0 |   0 |   0 |          0 |      0 |
| `ecency/ecency-mobile`                                  | `03aaf0cae141f2017515bf9104130bcc2d19ebf8` |            1827 |  15 |   1 |          5 |      0 |
| `nusr/excel`                                            | `b341827e621578ea60f67d07e130b82b7af9206e` |             437 |  18 |   2 |          5 |      0 |
| `stuyy/chat-platform-react`                             | `b981b76a543a88664181552b66ada6c68546a34e` |             118 |  23 |   0 |          1 |      0 |
| `baimingxuan/react-admin-design`                        | `c0527d07725a840e49f01c1b979b1786719d5d60` |             123 |  26 |   0 |          5 |      0 |
| `bmcmahen/toasted-notes`                                | `f8e871d75d3bf5bf38bd7470ea5db541140e068a` |              12 |  10 |   0 |          1 |      0 |
| `burakorkmez/react-admin-dashboard`                     | `942f0d8da7a8415d5cb4e487d81371f132530286` |             199 |   0 |   0 |          0 |      0 |
| `danloh/mdSilo-web`                                     | `ad05af63072cace38cd09f2082ab5e4443f3b7be` |             184 |  45 |   0 |         13 |      0 |
| `baiwumm/react-admin`                                   | `3dff9a280076e8769274f3bbee769ed5875a82fd` |             187 |  26 |   0 |          8 |      1 |
| `ed-roh/react-ecommerce`                                | `d59ca117e7d80cd67275d8b4a50946499e531fba` |              40 |   3 |   0 |          2 |      0 |
| `seawind8888/Nobibi`                                    | `9291a64da742f0df3b2e0537aaa7387946436dd1` |              57 |  11 |   2 |          6 |      0 |
| `enatega/shopping-cart-ecommerce`                       | `e8ddaa887f5eaa9c84e46e43b5e017535c3c3c1f` |             336 |  29 |  15 |          2 |      3 |
| `dabit3/heard`                                          | `37827ed2f17c80df824b79b40d7b019b89be2054` |              25 |   0 |   0 |          0 |      0 |
| `composify-js/composify`                                | `1012d6c2d75dfd595f11ef041ef178bf7a64d77d` |              94 |  34 |   0 |          5 |      0 |
| `stellar/dashboard`                                     | `820a1799782ef845d91e9881ccab5aebb503c968` |              27 |   0 |   0 |          0 |      0 |
| `burdy-io/burdy`                                        | `c3ca6c71af916b9ca516195a52a70f28fab77331` |             789 |  10 |   0 |          1 |      0 |
| `walljser/community_e_commerce`                         | `5f9fc50fe475eaecca1f2df073238f3ce695ac33` |              72 |  56 |   0 |         12 |      0 |
| `Ujjalzaman/Easy-Consulting-react`                      | `bcfc925bd64583dda3ccb8bf5bebbe323842a2c0` |              43 |  16 |   0 |          3 |      0 |
| `andrewcoelho/react-text-editor`                        | `c49525b5fd5de7e344c4ec34651cb602ddf50c23` |              14 |   0 |   0 |          0 |      0 |
| `trananhtuat/tua-react-admin`                           | `faf7ba16310804d545c1d3ee30dc007e471d8d8d` |              20 |   4 |   0 |          1 |      0 |
| `ZainRk/React-Admin-Dashboard-public`                   | `f0bcc12a9ec2a5365afaf20d22c69ef1c9b0f5f2` |               9 |   6 |   0 |          1 |      0 |
| `creativetimofficial/paper-dashboard-react`             | `c2ecf79745fde8ad3270482d371ea12106c0832a` |              33 |   0 |   0 |          0 |      0 |
| `ele828/leanote-ios-rn`                                 | `64630b23f635f962ff24147499fc34a80c95e4ff` |            2444 |   0 |   0 |          0 |      0 |
| `yTakkar/React-Mini-Social-Network`                     | `241f0b49f6990fb8d3b8f4aed899699b972bfc5b` |             145 |   8 |  11 |          2 |      1 |
| `MrXujiang/XPCMS`                                       | `0a97ce2584696b73198e96a05b759df091abea41` |              19 |   9 |   0 |          1 |      0 |
| `adrianhajdin/travel-agency-dashboard`                  | `23917fb7fddf12a2919ec37ddc1d6c0216f4d9b6` |              29 |   0 |   0 |          0 |      0 |
| `converge/instapy-dashboard`                            | `90bd22f8f9ec29b56b86fa8354fed02563f23fcb` |               4 |   1 |   0 |          3 |      0 |
| `inifarhan/skaters`                                     | `e8a4651b4f29b367d62cd418aa863381c315452f` |             142 |   0 |   0 |          0 |      0 |
| `acmerobotics/ftc-dashboard`                            | `aae0df366c6e1f80182ef7a03a3bd56f46b9b432` |             188 |  28 |   1 |          9 |      2 |
| `taniarascia/chat`                                      | `c2ee1db738bf7909cc70a23e9919654b11152d78` |              30 |   0 |   0 |          0 |      0 |
| `OpenBeta/open-tacos`                                   | `8475c90ad446f2212c15a0b5a36781bf9ced5958` |             710 |  57 |   0 |         23 |      0 |
| `liuguanhua/react-antd-admin`                           | `dce57d27274a27d1a51269eecbc710a8e10b5df9` |             212 |   0 |   0 |          0 |      0 |
| `elibenjii/ecommerce-react`                             | `e33df7e45c3e347f068471d3cb6f4116dd405a40` |              28 |   0 |   0 |          0 |      0 |
| `bkywksj/knowledge-base`                                | `9dd05ca4c722c58b6f4b5642b203d6e42958bcc6` |            1641 |  64 |   0 |         10 |      0 |
| `loveRandy/react-admin`                                 | `19d46c1421df1a16ee64eb550aabd8087e04f0b2` |              20 |   6 |   0 |          3 |      0 |
| `bidah/universal-medusa`                                | `d5db8f3f2f015c1e9ef874c3a9c31fc5e17bce1e` |               6 |   0 |   2 |          3 |      0 |
| `creativetimofficial/muse-ant-design-dashboard`         | `398402ba8e1f736b9203db6ddef03839c64d53ac` |             107 |   0 |   0 |          0 |      0 |
| `zeus-12/uxie`                                          | `6d6d326b9181db5e87b1443bceb4cded158025cd` |             230 |  18 |   2 |         21 |      0 |
| `seanmiller802/BrowserTime`                             | `9d472ef807bd2f33dbbeecf86d6527ed364123c8` |              49 |   0 |   0 |          0 |      0 |
| `ensdomains/ens-app-v3`                                 | `71758582017b667ba6d5a5380563dc0e1e5589d3` |             724 |  68 |   0 |         13 |      3 |
| `yonatanmgr/mathberet`                                  | `818c54c51df9ba9ecf177d495d016422d1598dee` |             126 |  76 |   0 |          4 |      0 |
| `llorentegerman/react-admin-dashboard`                  | `c7bf047a09745c744d020bb4e6e0da54b21378cd` |              51 |   0 |   0 |          0 |      0 |
| `j471n/j471n.in`                                        | `7f76fee8337422aee6add6455750306a554cb5c4` |             604 |  62 |   0 |        343 |      0 |
| `praveen-sripati/nexus`                                 | `87a961ae5a1969a477aef6cfb0a7c17851db91c4` |             436 |  35 |   0 |          5 |      0 |
| `coderdost/MERN-ecommerce-Frontend`                     | `89845dd6f2ec3cc9719775299a561cb2da86bfbf` |             461 |  25 |   0 |          7 |      0 |
| `boluo2077/deep-rag`                                    | `71d933c279d7fe620f8cded65fbeeae9e88c9707` |              24 |   0 |   0 |          0 |      0 |
| `satnaing/satnaing.dev`                                 | `d6d35ce1e435cfd96bac0dec31b9140452ff519f` |               0 |   0 |   0 |          0 |      0 |
| `Bereky/mern-ecommerce`                                 | `0d6128b354e7f41d6e29563090e52873a0382500` |              38 |   7 |   0 |          1 |      0 |
| `bldrs-ai/Share`                                        | `c195d3707ca8f32100f5b9bd5758e62cb3aa6f6c` |             407 |   0 |   0 |          0 |      0 |
| `alexindigo/ndash`                                      | `875c4b61cb9e32a297ea87432f3fc2b89e289f60` |              75 |  11 |   0 |          1 |      0 |
| `ruppysuppy/Pizza-Man`                                  | `fbba955958c5c3eaa144fee50266b3a8c0e0f913` |              19 |  12 |   0 |          4 |      0 |
| `jeandv/jeanrondon.dev`                                 | `01e3b23973c2c61862bfa6a258555dfbfe1a6785` |             103 |   8 |   0 |          5 |      0 |
| `eminbasbayan/full-stack-e-commerce`                    | `0a9a95e62ccea1c06f7cd950319e998c433df477` |             163 |  45 |   0 |         40 |      0 |
| `developer-junaid/DeveloperFolio`                       | `a3aca36b3ae435dc34fbc919fa04317977db157c` |              44 |  18 |   0 |          1 |      1 |
| `creativetimofficial/vision-ui-dashboard-react`         | `78762699ec3de2882dda9ee9ea3bec164fc94f88` |             103 |   8 |   0 |         12 |      0 |
| `e2b-dev/dashboard`                                     | `5fa0e6c153223c94cef379f1dc719af5707e1560` |             962 |  21 |   3 |          6 |      0 |
| `betterlytics/betterlytics`                             | `2c6fbc930c8db43e1b7bfb74fa17dfb980cb545b` |            1657 | 701 |   6 |        475 |      0 |
| `Skyfay/SkySend`                                        | `c39bbb118a075f13076bf5a69291790ce2cdb55c` |             294 |  12 |   0 |          7 |      0 |
| `ajaybor0/MERN-eCommerce`                               | `b050178e2b46a59f3070761d7fcd0ce869b2a785` |              54 |   0 |   0 |          0 |      0 |
| `focallocal/fl-maps`                                    | `4b43a50cb113f5dab03073cbba79aa00f3e317c9` |             155 |  15 |   0 |          4 |      0 |
| `rahulsahay19/Java-React-FullStack`                     | `143f6325bb78a2d58edd177746c698cb4bd29987` |              34 |   0 |   0 |          0 |      0 |
| `betomoedano/ChatApp`                                   | `22b59882220ab7c21246d2c24f6c6f84edbfc077` |              21 |  12 |   0 |          0 |      0 |
| `ButterCMS/react-cms-blog-with-next-js`                 | `d18b1c86cb7569846f6beb3db38ad73178246a0c` |              54 |   0 |   0 |          0 |      0 |
| `john-smilga/react-phone-e-commerce-project`            | `a6c25aac214915e9d0700f1789c356bdeb542759` |              11 |   3 |   0 |          1 |      2 |
| `kriziu/collabio`                                       | `9ca643c5a33baeae836ea1440b4690c103eb3118` |              88 |   0 |   0 |          0 |      0 |
| `Timonwa/react-chat`                                    | `bbb955566015a274c3c25f1542fb1e293d3da9f3` |               6 |   1 |   0 |          0 |      0 |
| `chenjun1127/react-antd-admin`                          | `73645f0388d06e956c7d83d379096d9ef5b9fa52` |              38 |   0 |   0 |          0 |      0 |
| `creativetimofficial/now-ui-dashboard-react`            | `882f872ad8745333cfa721798c48edd9cd834150` |              17 |   6 |   0 |          2 |      0 |
| `AdamNowotny/BuildReactor`                              | `681389fbd2469dd31f84382d16e057bd6a879f80` |              54 |  16 |   0 |          3 |      0 |
| `guyariely/noteworthy`                                  | `48c786b63acbb433c37475790cf2c2afe1094a0a` |              33 |   0 |   0 |          0 |      0 |
| `creativetimofficial/nextjs-argon-dashboard`            | `801c7c4a8f1018928c6ef69ce4b1b30231eb1f96` |             141 |   0 |   0 |          0 |      0 |
| `prabinmagar/dashboard-ui-with-reactjs`                 | `bc1df8dc03dfb08bc226116408f4014cb1a16d13` |              15 |   0 |   0 |          0 |      0 |
| `pattjoshi/Multi_vondor_E_shop`                         | `6249026e7397ffea9e6bba7363abce4973eba480` |             533 | 168 |   0 |         98 |      0 |
| `taskrabbit/react-native-zendesk-chat`                  | `87c1148ac519abc04e63dc8eb57449c1e1264d57` |               0 |   0 |   0 |          0 |      0 |
| `Morelitea/initiative`                                  | `20adae10495f6b5f61159569fdcb6cf8c2a2c0e9` |            2502 |   0 |   0 |          0 |      0 |
| `Saurabh-8585/MERN-E-Commerce-Frontend`                 | `3fa84b0271f020cb7d927d4f4e69fb7f00d27e85` |             127 |  25 |   0 |          1 |      0 |
| `ConnectyCube/connectycube-reactnative-samples`         | `88f88fff58705e9c9db317f17356db99f7094d1e` |             129 |   0 |   0 |          0 |      0 |
| `0mar-helal/multimart-react-ecommerce`                  | `4bb42e5a59afa971cb97209f151324a2442430dd` |              14 |   0 |   0 |          0 |      0 |
| `PierreCapo/react-native-socials`                       | `4111a23f2a44344f4144a6431dc901a9c51d8597` |              40 |  15 |   0 |          1 |      0 |
| `mudzikalfahri/wefootwear-store`                        | `f661b9752679dd31e81b40b05c7a5d9508e188f9` |             191 |  30 |   0 |          8 |      0 |
| `ElSierra/Social-app-React-Native`                      | `81f4784e9fe4b45d4130c4b8d37d82e2ee6a7d57` |             376 |   0 |   0 |          0 |      0 |
| `unrealmanu/ga-4-react`                                 | `ec99a94fdf391f925424d9717adc0310674d4a65` |               9 |   2 |   2 |          1 |      0 |
| `taiwo-adewale/ecommerce-admin`                         | `dc58dd39e9de5ed49b18e051d3d0b7de0e7e05fa` |             283 |  15 |   0 |          2 |      0 |
| `mithunjmistry/ecommerce-React-Redux-Laravel`           | `8f5b0d1b41d2cee6fe0af7caf04a3779d4e65eb9` |               0 |   0 |   0 |          0 |      3 |
| `cktang88/spaceboard`                                   | `7d35cea3ec06b5d01733055171b1d3be89b0d04d` |               6 |   1 |   1 |          1 |      0 |
| `seeden/react-g-analytics`                              | `538e8b3820629f9a4b0fbe38ac4e961b6fbfe622` |               5 |   2 |   1 |          0 |      0 |
| `DulanjaliSenarathna/react-chat-app`                    | `adff7ba06981b9066115e08360a9da7dd14e7853` |             141 |   0 |   0 |          0 |      0 |
| `themisvaltinos/Auction-Website`                        | `f456b561de45112945b5c55ebd5b1dede9b662f5` |             212 |   0 |   0 |          0 |      0 |
| `Govind783/react-e-commerce-`                           | `b65530c93db728caa0d6b3450526a96cbcf17253` |             220 |   0 |   0 |          0 |      0 |
| `damianstone/toogether-mobile`                          | `27a5e7fae1e99326e770ae89932be72a5aa00a86` |             237 |  29 |   0 |          5 |      0 |
| `neiker/analytics-react-native`                         | `f412a339dc16425eba9b7a573f4b1e87e8ca3977` |               1 |   1 |   0 |          0 |      0 |
| `YashMarmat/FullStack_Ecommerce_App`                    | `31a190f75f8f38a2a9b2798c1d4fc3bf2cbbd1a9` |              61 |  14 |   0 |          3 |      2 |
| `ximing/weditor`                                        | `a2bf6386d8443c68ba4cb6295276dfcc75569db9` |              96 |  44 |   0 |         16 |      0 |
| `offlegacy/event-tracker`                               | `25dd8e334f098cfa79b4d1464c4996a06cf2354a` |              39 |  18 |   0 |          5 |      0 |
| `FLiotta/Yasei`                                         | `1e1d25759bf4dfa2f912f2a004301d1120ba3134` |              28 |   0 |   0 |          0 |      0 |
| `gianlucajahn/react-ecommerce-store`                    | `ae46562743b2e350cfd52deab3f831008a9fcedf` |              92 |  13 |   2 |          3 |      0 |
| `dch133/Social-Media-App`                               | `482ea6ba88fa0799dd653fb5b914d730909817a0` |              17 |  12 |   0 |          1 |      0 |
| `Mohitur669/Realtime-Collaborative-Code-Editor`         | `da2825bc6d17ee86383f612b984d24fa880b0506` |               8 |   4 |   0 |          1 |      0 |
| `Qeagle/reporter-engine`                                | `4d06c2f3f68510cdf6df899c392bfc9b70d3ca95` |            1791 |  10 |   0 |          6 |      0 |
| `HosseinNamvar/bitex`                                   | `4b4eb59134b4315788fa772cbb5dda5e24ddfe6d` |             352 |  24 |   0 |          9 |      1 |
| `coding-with-chaim/react-video-chat`                    | `b8b9ad42912d76730b9716c4607b5897a7ab17e2` |               9 |   5 |   0 |          0 |      0 |
| `concrnt/concrnt-world`                                 | `bd43334c55e58a8aa3e5905bafce55512e737e41` |             822 |  12 |   1 |          2 |      0 |
| `etesync/etesync-notes`                                 | `3b1d1401dd40448781dfc1215e4fc5415b1ab51f` |             207 |   0 |   0 |          0 |      0 |
| `vivekkakadiya/Organica`                                | `c77525b7025ee60f25e1d30620ef7712bf0b8bb8` |              56 |  15 |   0 |          2 |      0 |
| `jagjot26/faeshare`                                     | `615d0cd14cfb78a39e0518cc861c623fea8f0779` |             267 |  14 |   0 |          4 |      0 |
| `UsamaSarwar/reactnative-ecommerce-charlie`             | `379b0f7a11839ea72345c7b504ed42209e695912` |             421 |   0 |   0 |          0 |      0 |
| `ReactNativeSchool/react-native-social-media-app`       | `115624705ad926d88eea4ee153448ec7fbb951b1` |              11 |  11 |   0 |          0 |      0 |
| `shubham1710/MERN-E-Commerce`                           | `fb2e90941b791220022fcef6d3daf4a8e8a41c9e` |               9 |   4 |   0 |          0 |      0 |
| `yTakkar/MERN-Social-Network`                           | `9e10342cadab3517b56d2245964d045f1fc1cf7f` |               0 |   0 |   0 |          0 |      0 |
