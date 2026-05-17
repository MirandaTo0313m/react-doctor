// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `interactive-supports-focus.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/interactive-supports-focus.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { interactiveSupportsFocus } from "./interactive-supports-focus.js";

const divergence = DIVERGENCES["interactive-supports-focus"];
runOxcFixtures(
  "a11y/interactive-supports-focus",
  interactiveSupportsFocus,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["interactive-supports-focus"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
