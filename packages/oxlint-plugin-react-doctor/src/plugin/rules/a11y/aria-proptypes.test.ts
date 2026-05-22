// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `aria-proptypes.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/aria-proptypes.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { ariaProptypes } from "./aria-proptypes.js";

const divergence = DIVERGENCES["aria-proptypes"];
runOxcFixtures(
  "a11y/aria-proptypes",
  ariaProptypes,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["aria-proptypes"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
