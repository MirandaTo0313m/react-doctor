// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `heading-has-content.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/heading-has-content.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { headingHasContent } from "./heading-has-content.js";

const divergence = DIVERGENCES["heading-has-content"];
runOxcFixtures(
  "a11y/heading-has-content",
  headingHasContent,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["heading-has-content"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
