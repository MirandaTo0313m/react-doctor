// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `aria-unsupported-elements.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/aria-unsupported-elements.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { ariaUnsupportedElements } from "./aria-unsupported-elements.js";

const divergence = DIVERGENCES["aria-unsupported-elements"];
runOxcFixtures(
  "a11y/aria-unsupported-elements",
  ariaUnsupportedElements,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["aria-unsupported-elements"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
