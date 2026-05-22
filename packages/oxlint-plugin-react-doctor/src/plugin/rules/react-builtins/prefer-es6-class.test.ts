// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `prefer-es6-class.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/prefer-es6-class.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { preferEs6Class } from "./prefer-es6-class.js";

const divergence = DIVERGENCES["prefer-es6-class"];
runOxcFixtures(
  "react-builtins/prefer-es6-class",
  preferEs6Class,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["prefer-es6-class"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
