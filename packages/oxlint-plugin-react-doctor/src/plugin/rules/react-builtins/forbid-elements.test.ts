// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `forbid-elements.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/forbid-elements.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { forbidElements } from "./forbid-elements.js";

const divergence = DIVERGENCES["forbid-elements"];
runOxcFixtures(
  "react-builtins/forbid-elements",
  forbidElements,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["forbid-elements"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
