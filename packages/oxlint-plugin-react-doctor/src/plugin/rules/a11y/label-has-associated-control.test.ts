// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `label-has-associated-control.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/label-has-associated-control.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { labelHasAssociatedControl } from "./label-has-associated-control.js";

const divergence = DIVERGENCES["label-has-associated-control"];
runOxcFixtures(
  "a11y/label-has-associated-control",
  labelHasAssociatedControl,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["label-has-associated-control"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
