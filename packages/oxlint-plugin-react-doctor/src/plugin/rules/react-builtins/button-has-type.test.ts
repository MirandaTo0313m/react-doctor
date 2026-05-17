// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `button-has-type.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/button-has-type.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { buttonHasType } from "./button-has-type.js";

const divergence = DIVERGENCES["button-has-type"];
runOxcFixtures(
  "react-builtins/button-has-type",
  buttonHasType,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["button-has-type"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
