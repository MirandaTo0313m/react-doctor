// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `exhaustive-deps.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/exhaustive-deps.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { exhaustiveDeps } from "./exhaustive-deps.js";

const divergence = DIVERGENCES["exhaustive-deps"];
runOxcFixtures(
  "react-builtins/exhaustive-deps",
  exhaustiveDeps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["exhaustive-deps"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
