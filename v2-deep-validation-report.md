# react-doctor v2 — Deep Validation Across 528 Repos

- **Date**: 2026-05-12
- **Repos targeted**: 528 (1 still in-flight for v2 run at report time; replaced by retry if needed)
- **Repos analyzed**: 528
- **Repos with findings**: 514
- **Total raw diagnostics across all repos**: 514956
- **Total classified findings (after grouping duplicates)**: 26977

## Command used

```bash
node packages/react-doctor-v2/bin/react-doctor.js <repo-path> \
  --json --json-compact --offline --full --no-dead-code --fail-on none
```

> Note: the original task spec listed `--yes --full`, but the v2 CLI rejects that combination (`Cannot combine --yes and --full`). `--full` already forces a full scan and skips prompts (see `packages/react-doctor-v2/src/cli/index.ts:902,1235-1240`), so `--yes` was dropped without losing semantics.

## Verdict totals

Two views: entry-level (each grouped finding = 1) vs occurrence-weighted (groups expanded by `occurrences` or summary).

| Verdict | Findings (entries) | Diagnostics (weighted) |
|---|---|---|
| TP | 18366 | 128160 |
| FP | 908 | 29520 |
| Borderline | 7492 | 47248 |
| Missed | 193 | 191 |
| **Total** | **26959** | **205119** |

## Rule reliability (top 30 by report volume)

| Rule | Total | TP | FP | Borderline | Missed | Top recommendation |
|---|---|---|---|---|---|---|
| `react-doctor/tailwind-no-default-palette` | 1098 | 5 | 0 | 1093 | 0 | Keep rule |
| `react-doctor/no-icon-only-button-without-label` | 891 | 784 | 49 | 54 | 2 | Keep rule |
| `react-doctor/tailwind-no-redundant-size-axes` | 738 | 34 | 0 | 704 | 0 | Keep rule |
| `react-doctor/no-array-index-as-key` | 636 | 122 | 1 | 493 | 17 | Keep rule |
| `react-hooks/exhaustive-deps` | 601 | 567 | 13 | 21 | 0 | Keep rule |
| `react-hooks(exhaustive-deps)` | 557 | 519 | 0 | 38 | 0 | Keep rule |
| `react-doctor/js-combine-iterations` | 550 | 345 | 6 | 197 | 2 | Keep rule |
| `jsx-a11y(click-events-have-key-events)` | 491 | 489 | 0 | 2 | 0 | Keep rule |
| `jsx-a11y(no-static-element-interactions)` | 435 | 433 | 0 | 2 | 0 | Keep rule |
| `effect(no-event-handler)` | 345 | 324 | 1 | 20 | 0 | Keep rule |
| `react-doctor/no-cascading-set-state` | 334 | 320 | 4 | 10 | 0 | Keep rule |
| `react-doctor/no-giant-component` | 326 | 238 | 3 | 84 | 1 | Keep rule |
| `react-doctor/rerender-split-combined-hooks` | 315 | 205 | 1 | 109 | 0 | Keep rule |
| `react-doctor/rerender-state-only-in-handlers` | 313 | 272 | 13 | 28 | 0 | Keep rule |
| `react-doctor/prefer-useReducer` | 305 | 109 | 0 | 196 | 0 | Keep rule |
| `react-doctor/client-event-listeners` | 298 | 82 | 5 | 205 | 5 | Keep rule |
| `effect/no-event-handler` | 292 | 205 | 15 | 66 | 0 | Keep rule |
| `react-doctor/no-full-lodash-import` | 290 | 180 | 6 | 98 | 6 | Keep rule |
| `react-doctor/tailwind-no-space-on-flex-children` | 275 | 17 | 0 | 258 | 0 | Keep rule |
| `effect(no-derived-state)` | 273 | 269 | 0 | 4 | 0 | Keep rule |
| `react-doctor/rendering-hydration-mismatch-time` | 263 | 190 | 44 | 28 | 0 | Keep rule |
| `react-doctor/effect-no-initialize-state` | 257 | 242 | 2 | 13 | 0 | Keep rule |
| `effect/no-derived-state` | 248 | 233 | 2 | 13 | 0 | Keep rule |
| `react-doctor/no-effect-event-handler` | 246 | 222 | 6 | 17 | 0 | Keep rule |
| `react-doctor/no-generic-handler-names` | 245 | 186 | 2 | 57 | 0 | Keep rule |
| `react-doctor/async-await-in-loop` | 244 | 143 | 28 | 72 | 0 | Keep rule |
| `react-doctor/effect-no-event-handler` | 240 | 201 | 6 | 32 | 0 | Keep rule |
| `react-doctor/i18n-no-dynamic-translation-key` | 232 | 187 | 6 | 39 | 0 | Keep rule |
| `react-doctor/no-react19-deprecated-apis` | 228 | 39 | 10 | 179 | 0 | Keep rule |
| `react-doctor/rendering-svg-precision` | 216 | 95 | 4 | 116 | 1 | Keep rule |

## Top false-positive categories

| Rule | FP count | Example |
|---|---|---|
| `react-doctor/no-icon-only-button-without-label` | 49 | 027xiguapi/pear-rec: src/Screenshots/operations/Search/index.tsx:37 |
| `react-doctor/rendering-hydration-mismatch-time` | 44 | 1ven/do: client/components/Comments.js:34 |
| `react-doctor/async-await-in-loop` | 28 | 027xiguapi/pear-rec: src/components/recorderAudio/AudioRecorder.tsx:149 |
| `react-hooks/rules-of-hooks` | 24 | AdamNowotny/BuildReactor: src/options/layout.tsx:38 |
| `react-doctor/server-serialization` | 24 | BlackHatDevX/openspot-music-app: app/(tabs)/library.tsx:261 |
| `react-hooks-js/todo` | 21 | Fanzzzd/repo-wizard: src/hooks/usePromptGenerator.ts:191 |
| `react-doctor/no-secrets-in-client-code` | 17 | DeadWaveWave/opencove: tests/e2e/workspace-canvas.terminal-paste.linux.spec.ts:5 |
| `react-doctor/js-set-map-lookups` | 15 | 027xiguapi/pear-rec: public/ffmpeg@0.12.5/ffmpeg-core.js:8 |
| `react-doctor(no-icon-only-button-without-label)` | 15 | 777genius/agent-teams-ai: src/renderer/components/ui/select.tsx:76 |
| `effect/no-event-handler` | 15 | AykutSarac/jsoncrack.com: packages/jsoncrack-react/src/JSONCrackComponent.tsx:168 |
| `react-doctor/rerender-state-only-in-handlers` | 13 | 027xiguapi/pear-rec: src/components/setting/shortcutSetting.tsx:11 |
| `react-hooks/exhaustive-deps` | 13 | 79E/ChatGpt-Web: src/pages/chat/index.tsx:1 |
| `oxlint/unknown` | 12 | Automattic/wp-calypso: packages/odie-client/types/index.d.ts:41 |
| `react/no-unknown-property` | 11 | Bourhjoul/Mern-Ecommerce-website: frontend/src/pages/Login/LoginScreen.js:84 |
| `react-doctor(shadcn-no-direct-radix-import)` | 11 | CapSoftware/Cap: apps/web/...: |
| `react-doctor/no-react19-deprecated-apis` | 10 | 027xiguapi/pear-rec: src/Screenshots/ScreenshotsOption/index.tsx:6 |
| `react-doctor(no-react19-deprecated-apis)` | 10 | 777genius/agent-teams-ai: src/renderer/components/ui/textarea.tsx:5 |
| `react-doctor/no-dynamic-import-path` | 9 | 027xiguapi/pear-rec: public/ffmpeg@0.12.5/ffmpeg-core.worker.js:41 |
| `react-doctor/async-parallel` | 9 | 79E/ChatGpt-Web: various:1 |
| `react-hooks-js(todo)` | 9 | AmanVarshney01/create-better-t-stack: src/app/(home)/_components/npm-package.tsx:12 |
| `react-doctor/nextjs-no-img-element` | 9 | BasedHardware/omi: web/admin/app/(protected)/dashboard/apps/page.tsx:1 |
| `react(no-unknown-property)` | 8 | 027xiguapi/pear-rec: src/components/update/Modal/index.tsx:40 |
| `react-doctor/no-barrel-import` | 8 | 027xiguapi/pear-rec: src/App.tsx:3 |
| `react-doctor/client-passive-event-listeners` | 8 | 0mar-helal/multimart-react-ecommerce: src/components/Navbar/Navbar.jsx:18 |
| `react-doctor/rendering-activity` | 8 | 1ven/do: client/containers/modals/FullCardModal.js:35 |

## Per-repo summary

