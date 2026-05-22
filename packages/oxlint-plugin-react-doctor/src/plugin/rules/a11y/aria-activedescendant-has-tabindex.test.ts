// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `aria-activedescendant-has-tabindex.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import {
  failCases,
  passCases,
} from "./__fixtures__/aria-activedescendant-has-tabindex.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { ariaActivedescendantHasTabindex } from "./aria-activedescendant-has-tabindex.js";

const divergence = DIVERGENCES["aria-activedescendant-has-tabindex"];
runOxcFixtures(
  "a11y/aria-activedescendant-has-tabindex",
  ariaActivedescendantHasTabindex,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["aria-activedescendant-has-tabindex"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
