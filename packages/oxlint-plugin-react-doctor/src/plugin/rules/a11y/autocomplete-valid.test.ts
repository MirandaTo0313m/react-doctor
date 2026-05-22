// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `autocomplete-valid.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/autocomplete-valid.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { autocompleteValid } from "./autocomplete-valid.js";

const divergence = DIVERGENCES["autocomplete-valid"];
runOxcFixtures(
  "a11y/autocomplete-valid",
  autocompleteValid,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["autocomplete-valid"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