| Repo | Commit | Raw issues | TP | FP | Border | Missed | Report |
|---|---|---|---|---|---|---|---|
| 027xiguapi/pear-rec | `73df24f7` | 483 | 35 | 0 | 9 | 0 | `reports/027xiguapi__pear-rec.md` |
| 0mar-helal/multimart-react-ecommerce | `4bb42e5a` | 14 | 14 | 0 | 0 | 0 | `reports/0mar-helal__multimart-react-ecommerce.md` |
| 1ven/do | `8ab80513` | 102 | 18 | 0 | 1 | 0 | `reports/1ven__do.md` |
| 777genius/agent-teams-ai | `3f3569e1` | 3992 | 1279 | 563 | 643 | 1 | `reports/777genius__agent-teams-ai.md` |
| 79E/ChatGpt-Web | `91bbcb49` | 219 | 130 | 18 | 71 | 0 | `reports/79E__ChatGpt-Web.md` |
| abahmed/Deer | `6c053568` | 28 | 25 | 1 | 2 | 0 | `reports/abahmed__Deer.md` |
| acmerobotics/ftc-dashboard | `aae0df36` | 188 | 28 | 1 | 9 | 2 | `reports/acmerobotics__ftc-dashboard.md` |
| actualbudget/actual | `b61732e2` | 1693 | 1377 | 127 | 144 | 0 | `reports/actualbudget__actual.md` |
| AdamNowotny/BuildReactor | `681389fb` | 54 | 16 | 0 | 3 | 0 | `reports/AdamNowotny__BuildReactor.md` |
| adrianhajdin/aora | `d782c5f7` | 77 | 16 | 0 | 3 | 0 | `reports/adrianhajdin__aora.md` |
| adrianhajdin/ecommerce_sanity_stripe | `c4d1c059` | 28 | 28 | 0 | 0 | 0 | `reports/adrianhajdin__ecommerce_sanity_stripe.md` |
| adrianhajdin/project_medical_pager_chat | `b5a536ba` | 59 | 45 | 0 | 3 | 0 | `reports/adrianhajdin__project_medical_pager_chat.md` |
| adrianhajdin/project_shareme_social_media | `0989dcbe` | 48 | 30 | 4 | 14 | 0 | `reports/adrianhajdin__project_shareme_social_media.md` |
| adrianhajdin/react_native-restate | `d551b8a0` | 55 | 11 | 5 | 5 | 0 | `reports/adrianhajdin__react_native-restate.md` |
| adrianhajdin/social_media_app | `9fa032dd` | 27 | 26 | 0 | 1 | 0 | `reports/adrianhajdin__social_media_app.md` |
| adrianhajdin/travel-agency-dashboard | `23917fb7` | 29 | 22 | 0 | 7 | 0 | `reports/adrianhajdin__travel-agency-dashboard.md` |
| aidenybai/bippy | `01338495` | 101 | 2 | 8 | 15 | 0 | `reports/aidenybai__bippy.md` |
| aidenybai/react-grab | `ded2843b` | 440 | 20 | 12 | 19 | 3 | `reports/aidenybai__react-grab.md` |
| aidenybai/react-scan | `ec7b00f6` | 308 | 6 | 9 | 6 | 1 | `reports/aidenybai__react-scan.md` |
| ajaybor0/MERN-eCommerce | `b050178e` | 54 | 16 | 14 | 24 | 0 | `reports/ajaybor0__MERN-eCommerce.md` |
| ajnart/homarr | `c5873c6e` | 272 | 197 | 0 | 29 | 0 | `reports/ajnart__homarr.md` |
| alexindigo/ndash | `875c4b61` | 75 | 11 | 0 | 1 | 0 | `reports/alexindigo__ndash.md` |
| alextselegidis/plainpad | `00bc9742` | 40 | 9 | 0 | 4 | 0 | `reports/alextselegidis__plainpad.md` |
| alibaba/formily | `d9a46442` | 341 | 35 | 1 | 7 | 3 | `reports/alibaba__formily.md` |
| alishobeiri/thread-notebook | `1c905d98` | 322 | 55 | 2 | 27 | 0 | `reports/alishobeiri__thread-notebook.md` |
| AmanVarshney01/create-better-t-stack | `163de4d0` | 348 | 47 | 2 | 10 | 2 | `reports/AmanVarshney01__create-better-t-stack.md` |
| amicalhq/amical | `27c0117a` | 481 | 49 | 0 | 19 | 3 | `reports/amicalhq__amical.md` |
| ammarahm-ed/react-native-actions-sheet | `32064ccb` | 93 | 27 | 1 | 33 | 0 | `reports/ammarahm-ed__react-native-actions-sheet.md` |
| amruthpillai/reactive-resume | `c5787fe1` | 665 | 55 | 0 | 15 | 0 | `reports/amruthpillai__reactive-resume.md` |
| andrewcoelho/react-text-editor | `c49525b5` | 14 | 10 | 4 | 0 | 0 | `reports/andrewcoelho__react-text-editor.md` |
| anisul-Islam/react-assignment-1-products-listing-app | `98d06a63` | — | 0 | 0 | 0 | 0 | `reports/anisul-Islam__react-assignment-1-products-listing-app.md` |
| apache/answer | `fca80abb` | 940 | 733 | 65 | 91 | 0 | `reports/apache__answer.md` |
| apache/superset | `e2a8a88d` | 7027 | 2307 | 2220 | 2500 | 1 | `reports/apache__superset.md` |
| api-platform/admin | `0c6efc66` | 36 | 26 | 0 | 10 | 0 | `reports/api-platform__admin.md` |
| apitable/apitable | `88b24ce9` | 17237 | 105 | 0 | 12 | 0 | `reports/apitable__apitable.md` |
| appsmithorg/appsmith | `5574db21` | 6668 | 4003 | 1302 | 243 | 0 | `reports/appsmithorg__appsmith.md` |
| arifszn/ezfolio | `ee272e09` | — | 0 | 0 | 0 | 0 | `reports/arifszn__ezfolio.md` |
| attentiveness/reading | `13df95d3` | 35 | 14 | 9 | 12 | 0 | `reports/attentiveness__reading.md` |
| Automattic/wp-calypso | `b17c2f3f` | 23519 | 19409 | 274 | 3836 | 0 | `reports/Automattic__wp-calypso.md` |
| awehook/blink-mind-desktop | `9592a350` | 99 | 15 | 0 | 5 | 1 | `reports/awehook__blink-mind-desktop.md` |
| aws-samples/bedrock-chat | `f2f1c98f` | 321 | 182 | 0 | 51 | 0 | `reports/aws-samples__bedrock-chat.md` |
| aws-samples/swift-chat | `b452cbfa` | 409 | 320 | 35 | 54 | 0 | `reports/aws-samples__swift-chat.md` |
| AykutSarac/jsoncrack.com | `ffd250b5` | 128 | 10 | 13 | 9 | 0 | `reports/AykutSarac__jsoncrack.com.md` |
| baimingxuan/react-admin-design | `c0527d07` | 123 | 26 | 0 | 5 | 0 | `reports/baimingxuan__react-admin-design.md` |
| baiwumm/react-admin | `3dff9a28` | 187 | 26 | 0 | 8 | 1 | `reports/baiwumm__react-admin.md` |
| bangle-io/bangle-io | `c000a575` | 234 | 76 | 0 | 4 | 0 | `reports/bangle-io__bangle-io.md` |
| baptisteArno/typebot.io | `67c7c86b` | 1309 | 6 | 8 | 4 | 2 | `reports/baptisteArno__typebot.io.md` |
| BasedHardware/omi | `c1b84fff` | 3064 | 1705 | 254 | 1103 | 2 | `reports/BasedHardware__omi.md` |
| basementstudio/commerce-toolkit | `e6cb9776` | 22 | 14 | 0 | 4 | 0 | `reports/basementstudio__commerce-toolkit.md` |
| batnoter/batnoter | `8722c3af` | 30 | 27 | 0 | 3 | 0 | `reports/batnoter__batnoter.md` |
| bbplayer-app/BBPlayer | `44e0a742` | 670 | 50 | 0 | 29 | 1 | `reports/bbplayer-app__BBPlayer.md` |
| Beever-AI/beever-atlas | `a682e62c` | 958 | 486 | 5 | 425 | 0 | `reports/Beever-AI__beever-atlas.md` |
| benoitvallon/react-native-nw-react-calculator | `4f9628fa` | 25 | 10 | 15 | 0 | 0 | `reports/benoitvallon__react-native-nw-react-calculator.md` |
| Bereky/mern-ecommerce | `0d6128b3` | 38 | 7 | 0 | 1 | 0 | `reports/Bereky__mern-ecommerce.md` |
| berty/berty | `a91c2680` | 1699 | 71 | 1 | 11 | 0 | `reports/berty__berty.md` |
| betaacid/expo-analytics | `bc965537` | 1 | 1 | 0 | 0 | 0 | `reports/betaacid__expo-analytics.md` |
| betomoedano/ChatApp | `22b59882` | 21 | 12 | 0 | 0 | 0 | `reports/betomoedano__ChatApp.md` |
| better-auth/better-auth | `7a120724` | 583 | 9 | 13 | 4 | 0 | `reports/better-auth__better-auth.md` |
| betterlytics/betterlytics | `2c6fbc93` | 1657 | 701 | 6 | 475 | 0 | `reports/betterlytics__betterlytics.md` |
| biaochenxuying/blog-react-admin | `220b0aee` | 92 | 21 | 0 | 2 | 1 | `reports/biaochenxuying__blog-react-admin.md` |
| bidah/universal-medusa | `d5db8f3f` | 6 | 0 | 2 | 4 | 0 | `reports/bidah__universal-medusa.md` |
| bigint/hey | `941a2e6d` | 780 | 239 | 1 | 443 | 0 | `reports/bigint__hey.md` |
| binaricat/Netcatty | `344b226c` | 2130 | 1398 | 6 | 188 | 0 | `reports/binaricat__Netcatty.md` |
| birkir/prime | `336f50c0` | 130 | 124 | 0 | 6 | 0 | `reports/birkir__prime.md` |
| bkywksj/knowledge-base | `9dd05ca4` | 1641 | 64 | 0 | 10 | 0 | `reports/bkywksj__knowledge-base.md` |
| BlackHatDevX/openspot-music-app | `b523adbd` | 467 | 42 | 15 | 0 | 3 | `reports/BlackHatDevX__openspot-music-app.md` |
| bldrs-ai/Share | `c195d370` | 407 | 290 | 60 | 57 | 0 | `reports/bldrs-ai__Share.md` |
| blinkospace/blinko | `8bd89a6b` | 1113 | 64 | 0 | 19 | 0 | `reports/blinkospace__blinko.md` |
| blueberrycongee/Lumina-Note | `35926f3a` | 1063 | 63 | 0 | 16 | 3 | `reports/blueberrycongee__Lumina-Note.md` |
| bluedaniel/Kakapo-app | `494f5573` | 38 | 23 | 5 | 10 | 0 | `reports/bluedaniel__Kakapo-app.md` |
| bluesky-social/social-app | `e776c37d` | 4842 | 1235 | 2125 | 461 | 0 | `reports/bluesky-social__social-app.md` |
| bmcmahen/toasted-notes | `f8e871d7` | 12 | 10 | 0 | 1 | 0 | `reports/bmcmahen__toasted-notes.md` |
| bndkt/react-native-app-clip | `54d6b52e` | 2 | 1 | 0 | 1 | 0 | `reports/bndkt__react-native-app-clip.md` |
| boluo2077/deep-rag | `71d933c2` | 24 | 16 | 2 | 6 | 0 | `reports/boluo2077__deep-rag.md` |
| Bourhjoul/Mern-Ecommerce-website | `ceeeeeb1` | 318 | 33 | 0 | 2 | 1 | `reports/Bourhjoul__Mern-Ecommerce-website.md` |
| Bowen7/regex-vis | `a6d92060` | 115 | 19 | 0 | 4 | 0 | `reports/Bowen7__regex-vis.md` |
| BradGroux/veritas-kanban | `175de957` | 1311 | 52 | 1 | 11 | 3 | `reports/BradGroux__veritas-kanban.md` |
| Brainfock/Brainfock | `0474cae8` | 645 | 160 | 424 | 51 | 0 | `reports/Brainfock__Brainfock.md` |
| BuilderIO/builder | `0864c0db` | 210 | 95 | 35 | 80 | 0 | `reports/BuilderIO__builder.md` |
| buildship-ai/rowy | `a5b4316c` | 646 | 270 | 160 | 66 | 0 | `reports/buildship-ai__rowy.md` |
| bukinoshita/taskr | `83f0a65c` | 105 | 42 | 0 | 24 | 0 | `reports/bukinoshita__taskr.md` |
| burakorkmez/react-admin-dashboard | `942f0d8d` | 199 | 51 | 0 | 148 | 0 | `reports/burakorkmez__react-admin-dashboard.md` |
| burdy-io/burdy | `c3ca6c71` | 789 | 775 | 0 | 15 | 0 | `reports/burdy-io__burdy.md` |
| ButterCMS/react-cms-blog-with-next-js | `d18b1c86` | 54 | 16 | 17 | 21 | 0 | `reports/ButterCMS__react-cms-blog-with-next-js.md` |
| C-JSN/D3-ID3 | `6dead30c` | 39 | 8 | 0 | 3 | 0 | `reports/C-JSN__D3-ID3.md` |
| calcom/cal.com | `fb014945` | 3259 | 1933 | 166 | 1160 | 1 | `reports/calcom__cal.com.md` |
| calcom/cal.diy | `fb014945` | 3259 | 2789 | 37 | 430 | 3 | `reports/calcom__cal.diy.md` |
| CapSoftware/Cap | `72fb5b6a` | 2277 | 14 | 4 | 5 | 0 | `reports/CapSoftware__Cap.md` |
| catalinmiron/react-native-dribbble-app | `45c16347` | 8 | 2 | 6 | 0 | 0 | `reports/catalinmiron__react-native-dribbble-app.md` |
| CaviraOSS/PageLM | `bd6087d2` | 275 | 172 | 0 | 55 | 0 | `reports/CaviraOSS__PageLM.md` |
| Cezerin2/Cezerin2 | `256397ed` | 353 | 79 | 0 | 1 | 0 | `reports/Cezerin2__Cezerin2.md` |
| chartbrew/chartbrew | `27504323` | 2200 | 16 | 0 | 5 | 0 | `reports/chartbrew__chartbrew.md` |
| chartdb/chartdb | `c24936a4` | 1029 | 68 | 0 | 12 | 0 | `reports/chartdb__chartdb.md` |
| chaskiq/chaskiq | `8ddcac93` | 1883 | 14 | 2 | 8 | 0 | `reports/chaskiq__chaskiq.md` |
| ChatGPTNextWeb/NextChat | `c3b8c158` | 458 | 7 | 9 | 4 | 3 | `reports/ChatGPTNextWeb__NextChat.md` |
| chatwoot/chatwoot-mobile-app | `9e91785f` | 511 | 48 | 0 | 6 | 1 | `reports/chatwoot__chatwoot-mobile-app.md` |
| chenjun1127/react-antd-admin | `73645f03` | 38 | 15 | 0 | 23 | 0 | `reports/chenjun1127__react-antd-admin.md` |
| CherryHQ/cherry-studio-app | `1167eabb` | 694 | 55 | 0 | 25 | 0 | `reports/CherryHQ__cherry-studio-app.md` |
| chrisvel/tududi | `c63ac5fa` | 3488 | 34 | 2 | 6 | 0 | `reports/chrisvel__tududi.md` |
| cktang88/spaceboard | `7d35cea3` | 6 | 1 | 4 | 1 | 0 | `reports/cktang88__spaceboard.md` |
| clawwork-ai/ClawWork | `394ec4af` | 783 | 54 | 0 | 18 | 3 | `reports/clawwork-ai__ClawWork.md` |
| clidey/whodb | `HEAD` | 1088 | 351 | 0 | 163 | 0 | `reports/clidey__whodb.md` |
| coderdost/MERN-ecommerce-Frontend | `89845dd6` | 461 | 25 | 0 | 7 | 0 | `reports/coderdost__MERN-ecommerce-Frontend.md` |
| CodeWithHarry/iNotebook-React | `6eaf2b6c` | 11 | 5 | 0 | 1 | 1 | `reports/CodeWithHarry__iNotebook-React.md` |
| codexu/note-gen | `8da15301` | 2293 | 14 | 1 | 6 | 0 | `reports/codexu__note-gen.md` |
| coding-with-chaim/react-video-chat | `b8b9ad42` | 9 | 5 | 0 | 0 | 0 | `reports/coding-with-chaim__react-video-chat.md` |
| cometchat/cometchat-uikit-react | `b73a06e7` | 1432 | 14 | 1 | 6 | 0 | `reports/cometchat__cometchat-uikit-react.md` |
| cometchat/cometchat-uikit-react-native | `21e3052c` | 1596 | 732 | 0 | 149 | 0 | `reports/cometchat__cometchat-uikit-react-native.md` |
| composify-js/composify | `1012d6c2` | 94 | 34 | 0 | 5 | 0 | `reports/composify-js__composify.md` |
| computing-den/unforget | `e519aca8` | 88 | 60 | 9 | 19 | 0 | `reports/computing-den__unforget.md` |
| concrnt/concrnt-world | `bd43334c` | 822 | 703 | 28 | 65 | 0 | `reports/concrnt__concrnt-world.md` |
| conductor-oss/conductor | `de11d13f` | 1044 | 401 | 1 | 365 | 0 | `reports/conductor-oss__conductor.md` |
| ConnectyCube/connectycube-reactnative-samples | `88f88fff` | 129 | 99 | 0 | 30 | 0 | `reports/ConnectyCube__connectycube-reactnative-samples.md` |
| converge/instapy-dashboard | `90bd22f8` | 4 | 1 | 0 | 3 | 0 | `reports/converge__instapy-dashboard.md` |
| CopilotKit/CopilotKit | `75303218` | 1504 | 83 | 0 | 37 | 0 | `reports/CopilotKit__CopilotKit.md` |
| creativetimofficial/argon-dashboard-react | `04b58c36` | 75 | 2 | 0 | 6 | 0 | `reports/creativetimofficial__argon-dashboard-react.md` |
| creativetimofficial/black-dashboard-react | `26b59be1` | 20 | 3 | 0 | 9 | 0 | `reports/creativetimofficial__black-dashboard-react.md` |
| creativetimofficial/material-dashboard-react | `a4db3e60` | 116 | 11 | 1 | 5 | 0 | `reports/creativetimofficial__material-dashboard-react.md` |
| creativetimofficial/material-tailwind-dashboard-react | `721f312c` | 38 | 32 | 0 | 6 | 0 | `reports/creativetimofficial__material-tailwind-dashboard-react.md` |
| creativetimofficial/muse-ant-design-dashboard | `398402ba` | 107 | 9 | 0 | 2 | 0 | `reports/creativetimofficial__muse-ant-design-dashboard.md` |
| creativetimofficial/nextjs-argon-dashboard | `801c7c4a` | 141 | 117 | 12 | 12 | 0 | `reports/creativetimofficial__nextjs-argon-dashboard.md` |
| creativetimofficial/now-ui-dashboard-react | `882f872a` | 17 | 6 | 0 | 2 | 0 | `reports/creativetimofficial__now-ui-dashboard-react.md` |
| creativetimofficial/paper-dashboard-react | `c2ecf797` | 33 | 30 | 0 | 3 | 0 | `reports/creativetimofficial__paper-dashboard-react.md` |
| creativetimofficial/purity-ui-dashboard | `0cdbec0b` | 39 | 10 | 0 | 2 | 1 | `reports/creativetimofficial__purity-ui-dashboard.md` |
| creativetimofficial/soft-ui-dashboard-react | `e282bac0` | 144 | 88 | 0 | 56 | 0 | `reports/creativetimofficial__soft-ui-dashboard-react.md` |
| creativetimofficial/vision-ui-dashboard-react | `78762699` | 103 | 8 | 0 | 12 | 0 | `reports/creativetimofficial__vision-ui-dashboard-react.md` |
| crisanlucid/vite-react-tailwind-bionic-reading | `6aa012a5` | 24 | 9 | 2 | 13 | 0 | `reports/crisanlucid__vite-react-tailwind-bionic-reading.md` |
| CromwellCMS/Cromwell | `ab00131c` | 1058 | 84 | 0 | 11 | 3 | `reports/CromwellCMS__Cromwell.md` |
| czy0729/Bangumi | `6f2e0654` | 1497 | 18 | 2 | 8 | 0 | `reports/czy0729__Bangumi.md` |
| dabit3/heard | `37827ed2` | 25 | 19 | 5 | 1 | 0 | `reports/dabit3__heard.md` |
| DaiYz/react-native-easy-chat-ui | `4bcdcaf8` | 117 | 14 | 3 | 9 | 0 | `reports/DaiYz__react-native-easy-chat-ui.md` |
| damianstone/toogether-mobile | `27a5e7fa` | 237 | 29 | 0 | 5 | 0 | `reports/damianstone__toogether-mobile.md` |
| DanialK/ReactJS-Realtime-Chat | `0de31290` | 27 | 2 | 25 | 0 | 0 | `reports/DanialK__ReactJS-Realtime-Chat.md` |
| danloh/mdSilo-web | `ad05af63` | 184 | 45 | 0 | 13 | 0 | `reports/danloh__mdSilo-web.md` |
| davehowson/chat-app | `7e1cc2bf` | 21 | 15 | 0 | 1 | 0 | `reports/davehowson__chat-app.md` |
| dch133/Social-Media-App | `482ea6ba` | 17 | 12 | 0 | 1 | 0 | `reports/dch133__Social-Media-App.md` |
| DeadWaveWave/opencove | `ae33b8dc` | 1638 | 61 | 0 | 39 | 0 | `reports/DeadWaveWave__opencove.md` |
| decaporg/decap-cms | `d4d4cd4b` | 776 | 326 | 0 | 70 | 0 | `reports/decaporg__decap-cms.md` |
| DefiLlama/defillama-app | `9d681116` | 3996 | 1776 | 468 | 811 | 1 | `reports/DefiLlama__defillama-app.md` |
| design-sparx/antd-multipurpose-dashboard | `8e0844ad` | 229 | 110 | 16 | 103 | 0 | `reports/design-sparx__antd-multipurpose-dashboard.md` |
| developer-junaid/DeveloperFolio | `a3aca36b` | 44 | 18 | 0 | 1 | 1 | `reports/developer-junaid__DeveloperFolio.md` |
| devhubapp/devhub | `1d0d66a3` | 1676 | 1049 | 409 | 119 | 1 | `reports/devhubapp__devhub.md` |
| dharness/react-chat-window | `14f682fa` | 16 | 6 | 1 | 1 | 0 | `reports/dharness__react-chat-window.md` |
| dhatGuy/PERN-Store | `7f25c1b6` | 126 | 21 | 0 | 8 | 0 | `reports/dhatGuy__PERN-Store.md` |
| dilanx/craco | `56840cea` | 19 | 3 | 3 | 0 | 0 | `reports/dilanx__craco.md` |
| DLand-Team/moderate-react-admin | `8efd855d` | 461 | 63 | 1 | 13 | 0 | `reports/DLand-Team__moderate-react-admin.md` |
| documenso/documenso | `abbca79b` | 5922 | 3611 | 119 | 1367 | 0 | `reports/documenso__documenso.md` |
| Dokploy/dokploy | `aff200f8` | 2314 | 13 | 5 | 6 | 0 | `reports/Dokploy__dokploy.md` |
| drawdb-io/drawdb | `5cfea2c1` | 252 | 148 | 0 | 37 | 0 | `reports/drawdb-io__drawdb.md` |
| dubinc/dub | `39cc2e3f` | 5883 | 10 | 3 | 9 | 0 | `reports/dubinc__dub.md` |
| DulanjaliSenarathna/react-chat-app | `adff7ba0` | 141 | 138 | 0 | 3 | 0 | `reports/DulanjaliSenarathna__react-chat-app.md` |
| dxx/mango-music | `9497c05b` | 108 | 6 | 0 | 2 | 0 | `reports/dxx__mango-music.md` |
| dyad-sh/dyad | `0aa85796` | 2795 | 1477 | 130 | 544 | 0 | `reports/dyad-sh__dyad.md` |
| e2b-dev/dashboard | `5fa0e6c1` | 962 | 21 | 3 | 6 | 0 | `reports/e2b-dev__dashboard.md` |
| earthcomfy/lets-chat | `7a21eac8` | 151 | 80 | 0 | 71 | 0 | `reports/earthcomfy__lets-chat.md` |
| ecency/ecency-mobile | `03aaf0ca` | 1827 | 15 | 1 | 5 | 0 | `reports/ecency__ecency-mobile.md` |
| ed-roh/mern-social-media | `9f0617f6` | 16 | 1 | 15 | 0 | 0 | `reports/ed-roh__mern-social-media.md` |
| ed-roh/react-admin-dashboard | `adc9e57f` | 19 | 2 | 0 | 1 | 0 | `reports/ed-roh__react-admin-dashboard.md` |
| ed-roh/react-ecommerce | `d59ca117` | 40 | 3 | 0 | 2 | 0 | `reports/ed-roh__react-ecommerce.md` |
| edp963/davinci | `74a8cbf4` | 1042 | 520 | 0 | 164 | 0 | `reports/edp963__davinci.md` |
| edrlab/thorium-reader | `6a27a373` | — | 0 | 0 | 0 | 3 | `reports/edrlab__thorium-reader.md` |
| EkiZR/Portofolio_V5 | `67909d70` | 457 | 38 | 0 | 10 | 0 | `reports/EkiZR__Portofolio_V5.md` |
| elbwalker/walkerOS | `0e21ee4c` | 445 | 27 | 2 | 11 | 0 | `reports/elbwalker__walkerOS.md` |
| ele828/leanote-ios-rn | `64630b23` | 2444 | 244 | 2078 | 122 | 0 | `reports/ele828__leanote-ios-rn.md` |
| element-hq/element-web | `13dd1a0b` | 1708 | 55 | 5 | 11 | 0 | `reports/element-hq__element-web.md` |
| elibenjii/ecommerce-react | `e33df7e4` | 28 | 26 | 2 | 0 | 0 | `reports/elibenjii__ecommerce-react.md` |
| elie222/inbox-zero | `7edc3a65` | 2275 | 13 | 2 | 7 | 0 | `reports/elie222__inbox-zero.md` |
| ElSierra/Social-app-React-Native | `81f4784e` | 376 | 290 | 18 | 68 | 0 | `reports/ElSierra__Social-app-React-Native.md` |
| eminbasbayan/full-stack-e-commerce | `0a9a95e6` | 163 | 45 | 0 | 40 | 0 | `reports/eminbasbayan__full-stack-e-commerce.md` |
| enatega/shopping-cart-ecommerce | `e8ddaa88` | 336 | 29 | 15 | 2 | 3 | `reports/enatega__shopping-cart-ecommerce.md` |
| ensdomains/ens-app-v3 | `71758582` | 724 | 68 | 0 | 13 | 3 | `reports/ensdomains__ens-app-v3.md` |
| ErickKS/vite-deploy | `19f6b9e8` | — | 0 | 0 | 0 | 0 | `reports/ErickKS__vite-deploy.md` |
| estevanmaito/windmill-dashboard-react | `da542836` | 79 | 8 | 0 | 5 | 0 | `reports/estevanmaito__windmill-dashboard-react.md` |
| etesync/etesync-notes | `3b1d1401` | 207 | 122 | 22 | 63 | 0 | `reports/etesync__etesync-notes.md` |
| excalidraw/excalidraw | `0457ac90` | 565 | 19 | 13 | 14 | 2 | `reports/excalidraw__excalidraw.md` |
| Expensify/App | `ba0f6c4f` | 6321 | 4171 | 24 | 1355 | 0 | `reports/Expensify__App.md` |
| expo/orbit | `bb326166` | 84 | 65 | 4 | 15 | 0 | `reports/expo__orbit.md` |
| expo/react-native-action-sheet | `9dd71637` | 44 | 9 | 0 | 5 | 0 | `reports/expo__react-native-action-sheet.md` |
| f/agentlytics | `d87e4f23` | 306 | 29 | 0 | 12 | 2 | `reports/f__agentlytics.md` |
| facebook/create-react-app | `62543865` | 82 | 0 | 4 | 4 | 2 | `reports/facebook__create-react-app.md` |
| fangpenlin/avataaars-generator | `c191c6c2` | 15 | 3 | 0 | 0 | 1 | `reports/fangpenlin__avataaars-generator.md` |
| Fanzzzd/repo-wizard | `b8b7b2ad` | 368 | 70 | 3 | 192 | 0 | `reports/Fanzzzd__repo-wizard.md` |
| febobo/react-native-redux-FeInn | `93dd1fa9` | 89 | 38 | 31 | 20 | 0 | `reports/febobo__react-native-redux-FeInn.md` |
| fireship-io/react-firebase-chat | `f92b3fdc` | 1 | 1 | 0 | 0 | 0 | `reports/fireship-io__react-firebase-chat.md` |
| fireyy/react-antd-admin | `7da89339` | 21 | 15 | 1 | 2 | 0 | `reports/fireyy__react-antd-admin.md` |
| Flagsmith/flagsmith | `913daeb9` | 1290 | 830 | 145 | 315 | 0 | `reports/Flagsmith__flagsmith.md` |
| Flaque/quirk | `3e7fa234` | 432 | 167 | 137 | 128 | 0 | `reports/Flaque__quirk.md` |
| FLiotta/Yasei | `1e1d2575` | 28 | 28 | 0 | 0 | 0 | `reports/FLiotta__Yasei.md` |
| Flipkart/recyclerlistview | `3485036e` | 13 | 4 | 6 | 3 | 0 | `reports/Flipkart__recyclerlistview.md` |
| focallocal/fl-maps | `4b43a50c` | 155 | 15 | 0 | 4 | 0 | `reports/focallocal__fl-maps.md` |
| formbricks/formbricks | `3005c44c` | 10642 | 19 | 3 | 9 | 0 | `reports/formbricks__formbricks.md` |
| freeCodeCamp/freeCodeCamp | `0da7c6de` | 658 | 4 | 8 | 4 | 1 | `reports/freeCodeCamp__freeCodeCamp.md` |
| ftzi/react-native-shadow-2 | `5dd75aba` | 12 | 3 | 0 | 0 | 0 | `reports/ftzi__react-native-shadow-2.md` |
| funador/react-auth-client | `828aff36` | — | 0 | 0 | 0 | 0 | `reports/funador__react-auth-client.md` |
| functionland/fx-fotos | `f41e97ab` | 262 | 43 | 0 | 8 | 2 | `reports/functionland__fx-fotos.md` |
| ganeshrvel/openmtp | `ac02705f` | 107 | 15 | 1 | 4 | 0 | `reports/ganeshrvel__openmtp.md` |
| gethomepage/homepage | `02a9d74c` | 653 | 60 | 0 | 16 | 0 | `reports/gethomepage__homepage.md` |
| getredash/redash | `4956e6d1` | 835 | 592 | 217 | 0 | 1 | `reports/getredash__redash.md` |
| getsentry/sentry | `b493f8b8` | 9068 | 61 | 10 | 52 | 0 | `reports/getsentry__sentry.md` |
| gianlucajahn/react-ecommerce-store | `ae465627` | 92 | 13 | 2 | 3 | 0 | `reports/gianlucajahn__react-ecommerce-store.md` |
| giscus/giscus | `d90866df` | 79 | 25 | 1 | 8 | 1 | `reports/giscus__giscus.md` |
| gitify-app/gitify | `HEAD` | 74 | 21 | 0 | 6 | 0 | `reports/gitify-app__gitify.md` |
| gitpoint/git-point | `3f015344` | 80 | 11 | 0 | 1 | 2 | `reports/gitpoint__git-point.md` |
| gitroomhq/postiz-app | `7cc3d9bd` | 2156 | 1482 | 2 | 362 | 0 | `reports/gitroomhq__postiz-app.md` |
| goshacmd/pabla | `d7420128` | 83 | 22 | 50 | 11 | 0 | `reports/goshacmd__pabla.md` |
| Govind783/react-e-commerce- | `b65530c9` | 220 | 162 | 13 | 45 | 0 | `reports/Govind783__react-e-commerce-.md` |
| grafana/grafana | `95f3b8a6` | 10184 | 3 | 5 | 4 | 2 | `reports/grafana__grafana.md` |
| Grashjs/cmms | `6d493449` | 2023 | 1196 | 63 | 30 | 0 | `reports/Grashjs__cmms.md` |
| gridstack/gridstack.js | `d6e2d90f` | 3 | 0 | 0 | 1 | 0 | `reports/gridstack__gridstack.js.md` |
| growilabs/growi | `3b7c2192` | 2121 | 740 | 32 | 616 | 0 | `reports/growilabs__growi.md` |
| guyariely/noteworthy | `48c786b6` | 33 | 25 | 0 | 8 | 0 | `reports/guyariely__noteworthy.md` |
| hackjutsu/Lepton | `a1b2c4f0` | 106 | 11 | 2 | 5 | 0 | `reports/hackjutsu__Lepton.md` |
| hasan-py/Hayroo | `9714947b` | 663 | 139 | 0 | 207 | 0 | `reports/hasan-py__Hayroo.md` |
| hasura/graphql-engine | `9b5d3400` | 3877 | 1338 | 593 | 817 | 1 | `reports/hasura__graphql-engine.md` |
| hexclave/stack-auth | `3385d6e2` | 4638 | 130 | 0 | 27 | 1 | `reports/hexclave__stack-auth.md` |
| heyform/heyform | `2f20e9ce` | — | 0 | 0 | 0 | 0 | `reports/heyform__heyform.md` |
| heylinda/heylinda-app | `a073e1e2` | 53 | 31 | 4 | 18 | 0 | `reports/heylinda__heylinda-app.md` |
| hitarth-gg/zenshin | `4571d3b8` | 585 | 340 | 0 | 100 | 0 | `reports/hitarth-gg__zenshin.md` |
| HosseinNamvar/bitex | `4b4eb591` | 352 | 24 | 0 | 9 | 1 | `reports/HosseinNamvar__bitex.md` |
| hyperdxio/hyperdx | `790488ef` | 1539 | 22 | 6 | 9 | 0 | `reports/hyperdxio__hyperdx.md` |
| IceEnd/Yosoro | `2a01deca` | 62 | 23 | 0 | 20 | 2 | `reports/IceEnd__Yosoro.md` |
| idurar/idurar-erp-crm | `5b2cf289` | 246 | 29 | 0 | 0 | 3 | `reports/idurar__idurar-erp-crm.md` |
| illacloud/illa-builder | `a4686609` | 2296 | 61 | 0 | 2 | 0 | `reports/illacloud__illa-builder.md` |
| infinitered/reactotron | `44f935ed` | 232 | 27 | 5 | 2 | 3 | `reports/infinitered__reactotron.md` |
| Infisical/infisical | `6c7713bb` | — | 0 | 0 | 0 | 0 | `reports/Infisical__infisical.md` |
| inifarhan/skaters | `e8a4651b` | 142 | 140 | 0 | 2 | 0 | `reports/inifarhan__skaters.md` |
| inovex/scrumlr.io | `893bf552` | 334 | 44 | 0 | 9 | 0 | `reports/inovex__scrumlr.io.md` |
| InsForge/InsForge | `bb680ba4` | 1338 | 76 | 0 | 4 | 0 | `reports/InsForge__InsForge.md` |
| iSimar/HackerNews-React-Native | `4ab83c05` | 4 | 4 | 0 | 0 | 0 | `reports/iSimar__HackerNews-React-Native.md` |
| itzpradip/react-native-firebase-social-app | `ad09dba3` | 78 | 64 | 0 | 1 | 0 | `reports/itzpradip__react-native-firebase-social-app.md` |
| j471n/j471n.in | `7f76fee8` | 604 | 62 | 0 | 343 | 0 | `reports/j471n__j471n.in.md` |
| jagjot26/faeshare | `615d0cd1` | 267 | 123 | 0 | 113 | 0 | `reports/jagjot26__faeshare.md` |
| jamaljsr/polar | `711755f1` | 298 | 146 | 35 | 102 | 0 | `reports/jamaljsr__polar.md` |
| JasonStu/ReactNative_Shopping | `a8eeacd0` | 55 | 4 | 2 | 2 | 0 | `reports/JasonStu__ReactNative_Shopping.md` |
| jeandv/jeanrondon.dev | `01e3b239` | 103 | 8 | 0 | 5 | 0 | `reports/jeandv__jeanrondon.dev.md` |
| Jellify-Music/App | `d1f044af` | 376 | 56 | 0 | 24 | 0 | `reports/Jellify-Music__App.md` |
| jgudo/ecommerce-react | `8d370282` | 54 | 16 | 0 | 4 | 0 | `reports/jgudo__ecommerce-react.md` |
| jhen0409/react-native-debugger | `bd3435a4` | 11 | 5 | 1 | 2 | 0 | `reports/jhen0409__react-native-debugger.md` |
| jitsi/jitsi-meet | `fc582405` | 2461 | 749 | 1361 | 351 | 0 | `reports/jitsi__jitsi-meet.md` |
| john-smilga/react-phone-e-commerce-project | `a6c25aac` | 11 | 3 | 0 | 1 | 2 | `reports/john-smilga__react-phone-e-commerce-project.md` |
| jotyy/Mantine-Admin | `8b6f5dcd` | 27 | 16 | 0 | 10 | 0 | `reports/jotyy__Mantine-Admin.md` |
| jpuri/react-draft-wysiwyg | `4743d738` | 220 | 102 | 38 | 80 | 0 | `reports/jpuri__react-draft-wysiwyg.md` |
| jrussbautista/dress-shop | `de856426` | 110 | 17 | 1 | 8 | 0 | `reports/jrussbautista__dress-shop.md` |
| JSLancerTeam/crystal-dashboard | `a5eb21b0` | 147 | 144 | 0 | 3 | 0 | `reports/JSLancerTeam__crystal-dashboard.md` |
| Justin-lu/react-redux-antd | `c769cfc6` | 16 | 6 | 0 | 1 | 0 | `reports/Justin-lu__react-redux-antd.md` |
| jvalen/pixel-art-react | `73b57b6b` | 11 | 7 | 0 | 4 | 0 | `reports/jvalen__pixel-art-react.md` |
| kaloraat/react-node-ecommerce | `68a8832b` | 144 | 142 | 0 | 2 | 0 | `reports/kaloraat__react-node-ecommerce.md` |
| kamjin3086/chatless | `37221c52` | 3597 | 35 | 4 | 11 | 0 | `reports/kamjin3086__chatless.md` |
| karakeep-app/karakeep | `66a7ac48` | 1557 | 121 | 26 | 41 | 1 | `reports/karakeep-app__karakeep.md` |
| kentcdodds/bookshelf | `32e9e87d` | 116 | 14 | 2 | 2 | 0 | `reports/kentcdodds__bookshelf.md` |
| ketchuphq/ketchup | `3f0355d8` | 67 | 42 | 0 | 2 | 0 | `reports/ketchuphq__ketchup.md` |
| KieSun/Chat-Buy-React | `9cc39de9` | 12 | 9 | 0 | 1 | 0 | `reports/KieSun__Chat-Buy-React.md` |
| KittyCAD/modeling-app | `8ca41bfa` | 1317 | 77 | 1 | 17 | 3 | `reports/KittyCAD__modeling-app.md` |
| kizuna-ai-lab/sokuji | `7d348c28` | 456 | 55 | 0 | 22 | 3 | `reports/kizuna-ai-lab__sokuji.md` |
| Kong/insomnia | `b711ecaa` | 1597 | 78 | 0 | 35 | 3 | `reports/Kong__insomnia.md` |
| koolkishan/chat-app-react-nodejs | `acb6e130` | 47 | 26 | 3 | 18 | 0 | `reports/koolkishan__chat-app-react-nodejs.md` |
| kriziu/collabio | `9ca643c5` | 88 | 56 | 5 | 27 | 0 | `reports/kriziu__collabio.md` |
| KSJaay/Lunalytics | `efb0b72e` | 510 | 37 | 0 | 18 | 0 | `reports/KSJaay__Lunalytics.md` |
| kusti8/proton-native | `ab482b12` | 20 | 5 | 0 | 13 | 0 | `reports/kusti8__proton-native.md` |
| kuwala-io/kuwala | `44d73c2c` | 199 | 28 | 0 | 7 | 0 | `reports/kuwala-io__kuwala.md` |
| labring/FastGPT | `011e718b` | 3663 | 38 | 8 | 14 | 0 | `reports/labring__FastGPT.md` |
| LAION-AI/Open-Assistant | `f1e6ed95` | 301 | 46 | 1 | 13 | 0 | `reports/LAION-AI__Open-Assistant.md` |
| LanceMoe/openai-translator | `3536d286` | 38 | 33 | 0 | 5 | 0 | `reports/LanceMoe__openai-translator.md` |
| langfuse/langfuse | `1b003967` | 3445 | 36 | 1 | 6 | 0 | `reports/langfuse__langfuse.md` |
| laurent22/joplin | `8b72b0aa` | 2051 | 1394 | 13 | 75 | 0 | `reports/laurent22__joplin.md` |
| lbryio/lbry-desktop | `d14c9141` | 249 | 16 | 0 | 7 | 3 | `reports/lbryio__lbry-desktop.md` |
| learnhouse/learnhouse | `53e76e95` | 8699 | 93 | 0 | 27 | 3 | `reports/learnhouse__learnhouse.md` |
| LeDat98/NexusRAG | `1d4791c6` | 294 | 243 | 0 | 27 | 0 | `reports/LeDat98__NexusRAG.md` |
| leemonade/leemons | `b1ca5d84` | 4698 | 94 | 1 | 41 | 0 | `reports/leemonade__leemons.md` |
| letterpad/letterpad | `91d3e251` | 1376 | 86 | 0 | 24 | 1 | `reports/letterpad__letterpad.md` |
| levelopers/Ecommerce-Reactjs | `d16f0868` | 42 | 6 | 0 | 1 | 2 | `reports/levelopers__Ecommerce-Reactjs.md` |
| Levix0501/notra | `5e86e77b` | 273 | 170 | 0 | 53 | 0 | `reports/Levix0501__notra.md` |
| lightdash/lightdash | `3e54e254` | 2514 | 90 | 0 | 11 | 0 | `reports/lightdash__lightdash.md` |
| lingodotdev/lingo.dev | `19955fb8` | 259 | 37 | 3 | 14 | 0 | `reports/lingodotdev__lingo.dev.md` |
| linkwarden/linkwarden | `22723575` | 786 | 704 | 0 | 66 | 0 | `reports/linkwarden__linkwarden.md` |
| LinMoQC/Memory-Blog | `d9604241` | 213 | 34 | 0 | 4 | 0 | `reports/LinMoQC__Memory-Blog.md` |
| lionsharecapital/lionshare-desktop | `815ea876` | 32 | 26 | 0 | 6 | 0 | `reports/lionsharecapital__lionshare-desktop.md` |
| liuguanhua/react-antd-admin | `dce57d27` | 212 | 110 | 22 | 80 | 0 | `reports/liuguanhua__react-antd-admin.md` |
| LiuYuYang01/ThriveX-Admin | `6ef1271b` | 577 | 146 | 0 | 211 | 0 | `reports/LiuYuYang01__ThriveX-Admin.md` |
| LiuYuYang01/ThriveX-Blog | `b95545da` | 625 | 43 | 0 | 37 | 0 | `reports/LiuYuYang01__ThriveX-Blog.md` |
| liveblocks/liveblocks | `HEAD` | — | 0 | 0 | 0 | 0 | `reports/liveblocks__liveblocks.md` |
| llorentegerman/react-admin-dashboard | `c7bf047a` | 51 | 20 | 6 | 25 | 0 | `reports/llorentegerman__react-admin-dashboard.md` |
| lobehub/lobe-chat | `690098dc` | 4401 | 24 | 3 | 4 | 0 | `reports/lobehub__lobe-chat.md` |
| lobehub/lobehub | `690098dc` | 4401 | 24 | 3 | 4 | 0 | `reports/lobehub__lobehub.md` |
| logto-io/logto | `d7fdf28e` | 1533 | 14 | 5 | 11 | 0 | `reports/logto-io__logto.md` |
| loveRandy/react-admin | `19d46c14` | 20 | 6 | 0 | 3 | 0 | `reports/loveRandy__react-admin.md` |
| ltadpoles/react-admin | `091914e6` | 32 | 15 | 0 | 17 | 0 | `reports/ltadpoles__react-admin.md` |
| LucasBassetti/react-simple-chatbot | `fd81c7d6` | 14 | 6 | 0 | 8 | 0 | `reports/LucasBassetti__react-simple-chatbot.md` |
| lucavallin/verto | `f9c0bb05` | 45 | 28 | 2 | 15 | 0 | `reports/lucavallin__verto.md` |
| lvwangbeta/Poplar | `5efad9b9` | 146 | 88 | 0 | 58 | 0 | `reports/lvwangbeta__Poplar.md` |
| lydiahallie/React-Ecommerce | `10710c77` | 5 | 5 | 0 | 0 | 0 | `reports/lydiahallie__React-Ecommerce.md` |
| machadop1407/react-socketio-chat-app | `5de1839d` | 3 | 3 | 0 | 0 | 0 | `reports/machadop1407__react-socketio-chat-app.md` |
| makeplane/plane | `4225bc59` | 4534 | 3150 | 530 | 854 | 0 | `reports/makeplane__plane.md` |
| maotoumao/MusicFreeDesktop | `f3b526a6` | — | 0 | 0 | 0 | 0 | `reports/maotoumao__MusicFreeDesktop.md` |
| mariusandra/insights | `025c6b4b` | 114 | 17 | 0 | 1 | 1 | `reports/mariusandra__insights.md` |
| martpie/museeks | `15854f9f` | 49 | 26 | 4 | 19 | 0 | `reports/martpie__museeks.md` |
| mastodon/mastodon | `bbb3392d` | 796 | 4 | 13 | 6 | 1 | `reports/mastodon__mastodon.md` |
| mastra-ai/mastra | `0661e5c4` | 2354 | 14 | 7 | 5 | 0 | `reports/mastra-ai__mastra.md` |
| mattermost/mattermost | `8a8a4ac8` | 5428 | 29 | 5 | 9 | 1 | `reports/mattermost__mattermost.md` |
| Matterwiki/Matterwiki | `92ca38c8` | 101 | 15 | 0 | 0 | 1 | `reports/Matterwiki__Matterwiki.md` |
| MauriceNino/dashdot | `9d169fc7` | 109 | 35 | 1 | 11 | 0 | `reports/MauriceNino__dashdot.md` |
| mb21/panwriter | `3bc3d60b` | 18 | 12 | 0 | 0 | 1 | `reports/mb21__panwriter.md` |
| mCodex/react-native-sensitive-info | `aee6d552` | 54 | 30 | 8 | 16 | 0 | `reports/mCodex__react-native-sensitive-info.md` |
| mediacms-io/mediacms | `c7a1d60d` | 1607 | 40 | 0 | 65 | 2 | `reports/mediacms-io__mediacms.md` |
| medusajs/medusa | `2b21d156` | 2952 | 1099 | 506 | 1343 | 4 | `reports/medusajs__medusa.md` |
| meilisearch/mini-dashboard | `db4553b9` | 36 | 31 | 0 | 5 | 0 | `reports/meilisearch__mini-dashboard.md` |
| merikbest/ecommerce-spring-reactjs | `464e610b` | 98 | 74 | 0 | 11 | 0 | `reports/merikbest__ecommerce-spring-reactjs.md` |
| metabase/metabase | `d37e4773` | 4016 | 5 | 10 | 4 | 1 | `reports/metabase__metabase.md` |
| MetaMask/metamask-mobile | `6137dfd2` | 11856 | 42 | 11 | 16 | 0 | `reports/MetaMask__metamask-mobile.md` |
| microsoft/vscode-react-native | `e53f37f2` | 2 | 2 | 0 | 0 | 0 | `reports/microsoft__vscode-react-native.md` |
| midday-ai/midday | `e5f45ed0` | 3735 | 1862 | 415 | 67 | 1 | `reports/midday-ai__midday.md` |
| mihir0699/Video-Chat | `7717235e` | 36 | 32 | 4 | 0 | 0 | `reports/mihir0699__Video-Chat.md` |
| millionco/ami | `bbcdc172` | 2019 | 1220 | 0 | 204 | 0 | `reports/millionco__ami.md` |
| millionco/expect | `39e97500` | 245 | 88 | 19 | 40 | 1 | `reports/millionco__expect.md` |
| millionco/react-doctor | `8556b31d` | 10 | 0 | 6 | 3 | 1 | `reports/millionco__react-doctor.md` |
| millionco/same | `a2443fca` | 1801 | 12 | 0 | 9 | 0 | `reports/millionco__same.md` |
| misa-j/social-network | `d99ef7b3` | 61 | 35 | 0 | 15 | 0 | `reports/misa-j__social-network.md` |
| mithunjmistry/ecommerce-React-Redux-Laravel | `8f5b0d1b` | — | 0 | 0 | 0 | 3 | `reports/mithunjmistry__ecommerce-React-Redux-Laravel.md` |
| mohamedsamara/mern-ecommerce | `7f73dfbd` | 189 | 18 | 1 | 1 | 0 | `reports/mohamedsamara__mern-ecommerce.md` |
| mohammadoftadeh/next-ecommerce-shopco | `f360acb6` | 94 | 13 | 0 | 7 | 0 | `reports/mohammadoftadeh__next-ecommerce-shopco.md` |
| Mohitur669/Realtime-Collaborative-Code-Editor | `da2825bc` | 8 | 4 | 0 | 1 | 0 | `reports/Mohitur669__Realtime-Collaborative-Code-Editor.md` |
| moollaza/repo-remover | `150ef6c7` | 194 | 27 | 0 | 14 | 3 | `reports/moollaza__repo-remover.md` |
| Morelitea/initiative | `20adae10` | 2502 | 1612 | 138 | 752 | 0 | `reports/Morelitea__initiative.md` |
| mrktsm/codecafe | `877f5426` | 162 | 38 | 0 | 6 | 0 | `reports/mrktsm__codecafe.md` |
| MrXujiang/next-admin | `9e64c9f3` | 99 | 31 | 0 | 1 | 0 | `reports/MrXujiang__next-admin.md` |
| MrXujiang/XPCMS | `0a97ce25` | 19 | 9 | 0 | 1 | 0 | `reports/MrXujiang__XPCMS.md` |
| mudzikalfahri/wefootwear-store | `f661b975` | 191 | 30 | 0 | 8 | 0 | `reports/mudzikalfahri__wefootwear-store.md` |
| mvdicarlo/postybirb | `afefc76e` | 570 | 381 | 0 | 56 | 0 | `reports/mvdicarlo__postybirb.md` |
| namespace-ee/upcount | `65a1abcc` | 82 | 27 | 0 | 4 | 1 | `reports/namespace-ee__upcount.md` |
| navidrome/navidrome | `2b3b879c` | 296 | 119 | 35 | 115 | 0 | `reports/navidrome__navidrome.md` |
| neiker/analytics-react-native | `f412a339` | 1 | 1 | 0 | 0 | 0 | `reports/neiker__analytics-react-native.md` |
| nelsonkuang/ant-admin | `4f27ca9c` | 33 | 30 | 3 | 0 | 0 | `reports/nelsonkuang__ant-admin.md` |
| netbirdio/dashboard | `dc86c304` | 1326 | 713 | 0 | 260 | 0 | `reports/netbirdio__dashboard.md` |
| nexu-io/open-design | `b2841f60` | 1259 | 830 | 190 | 239 | 0 | `reports/nexu-io__open-design.md` |
| nfl/react-metrics | `90786c26` | 55 | 6 | 1 | 2 | 0 | `reports/nfl__react-metrics.md` |
| nguymin4/react-videocall | `76125f18` | 20 | 11 | 0 | 0 | 0 | `reports/nguymin4__react-videocall.md` |
| nhost/nhost | `d21f27d7` | 1 | 0 | 0 | 1 | 0 | `reports/nhost__nhost.md` |
| NiceDash/Vibe | `522f2999` | 23 | 12 | 8 | 3 | 0 | `reports/NiceDash__Vibe.md` |
| nikunjsingh93/react-glass-keep | `043ecd3b` | 433 | 42 | 0 | 4 | 0 | `reports/nikunjsingh93__react-glass-keep.md` |
| nisargio/scissors | `621fcf66` | 510 | 9 | 11 | 9 | 1 | `reports/nisargio__scissors.md` |
| nocobase/nocobase | `cc666560` | 9196 | 6273 | 1872 | 2301 | 1 | `reports/nocobase__nocobase.md` |
| nodejs/nodejs.org | `125b7606` | 284 | 52 | 14 | 189 | 0 | `reports/nodejs__nodejs.org.md` |
| nraiden/cofounder | `19ba19f6` | 276 | 147 | 0 | 58 | 0 | `reports/nraiden__cofounder.md` |
| nrwl/nx | `07b16e43` | 1947 | 59 | 0 | 21 | 0 | `reports/nrwl__nx.md` |
| nusr/excel | `b341827e` | 437 | 18 | 2 | 5 | 0 | `reports/nusr__excel.md` |
| nz-m/SocialEcho | `4dc6c782` | 398 | 110 | 25 | 263 | 0 | `reports/nz-m__SocialEcho.md` |
| offlegacy/event-tracker | `25dd8e33` | 39 | 18 | 0 | 5 | 0 | `reports/offlegacy__event-tracker.md` |
| Ohh-889/skyroc-admin | `6fc2446e` | 132 | 126 | 0 | 6 | 0 | `reports/Ohh-889__skyroc-admin.md` |
| OHIF/Viewers | `b058ec7c` | 1599 | 78 | 2 | 16 | 0 | `reports/OHIF__Viewers.md` |
| ohmplatform/FreedomGPT | `f3c77cc8` | 349 | 40 | 0 | 21 | 2 | `reports/ohmplatform__FreedomGPT.md` |
| oliverschwendener/ueli | `1f87145c` | 246 | 36 | 1 | 1 | 0 | `reports/oliverschwendener__ueli.md` |
| OneKeyHQ/app-monorepo | `f61c2ae5` | 7652 | 102 | 4 | 69 | 0 | `reports/OneKeyHQ__app-monorepo.md` |
| onlook-dev/onlook | `a242be58` | 2837 | 5 | 14 | 6 | 0 | `reports/onlook-dev__onlook.md` |
| onyx-dot-app/onyx | `416d9f36` | 5129 | 2489 | 317 | 412 | 1 | `reports/onyx-dot-app__onyx.md` |
| open-source-labs/ReacType | `778f660d` | 471 | 247 | 0 | 57 | 0 | `reports/open-source-labs__ReacType.md` |
| OpenBeta/open-tacos | `8475c90a` | 710 | 57 | 0 | 23 | 0 | `reports/OpenBeta__open-tacos.md` |
| openreplay/openreplay | `1452c569` | 4283 | 22 | 3 | 5 | 0 | `reports/openreplay__openreplay.md` |
| OpenSignLabs/OpenSign | `197c00dd` | 1476 | 16 | 1 | 7 | 0 | `reports/OpenSignLabs__OpenSign.md` |
| openstatusHQ/openstatus | `8d870e08` | 871 | 471 | 160 | 136 | 0 | `reports/openstatusHQ__openstatus.md` |
| outline/outline | `7c070df9` | 1760 | 83 | 1 | 6 | 1 | `reports/outline__outline.md` |
| outsourc-e/hermes-workspace | `372b18a8` | 4842 | 1312 | 952 | 285 | 0 | `reports/outsourc-e__hermes-workspace.md` |
| overlayeddev/overlayed | `f2127558` | 112 | 27 | 0 | 6 | 0 | `reports/overlayeddev__overlayed.md` |
| Pagedraw/pagedraw | `aba1bd1b` | 78 | 13 | 0 | 1 | 3 | `reports/Pagedraw__pagedraw.md` |
| papercups-io/chat-widget | `6349cd16` | 17 | 3 | 2 | 1 | 0 | `reports/papercups-io__chat-widget.md` |
| papermark/papermark | `8ffa04af` | 5425 | 3005 | 46 | 2078 | 0 | `reports/papermark__papermark.md` |
| pashpashpash/vault-ai | `60ec5f21` | 6 | 2 | 4 | 0 | 0 | `reports/pashpashpash__vault-ai.md` |
| patrick-michelberger/serverless-shop | `75d14e8f` | 8 | 7 | 1 | 0 | 0 | `reports/patrick-michelberger__serverless-shop.md` |
| pattjoshi/Multi_vondor_E_shop | `6249026e` | 533 | 168 | 0 | 98 | 0 | `reports/pattjoshi__Multi_vondor_E_shop.md` |
| payloadcms/payload | `5375636a` | 6689 | 1816 | 3666 | 1207 | 0 | `reports/payloadcms__payload.md` |
| penpot/penpot | `1e746add` | 104 | 9 | 10 | 10 | 0 | `reports/penpot__penpot.md` |
| Peppermint-Lab/peppermint | `ba6e2179` | 2242 | 13 | 3 | 4 | 0 | `reports/Peppermint-Lab__peppermint.md` |
| phongna07/fireverse | `c6c18bbe` | 155 | 9 | 0 | 2 | 0 | `reports/phongna07__fireverse.md` |
| picturama/picturama | `b79f0058` | 118 | 60 | 0 | 10 | 0 | `reports/picturama__picturama.md` |
| PierreCapo/react-native-socials | `4111a23f` | 40 | 15 | 0 | 1 | 0 | `reports/PierreCapo__react-native-socials.md` |
| pierrecomputer/pierre | `7288f638` | 677 | 60 | 9 | 37 | 2 | `reports/pierrecomputer__pierre.md` |
| pingdotgg/t3code | `b83e9c95` | 935 | 5 | 11 | 7 | 1 | `reports/pingdotgg__t3code.md` |
| plankanban/planka | `a8dcd7ce` | 363 | 239 | 0 | 7 | 0 | `reports/plankanban__planka.md` |
| plasmicapp/plasmic | `c0db8c2a` | 641 | 306 | 32 | 111 | 0 | `reports/plasmicapp__plasmic.md` |
| plouc/mozaik | `5fc9070d` | 29 | 25 | 0 | 4 | 0 | `reports/plouc__mozaik.md` |
| polarsource/polar | `2cc6c16c` | 3123 | 1494 | 245 | 1381 | 3 | `reports/polarsource__polar.md` |
| PostHog/posthog | `696b4441` | 8964 | 2 | 3 | 3 | 2 | `reports/PostHog__posthog.md` |
| prabinmagar/dashboard-ui-with-reactjs | `bc1df8dc` | 15 | 13 | 1 | 1 | 0 | `reports/prabinmagar__dashboard-ui-with-reactjs.md` |
| praveen-sripati/nexus | `87a961ae` | 436 | 35 | 0 | 5 | 0 | `reports/praveen-sripati__nexus.md` |
| prazzon/Flexbox-Labs | `39416e13` | 75 | 26 | 0 | 6 | 0 | `reports/prazzon__Flexbox-Labs.md` |
| proshoumma/Mister-Poster | `17b6a1a9` | 25 | 21 | 0 | 3 | 1 | `reports/proshoumma__Mister-Poster.md` |
| pupilfirst/pupilfirst | `001ec461` | 20 | 6 | 0 | 3 | 3 | `reports/pupilfirst__pupilfirst.md` |
| Qeagle/reporter-engine | `4d06c2f3` | 1791 | 10 | 0 | 6 | 0 | `reports/Qeagle__reporter-engine.md` |
| qiutongxue/oba-live-tool | `1fbc37f1` | 278 | 196 | 0 | 39 | 0 | `reports/qiutongxue__oba-live-tool.md` |
| quintuslabs/fashion-cube | `9b1f46b2` | 161 | 11 | 0 | 1 | 1 | `reports/quintuslabs__fashion-cube.md` |
| r-park/todo-react-redux | `957b72a3` | 16 | 9 | 0 | 7 | 0 | `reports/r-park__todo-react-redux.md` |
| Raathigesh/dazzle | `c4a46f62` | — | 0 | 0 | 0 | 0 | `reports/Raathigesh__dazzle.md` |
| Rabithua/Rote | `ba98b47c` | 343 | 59 | 0 | 9 | 0 | `reports/Rabithua__Rote.md` |
| rahulsahay19/Java-React-FullStack | `143f6325` | 34 | 29 | 0 | 5 | 0 | `reports/rahulsahay19__Java-React-FullStack.md` |
| rainbow-me/rainbow | `2c38c133` | 2400 | 85 | 0 | 19 | 3 | `reports/rainbow-me__rainbow.md` |
| raineroviir/react-redux-socketio-chat | `0739e285` | 15 | 9 | 0 | 6 | 0 | `reports/raineroviir__react-redux-socketio-chat.md` |
| raj074/mern-social-media | `a263449e` | 214 | 144 | 10 | 60 | 0 | `reports/raj074__mern-social-media.md` |
| Rajatm544/MERN-Blog-App | `94f8dc18` | 23 | 17 | 0 | 6 | 0 | `reports/Rajatm544__MERN-Blog-App.md` |
| RameshMF/ReactJS-Spring-Boot-CRUD-Full-Stack-App | `394c5373` | 9 | 1 | 0 | 0 | 0 | `reports/RameshMF__ReactJS-Spring-Boot-CRUD-Full-Stack-App.md` |
| RARgames/4gaBoards | `46dca302` | 567 | 30 | 0 | 6 | 3 | `reports/RARgames__4gaBoards.md` |
| RavelloH/NeutralPress | `8974ae90` | 4428 | 27 | 4 | 5 | 0 | `reports/RavelloH__NeutralPress.md` |
| rcbyr/keen-slider | `520c757a` | 13 | 6 | 7 | 0 | 0 | `reports/rcbyr__keen-slider.md` |
| react-native-config/react-native-config | `HEAD` | — | 0 | 0 | 0 | 0 | `reports/react-native-config__react-native-config.md` |
| react-native-webview/react-native-webview | `eb8ccacd` | 31 | 3 | 24 | 4 | 0 | `reports/react-native-webview__react-native-webview.md` |
| React-Proto/react-proto | `e5e988c7` | 13 | 10 | 0 | 3 | 0 | `reports/React-Proto__react-proto.md` |
| reactide/reactide | `564d8c3b` | 154 | 41 | 0 | 113 | 0 | `reports/reactide__reactide.md` |
| ReactNativeSchool/react-native-social-media-app | `11562470` | 11 | 11 | 0 | 0 | 0 | `reports/ReactNativeSchool__react-native-social-media-app.md` |
| readest/readest | `058d58b4` | 2058 | 943 | 0 | 273 | 0 | `reports/readest__readest.md` |
| relax/relax | `75943ce5` | 628 | 24 | 1 | 1 | 0 | `reports/relax__relax.md` |
| responsively-org/responsively-app | `426e7e8e` | 6 | 2 | 3 | 1 | 0 | `reports/responsively-org__responsively-app.md` |
| rgommezz/react-native-chatgpt | `5c642347` | 43 | 36 | 0 | 1 | 0 | `reports/rgommezz__react-native-chatgpt.md` |
| RhysSullivan/executor | `60e4b33e` | 200 | 4 | 12 | 3 | 1 | `reports/RhysSullivan__executor.md` |
| rock-solid/pwa-theme-woocommerce | `a8cd20c7` | 38 | 30 | 0 | 8 | 0 | `reports/rock-solid__pwa-theme-woocommerce.md` |
| RocketChat/Rocket.Chat | `b6b04aad` | 2925 | 7 | 9 | 6 | 0 | `reports/RocketChat__Rocket.Chat.md` |
| RocketChat/Rocket.Chat.ReactNative | `fca8b8ed` | 1195 | 510 | 440 | 245 | 0 | `reports/RocketChat__Rocket.Chat.ReactNative.md` |
| rocketseat-education/nlw-expert-react | `a610fdc6` | 23 | 3 | 0 | 1 | 0 | `reports/rocketseat-education__nlw-expert-react.md` |
| running-elephant/datart | `1af9c5d3` | 1241 | 530 | 310 | 401 | 0 | `reports/running-elephant__datart.md` |
| ruppysuppy/Pizza-Man | `fbba9559` | 19 | 12 | 0 | 4 | 0 | `reports/ruppysuppy__Pizza-Man.md` |
| safe-global/safe-wallet-monorepo | `4e0b23eb` | 2566 | 79 | 9 | 19 | 0 | `reports/safe-global__safe-wallet-monorepo.md` |
| sahat/newedenfaces-react | `653bfa2f` | 18 | 8 | 0 | 1 | 1 | `reports/sahat__newedenfaces-react.md` |
| saleor/saleor-dashboard | `d4808cc1` | 1488 | 13 | 4 | 9 | 0 | `reports/saleor__saleor-dashboard.md` |
| sanity-io/sanity | `3d2b9de3` | 2430 | 91 | 1 | 29 | 3 | `reports/sanity-io__sanity.md` |
| sanjeevyadavIT/magento_react_native | `d8233e76` | 7 | 2 | 2 | 3 | 0 | `reports/sanjeevyadavIT__magento_react_native.md` |
| santifer/cv-santiago | `0e5e9295` | 838 | 372 | 5 | 464 | 0 | `reports/santifer__cv-santiago.md` |
| satnaing/satnaing.dev | `d6d35ce1` | — | 0 | 0 | 0 | 0 | `reports/satnaing__satnaing.dev.md` |
| Saurabh-8585/MERN-E-Commerce-Frontend | `3fa84b02` | 127 | 25 | 0 | 1 | 0 | `reports/Saurabh-8585__MERN-E-Commerce-Frontend.md` |
| schneidmaster/socializer | `f33cf1d1` | 12 | 5 | 0 | 1 | 0 | `reports/schneidmaster__socializer.md` |
| seanmiller802/BrowserTime | `9d472ef8` | 49 | 30 | 0 | 19 | 0 | `reports/seanmiller802__BrowserTime.md` |
| seawind8888/Nobibi | `9291a64d` | 57 | 11 | 2 | 6 | 0 | `reports/seawind8888__Nobibi.md` |
| seeden/react-g-analytics | `538e8b38` | 5 | 4 | 1 | 0 | 0 | `reports/seeden__react-g-analytics.md` |
| seenaburns/isolate | `608ae13c` | 31 | 27 | 0 | 4 | 0 | `reports/seenaburns__isolate.md` |
| segmentio/analytics-react-native | `4604cffb` | 31 | 15 | 2 | 14 | 0 | `reports/segmentio__analytics-react-native.md` |
| seniv/react-native-notifier | `99bdea4d` | 155 | 33 | 118 | 4 | 0 | `reports/seniv__react-native-notifier.md` |
| shadcn-ui/ui | `15ac1be9` | 2770 | 13 | 16 | 7 | 0 | `reports/shadcn-ui__ui.md` |
| shamahoque/mern-social | `4a81f6c8` | 58 | 13 | 0 | 4 | 0 | `reports/shamahoque__mern-social.md` |
| Sherlockouo/music | `fa687ea3` | 493 | 314 | 0 | 82 | 0 | `reports/Sherlockouo__music.md` |
| Shopify/react-native-skia | `0d47d50f` | — | 0 | 0 | 0 | 0 | `reports/Shopify__react-native-skia.md` |
| Shpendrr/react-app-structure | `ba37c821` | 1 | 1 | 0 | 0 | 0 | `reports/Shpendrr__react-app-structure.md` |
| shubham1710/MERN-E-Commerce | `fb2e9094` | 9 | 4 | 0 | 0 | 0 | `reports/shubham1710__MERN-E-Commerce.md` |
| shwosner/realtime-chat-supabase-react | `2c0a5002` | 31 | 31 | 0 | 0 | 0 | `reports/shwosner__realtime-chat-supabase-react.md` |
| signalapp/Signal-Desktop | `1b2a3e7b` | 1153 | 510 | 370 | 273 | 0 | `reports/signalapp__Signal-Desktop.md` |
| SigNoz/signoz | `51522019` | 3565 | 38 | 1 | 6 | 0 | `reports/SigNoz__signoz.md` |
| Skyfay/SkySend | `c39bbb11` | 294 | 216 | 0 | 71 | 0 | `reports/Skyfay__SkySend.md` |
| sneljo1/auryo | `5180622e` | 203 | 130 | 14 | 59 | 0 | `reports/sneljo1__auryo.md` |
| Snouzy/workout-cool | `77f25a92` | 2118 | 841 | 0 | 763 | 0 | `reports/Snouzy__workout-cool.md` |
| software-mansion-labs/react-native-rag | `ae10ae5c` | 22 | 7 | 0 | 2 | 0 | `reports/software-mansion-labs__react-native-rag.md` |
| software-mansion/react-native-gesture-handler | `ea5f23f3` | 250 | 40 | 0 | 10 | 3 | `reports/software-mansion__react-native-gesture-handler.md` |
| software-mansion/react-native-screens | `e6b35443` | 1305 | 26 | 2 | 8 | 0 | `reports/software-mansion__react-native-screens.md` |
| SolidZORO/leaa | `78432d60` | 187 | 21 | 0 | 5 | 0 | `reports/SolidZORO__leaa.md` |
| songxiaoliang/ReactNativeApp | `28764ef3` | 842 | 1 | 888 | 0 | 0 | `reports/songxiaoliang__ReactNativeApp.md` |
| soroushchehresa/unsplash-wallpapers | `61f0c3ae` | 3 | 3 | 0 | 0 | 0 | `reports/soroushchehresa__unsplash-wallpapers.md` |
| southliu/south-admin-react | `9f24027a` | 275 | 193 | 0 | 35 | 0 | `reports/southliu__south-admin-react.md` |
| sqlectron/sqlectron | `e06d34a3` | 240 | 30 | 0 | 6 | 3 | `reports/sqlectron__sqlectron.md` |
| sqlrooms/sqlrooms | `40b6de7d` | 2664 | 80 | 0 | 41 | 0 | `reports/sqlrooms__sqlrooms.md` |
| srbhr/Resume-Matcher | `25af0d9c` | 528 | 52 | 0 | 6 | 0 | `reports/srbhr__Resume-Matcher.md` |
| standardnotes/app | `a5984ae5` | 1281 | 720 | 310 | 251 | 0 | `reports/standardnotes__app.md` |
| stellar/dashboard | `820a1799` | 27 | 9 | 12 | 6 | 0 | `reports/stellar__dashboard.md` |
| stephensanwo/fullstack-ai-chatbot | `256471e5` | 18 | 8 | 1 | 2 | 0 | `reports/stephensanwo__fullstack-ai-chatbot.md` |
| stoneWeb/elm-react-native | `ea0f9a27` | 126 | 13 | 0 | 1 | 0 | `reports/stoneWeb__elm-react-native.md` |
| storybookjs/react-native | `c74a8096` | 328 | 48 | 1 | 19 | 0 | `reports/storybookjs__react-native.md` |
| streamlabs/desktop | `a5ad2600` | 1817 | 13 | 1 | 6 | 0 | `reports/streamlabs__desktop.md` |
| streetwriters/notesnook | `8093f44a` | 1823 | 13 | 1 | 8 | 0 | `reports/streetwriters__notesnook.md` |
| stuyy/chat-platform-react | `b981b76a` | 118 | 23 | 0 | 1 | 0 | `reports/stuyy__chat-platform-react.md` |
| supabase/supabase | `de30257e` | 8785 | 140 | 2 | 61 | 3 | `reports/supabase__supabase.md` |
| SuperViz/superviz | `a8594328` | 602 | 53 | 0 | 27 | 0 | `reports/SuperViz__superviz.md` |
| Syncano/syncano-dashboard | `1db0b4bb` | 455 | 79 | 0 | 1 | 0 | `reports/Syncano__syncano-dashboard.md` |
| t3-oss/create-t3-app | `4709861f` | 68 | 11 | 0 | 7 | 0 | `reports/t3-oss__create-t3-app.md` |
| taiwo-adewale/ecommerce-admin | `dc58dd39` | 283 | 121 | 0 | 131 | 0 | `reports/taiwo-adewale__ecommerce-admin.md` |
| taniarascia/chat | `c2ee1db7` | 30 | 13 | 0 | 17 | 0 | `reports/taniarascia__chat.md` |
| taskrabbit/react-native-zendesk-chat | `87c1148a` | — | 0 | 0 | 0 | 0 | `reports/taskrabbit__react-native-zendesk-chat.md` |
| teableio/teable | `bda82ee5` | 3337 | 2158 | 247 | 930 | 2 | `reports/teableio__teable.md` |
| TeXlyre/texlyre | `a1244076` | 2172 | 24 | 6 | 7 | 0 | `reports/TeXlyre__texlyre.md` |
| TheCoderDream/React-Ecommerce-App-with-Redux | `a83dde72` | 23 | 15 | 6 | 2 | 0 | `reports/TheCoderDream__React-Ecommerce-App-with-Redux.md` |
| themisvaltinos/Auction-Website | `f456b561` | 212 | 145 | 12 | 55 | 0 | `reports/themisvaltinos__Auction-Website.md` |
| Timonwa/react-chat | `bbb95556` | 6 | 6 | 0 | 0 | 0 | `reports/Timonwa__react-chat.md` |
| tinacms/tinacms | `8cbed247` | 1215 | 770 | 115 | 330 | 0 | `reports/tinacms__tinacms.md` |
| tinode/webapp | `ac779ef3` | 379 | 305 | 5 | 69 | 0 | `reports/tinode__webapp.md` |
| tldraw/tldraw | `f9a046be` | 1316 | 9 | 9 | 10 | 1 | `reports/tldraw__tldraw.md` |
| toeverything/AFFiNE | `f19a9227` | 10 | 2 | 4 | 0 | 0 | `reports/toeverything__AFFiNE.md` |
| ToolJet/ToolJet | `f33ff86c` | — | 0 | 0 | 0 | 7 | `reports/ToolJet__ToolJet.md` |
| trananhtuat/tua-react-admin | `faf7ba16` | 20 | 4 | 0 | 1 | 0 | `reports/trananhtuat__tua-react-admin.md` |
| transmute-app/transmute | `f7f52015` | 162 | 58 | 0 | 69 | 0 | `reports/transmute-app__transmute.md` |
| triggerdotdev/trigger.dev | `6b0e78f1` | 2818 | 10 | 10 | 11 | 0 | `reports/triggerdotdev__trigger.dev.md` |
| tsurupin/portfolio | `d3d3cb8a` | 97 | 66 | 0 | 14 | 0 | `reports/tsurupin__portfolio.md` |
| twentyhq/twenty | `7ade9e3a` | 4707 | 2300 | 760 | 1490 | 0 | `reports/twentyhq__twenty.md` |
| Ujjalzaman/Easy-Consulting-react | `bcfc925b` | 43 | 16 | 0 | 3 | 0 | `reports/Ujjalzaman__Easy-Consulting-react.md` |
| ujjavaldesai07/spring-boot-react-ecommerce-app | `9ff8fb29` | 81 | 20 | 0 | 2 | 1 | `reports/ujjavaldesai07__spring-boot-react-ecommerce-app.md` |
| umami-software/umami | `a9508e7a` | 1806 | 12 | 0 | 5 | 0 | `reports/umami-software__umami.md` |
| unigraph-dev/unigraph-dev | `a209dfde` | 1078 | 553 | 0 | 241 | 0 | `reports/unigraph-dev__unigraph-dev.md` |
| Uniswap/interface | `e011a5ba` | 4876 | 1982 | 418 | 574 | 0 | `reports/Uniswap__interface.md` |
| unkeyed/unkey | `eb49343a` | 1846 | 17 | 0 | 7 | 0 | `reports/unkeyed__unkey.md` |
| unrealmanu/ga-4-react | `ec99a94f` | 9 | 4 | 3 | 2 | 0 | `reports/unrealmanu__ga-4-react.md` |
| unvalley/ephe | `4ba31e6c` | 177 | 27 | 0 | 12 | 0 | `reports/unvalley__ephe.md` |
| UsamaSarwar/reactnative-ecommerce-charlie | `379b0f7a` | 421 | 350 | 21 | 50 | 0 | `reports/UsamaSarwar__reactnative-ecommerce-charlie.md` |
| usebruno/bruno | `dd922c71` | 2526 | 1395 | 460 | 671 | 0 | `reports/usebruno__bruno.md` |
| usememos/memos | `ca2bc4eb` | 685 | 5 | 5 | 5 | 1 | `reports/usememos__memos.md` |
| vercel/commerce | `1df2cf6f` | 100 | 48 | 0 | 37 | 0 | `reports/vercel__commerce.md` |
| veyliss/ai-localbase | `c64b0080` | 77 | 24 | 1 | 0 | 0 | `reports/veyliss__ai-localbase.md` |
| victoralvesf/aonsoku | `25512728` | 605 | 195 | 0 | 192 | 0 | `reports/victoralvesf__aonsoku.md` |
| victorbalssa/abacus | `d27b1126` | 209 | 130 | 18 | 61 | 0 | `reports/victorbalssa__abacus.md` |
| vivekkakadiya/Organica | `c77525b7` | 56 | 15 | 0 | 2 | 0 | `reports/vivekkakadiya__Organica.md` |
| walljser/cms_community_e_commerce | `d3be35d1` | 32 | 15 | 3 | 14 | 0 | `reports/walljser__cms_community_e_commerce.md` |
| walljser/community_e_commerce | `5f9fc50f` | 72 | 56 | 0 | 12 | 0 | `reports/walljser__community_e_commerce.md` |
| wangrongding/wallpaper-box | `d2e488e0` | 154 | 31 | 0 | 6 | 0 | `reports/wangrongding__wallpaper-box.md` |
| webstudio-is/webstudio | `ac14670d` | 2790 | 1112 | 809 | 316 | 0 | `reports/webstudio-is__webstudio.md` |
| WJZ-P/TFT-Hextech-Helper | `34afcaad` | 146 | 138 | 0 | 8 | 0 | `reports/WJZ-P__TFT-Hextech-Helper.md` |
| wojtekmaj/react-calendar | `30eee6d6` | 238 | 6 | 0 | 4 | 0 | `reports/wojtekmaj__react-calendar.md` |
| wojtekmaj/react-pdf | `5dc80a8a` | 94 | 11 | 0 | 3 | 0 | `reports/wojtekmaj__react-pdf.md` |
| woocommerce/woocommerce | `45076b80` | 1254 | 870 | 140 | 244 | 0 | `reports/woocommerce__woocommerce.md` |
| wulkano/Kap | `c42692fa` | 244 | 38 | 1 | 5 | 0 | `reports/wulkano__Kap.md` |
| wwayne/react-native-nba-app | `f0cdfcad` | 49 | 13 | 24 | 12 | 0 | `reports/wwayne__react-native-nba-app.md` |
| xanderfrangos/twinkle-tray | `4fce279d` | 173 | 54 | 0 | 5 | 0 | `reports/xanderfrangos__twinkle-tray.md` |
| ximing/weditor | `a2bf6386` | 96 | 44 | 0 | 16 | 0 | `reports/ximing__weditor.md` |
| Xtrendence/Cryptofolio | `51f7263e` | 240 | 32 | 0 | 2 | 0 | `reports/Xtrendence__Cryptofolio.md` |
| yang991178/fluent-reader | `cd331fbe` | 133 | 72 | 61 | 0 | 0 | `reports/yang991178__fluent-reader.md` |
| YashMarmat/FullStack_Ecommerce_App | `31a190f7` | 61 | 14 | 0 | 3 | 2 | `reports/YashMarmat__FullStack_Ecommerce_App.md` |
| yeahhe365/Prisma | `f1dc7563` | 260 | 26 | 1 | 7 | 1 | `reports/yeahhe365__Prisma.md` |
| yinxin630/fiora | `d741c006` | 177 | 73 | 0 | 7 | 0 | `reports/yinxin630__fiora.md` |
| yonatanmgr/mathberet | `818c54c5` | 126 | 76 | 0 | 4 | 0 | `reports/yonatanmgr__mathberet.md` |
| yoonic/nicistore | `6396e7c9` | 326 | 19 | 0 | 3 | 1 | `reports/yoonic__nicistore.md` |
| Yooooomi/your_spotify | `96582310` | 125 | 53 | 1 | 42 | 0 | `reports/Yooooomi__your_spotify.md` |
| yTakkar/MERN-Social-Network | `9e10342c` | — | 0 | 0 | 0 | 0 | `reports/yTakkar__MERN-Social-Network.md` |
| yTakkar/React-Mini-Social-Network | `241f0b49` | 145 | 8 | 11 | 2 | 1 | `reports/yTakkar__React-Mini-Social-Network.md` |
| z-9527/admin | `72aaf2dd` | 64 | 14 | 0 | 4 | 0 | `reports/z-9527__admin.md` |
| ZahraMirzaei/online-shop | `d1133090` | 180 | 25 | 0 | 10 | 0 | `reports/ZahraMirzaei__online-shop.md` |
| ZainRk/React-Admin-Dashboard-public | `f0bcc12a` | 9 | 6 | 0 | 1 | 0 | `reports/ZainRk__React-Admin-Dashboard-public.md` |
| zeus-12/uxie | `6d6d326b` | 230 | 18 | 2 | 21 | 0 | `reports/zeus-12__uxie.md` |
| zhufengketang/app | `a79246fc` | 137 | 66 | 42 | 29 | 0 | `reports/zhufengketang__app.md` |
| zuiidea/antd-admin | `f28bae8f` | 68 | 20 | 0 | 5 | 0 | `reports/zuiidea__antd-admin.md` |

