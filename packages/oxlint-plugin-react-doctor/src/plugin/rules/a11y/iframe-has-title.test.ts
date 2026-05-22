// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `iframe-has-title.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/iframe-has-title.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { iframeHasTitle } from "./iframe-has-title.js";

const divergence = DIVERGENCES["iframe-has-title"];
runOxcFixtures(
  "a11y/iframe-has-title",
  iframeHasTitle,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["iframe-has-title"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
