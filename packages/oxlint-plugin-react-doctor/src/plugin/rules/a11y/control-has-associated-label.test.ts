// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `control-has-associated-label.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/control-has-associated-label.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { controlHasAssociatedLabel } from "./control-has-associated-label.js";

const divergence = DIVERGENCES["control-has-associated-label"];
runOxcFixtures(
  "a11y/control-has-associated-label",
  controlHasAssociatedLabel,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["control-has-associated-label"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