## Recommended rule fixes (grouped by recommendation type)

### Keep rule

| Rule | Findings |
|---|---|
| `react-doctor/tailwind-no-default-palette` | 1079 |
| `react-doctor/no-icon-only-button-without-label` | 794 |
| `react-doctor/tailwind-no-redundant-size-axes` | 731 |
| `react-hooks/exhaustive-deps` | 585 |
| `react-doctor/no-array-index-as-key` | 577 |
| `react-hooks(exhaustive-deps)` | 557 |
| `react-doctor/js-combine-iterations` | 522 |
| `jsx-a11y(click-events-have-key-events)` | 489 |
| `jsx-a11y(no-static-element-interactions)` | 433 |
| `react-doctor/no-cascading-set-state` | 323 |
| `effect(no-event-handler)` | 319 |
| `react-doctor/no-giant-component` | 313 |
| `react-doctor/rerender-state-only-in-handlers` | 294 |
| `react-doctor/prefer-useReducer` | 293 |
| `react-doctor/rerender-split-combined-hooks` | 279 |
| `react-doctor/no-full-lodash-import` | 271 |
| `react-doctor/tailwind-no-space-on-flex-children` | 270 |
| `effect(no-derived-state)` | 266 |
| `react-doctor/effect-no-initialize-state` | 237 |
| `react-doctor/client-event-listeners` | 234 |
| `react-doctor/no-generic-handler-names` | 232 |
| `effect/no-derived-state` | 229 |
| `react-doctor/no-effect-event-handler` | 208 |
| `react-doctor/i18n-no-dynamic-translation-key` | 203 |
| `react-doctor/async-await-in-loop` | 198 |

