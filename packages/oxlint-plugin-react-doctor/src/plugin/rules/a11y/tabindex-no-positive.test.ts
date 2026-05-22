// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `tabindex-no-positive.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/tabindex-no-positive.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { tabindexNoPositive } from "./tabindex-no-positive.js";

const divergence = DIVERGENCES["tabindex-no-positive"];
runOxcFixtures(
  "a11y/tabindex-no-positive",
  tabindexNoPositive,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["tabindex-no-positive"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
