// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `img-redundant-alt.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/img-redundant-alt.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { imgRedundantAlt } from "./img-redundant-alt.js";

const divergence = DIVERGENCES["img-redundant-alt"];
runOxcFixtures(
  "a11y/img-redundant-alt",
  imgRedundantAlt,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["img-redundant-alt"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