### improve rule logic

| Rule | Findings |
|---|---|
| `effect/no-event-handler` | 43 |
| `react-doctor/no-icon-only-button-without-label` | 35 |
| `react-doctor/async-await-in-loop` | 34 |
| `react-doctor/client-event-listeners` | 31 |
| `react-doctor/no-array-index-as-key` | 23 |
| `react-doctor/effect-no-event-handler` | 22 |
| `react-doctor/no-react19-deprecated-apis` | 19 |
| `effect(no-event-handler)` | 18 |
| `react-doctor/rerender-split-combined-hooks` | 18 |
| `react-doctor/no-barrel-import` | 17 |
| `react-hooks-js/todo` | 17 |
| `react-hooks/rules-of-hooks` | 12 |
| `react-doctor/i18n-no-dynamic-translation-key` | 12 |
| `react-doctor(no-icon-only-button-without-label)` | 11 |
| `react-doctor/no-effect-event-handler` | 10 |
| `react-doctor/js-set-map-lookups` | 10 |
| `react-doctor/rhf-no-watch-render` | 10 |
| `react-doctor(client-event-listeners)` | 10 |
| `react-doctor/rerender-state-only-in-handlers` | 9 |
| `react-doctor/async-parallel` | 9 |
| `react-doctor/react-compiler-destructure-method` | 9 |
| `react-doctor/server-serialization` | 8 |
| `react-doctor/no-derived-useState` | 8 |
| `react(jsx-key)` | 8 |
| `react-doctor/no-swallowed-error` | 7 |

