// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-distracting-elements.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-distracting-elements.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noDistractingElements } from "./no-distracting-elements.js";

const divergence = DIVERGENCES["no-distracting-elements"];
runOxcFixtures(
  "a11y/no-distracting-elements",
  noDistractingElements,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-distracting-elements"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
