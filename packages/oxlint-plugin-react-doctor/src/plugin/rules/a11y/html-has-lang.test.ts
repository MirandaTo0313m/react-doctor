// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `html-has-lang.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/html-has-lang.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { htmlHasLang } from "./html-has-lang.js";

const divergence = DIVERGENCES["html-has-lang"];
runOxcFixtures(
  "a11y/html-has-lang",
  htmlHasLang,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["html-has-lang"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