### Improve rule logic

| Rule | Findings |
|---|---|
| `effect/no-event-handler` | 42 |
| `react-doctor/no-icon-only-button-without-label` | 37 |
| `react-doctor/effect-no-event-handler` | 25 |
| `react-doctor/no-effect-event-handler` | 23 |
| `react-doctor/rerender-split-combined-hooks` | 16 |
| `react-doctor/no-react19-deprecated-apis` | 15 |
| `react-doctor/client-event-listeners` | 15 |
| `react-doctor(no-react19-deprecated-apis)` | 11 |
| `react-doctor/prefer-dynamic-import` | 10 |
| `react-doctor/effect-no-adjust-state-on-prop-change` | 10 |
| `react-doctor/effect-no-initialize-state` | 9 |
| `react-doctor/rendering-usetransition-loading` | 9 |
| `effect(no-event-handler)` | 8 |
| `effect/no-derived-state` | 8 |
| `react-doctor/tailwind-no-default-palette` | 8 |
| `react-doctor/react-compiler-destructure-method` | 8 |
| `react-doctor/i18n-no-dynamic-translation-key` | 8 |
| `react-doctor/no-secrets-in-client-code` | 8 |
| `react-doctor/async-await-in-loop` | 7 |
| `react-doctor/no-barrel-import` | 7 |
| `react-hooks-js(todo)` | 7 |
| `oxlint/unknown` | 7 |
| `react-doctor/no-derived-state-effect` | 7 |
| `react-doctor/bundle-conditional` | 7 |
| `react-doctor/rendering-svg-precision` | 7 |

