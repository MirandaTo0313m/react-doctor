// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-noninteractive-tabindex.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-noninteractive-tabindex.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noNoninteractiveTabindex } from "./no-noninteractive-tabindex.js";

const divergence = DIVERGENCES["no-noninteractive-tabindex"];
runOxcFixtures(
  "a11y/no-noninteractive-tabindex",
  noNoninteractiveTabindex,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-noninteractive-tabindex"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