### improve ignore/generated-file handling

| Rule | Findings |
|---|---|
| `react-doctor/testing-no-container-query` | 22 |
| `react-doctor/js-set-map-lookups` | 21 |
| `react-doctor/no-icon-only-button-without-label` | 20 |
| `react-doctor(no-icon-only-button-without-label)` | 16 |
| `react-doctor/no-array-index-as-key` | 14 |
| `react-doctor/js-combine-iterations` | 14 |
| `react-doctor/no-secrets-in-client-code` | 14 |
| `react-doctor/rendering-hydration-mismatch-time` | 12 |
| `react-doctor/js-index-maps` | 11 |
| `react-doctor/no-swallowed-error` | 10 |
| `react-doctor/js-flatmap-filter` | 10 |
| `react-doctor/client-event-listeners` | 9 |
| `react-doctor/js-cache-property-access` | 9 |
| `react-doctor/js-batch-dom-css` | 8 |
| `react-doctor/js-cache-storage` | 8 |
| `effect/no-event-handler` | 8 |
| `react-doctor/i18n-no-dynamic-translation-key` | 8 |
| `react-doctor/rendering-svg-precision` | 8 |
| `react-doctor/prefer-useReducer` | 7 |
| `react-doctor/js-tosorted-immutable` | 7 |
| `react-doctor/effect-no-initialize-state` | 6 |
| `react-doctor/no-cascading-set-state` | 6 |
| `react-doctor/no-giant-component` | 6 |
| `react-doctor/no-dynamic-import-path` | 6 |
| `react-doctor/client-localstorage-no-version` | 6 |

### improve project/framework detection

| Rule | Findings |
|---|---|
| `react-doctor(tailwind-no-default-palette)` | 56 |
| `react-doctor(server-serialization)` | 36 |
| `react-doctor(no-barrel-import)` | 25 |
| `react-doctor/rendering-hydration-mismatch-time` | 12 |
| `react-hooks/exhaustive-deps` | 12 |
| `react-doctor(design-no-bold-heading)` | 11 |
| `react-doctor/server-serialization` | 10 |
| `react-doctor/nextjs-no-use-search-params-without-suspense` | 8 |
| `react-doctor/rn-prefer-pressable` | 6 |
| `react-hooks-js/refs` | 6 |
| `unknown` | 6 |
| `react-doctor/js-combine-iterations` | 5 |
| `react-doctor/nextjs-missing-metadata` | 5 |
| `react-doctor/nextjs-no-img-element` | 5 |
| `react-doctor/shadcn-no-direct-radix-import` | 5 |
| `react-doctor/project-discovery` | 5 |
| `react-doctor/rn-no-dimensions-get` | 5 |
| `react/no-unknown-property` | 5 |
| `react-doctor/client-event-listeners` | 4 |
| `react-doctor/no-full-lodash-import` | 4 |
| `react-doctor(rendering-hydration-mismatch-time)` | 4 |
| `react-hooks/rules-of-hooks` | 4 |
| `react-doctor/rn-no-inline-flatlist-renderitem` | 4 |
| `react-doctor/rn-prefer-expo-image` | 4 |
| `react-doctor/rn-no-web-dom-elements` | 4 |

### Improve project/framework detection

| Rule | Findings |
|---|---|
| `react-doctor/rendering-hydration-mismatch-time` | 42 |
| `react-doctor/server-serialization` | 16 |
| `react-doctor/rn-prefer-expo-image` | 7 |
| `oxlint/react-doctor(rendering-hydration-mismatch-time)` | 6 |
| `react-doctor(shadcn-no-direct-radix-import)` | 6 |
| `react-doctor/tailwind-no-conflicting-classes` | 6 |
| `react(no-unknown-property)` | 4 |
| `react-doctor(rendering-hydration-mismatch-time)` | 4 |
| `react-doctor/no-barrel-import` | 3 |
| `react-doctor/rendering-activity` | 3 |
| `react-doctor/server-sequential-independent-await` | 3 |
| `react-hooks/rules-of-hooks` | 3 |
| `oxlint/react-doctor(server-serialization)` | 3 |
| `react/no-unknown-property` | 3 |
| `react-doctor/rendering-hydration-no-flicker` | 3 |
| `react-doctor(rn-no-web-dom-elements)` | 3 |
| `project-detection` | 3 |
| `react-doctor/server-dedup-props` | 3 |
| `react-doctor/no-full-lodash-import` | 2 |
| `react-doctor(server-serialization)` | 2 |
| `oxlint/react-doctor(no-icon-only-button-without-label)` | 2 |
| `react-doctor/rn-no-web-dom-elements` | 2 |
| `projects:0 detection failure` | 2 |
| `Project detection` | 2 |
| `react-doctor/aggregate-multi-project` | 2 |

### add missing detection

| Rule | Findings |
|---|---|
| `react-doctor/no-swallowed-error` | 60 |
| `react-doctor/client-localstorage-no-version` | 30 |
| `react-doctor/no-react-dom-deprecated-apis` | 17 |
| `react-doctor/no-array-index-as-key` | 15 |
| `react-doctor/no-eval` | 10 |
| `react-doctor/client-event-listeners` | 4 |
| `react-doctor/no-moment` | 3 |
| `react-doctor(client-event-listeners)` | 3 |
| `react-doctor/no-icon-only-button-without-label` | 2 |
| `react-doctor/no-full-lodash-import` | 2 |
| `react-doctor/testing-no-container-query` | 2 |
| `react-doctor(no-swallowed-error)` | 2 |
| `react-doctor/no-giant-component` | 1 |
| `react-doctor(no-icon-only-button-without-label)` | 1 |
| `react-doctor/no-z-index-9999` | 1 |
| `react-doctor/rendering-svg-precision` | 1 |
| `react-doctor/no-prevent-default` | 1 |
| `react-doctor/no-disabled-zoom` | 1 |
| `react-doctor(testing-no-container-query)` | 1 |

### Improve ignore/generated-file handling

| Rule | Findings |
|---|---|
| `react-doctor/no-secrets-in-client-code` | 4 |
| `react-doctor/js-cache-property-access` | 3 |
| `react-doctor/js-set-map-lookups` | 3 |
| `oxlint/react-doctor(js-combine-iterations)` | 3 |
| `oxlint/react-doctor(no-swallowed-error)` | 3 |
| `oxlint/react-doctor(no-dynamic-import-path)` | 3 |
| `react-doctor/no-eval` | 3 |
| `react-doctor/no-array-index-as-key` | 2 |
| `react-doctor/js-batch-dom-css` | 2 |
| `react-doctor/no-giant-component` | 2 |
| `react-doctor/no-swallowed-error` | 2 |
| `react-doctor/js-combine-iterations` | 2 |
| `jsx-a11y/anchor-is-valid` | 2 |
| `react-doctor/async-parallel` | 2 |
| `react-hooks/rules-of-hooks` | 2 |
| `oxlint/react-doctor(js-set-map-lookups)` | 2 |
| `oxlint/react-doctor(js-cache-property-access)` | 2 |
| `react-doctor/rendering-svg-precision` | 2 |
| `react-doctor/js-hoist-intl` | 2 |
| `react-doctor/js-cache-function-results` | 2 |
| `oxlint/react-doctor(i18n-no-dynamic-translation-key)` | 2 |
| `react-doctor/no-icon-only-button-without-label` | 1 |
| `react-doctor/async-await-in-loop` | 1 |
| `react-doctor/js-hoist-regexp` | 1 |
| `react-doctor/js-tosorted-immutable` | 1 |

### Add missing detection

| Rule | Findings |
|---|---|
| `react-doctor(no-icon-only-button-without-label)` | 3 |
| `react-doctor/client-event-listeners` | 1 |
| `react-doctor/no-full-lodash-import` | 1 |
| `react-doctor(client-event-listeners)` | 1 |
| `react-doctor/no-fetch-in-effect` | 1 |
| `react-doctor(no-legacy-class-lifecycles)` | 1 |
| `missed/no-render-in-render` | 1 |

### improve generated-file handling

| Rule | Findings |
|---|---|
| `react-doctor/rendering-svg-precision` | 2 |
| `react-doctor/no-react19-deprecated-apis` | 1 |

### Improve generated-file handling

| Rule | Findings |
|---|---|
| `react-doctor/no-icon-only-button-without-label` | 1 |
