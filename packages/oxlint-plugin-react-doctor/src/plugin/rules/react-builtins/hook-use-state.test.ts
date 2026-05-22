// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `hook-use-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/hook-use-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { hookUseState } from "./hook-use-state.js";

const divergence = DIVERGENCES["hook-use-state"];
runOxcFixtures(
  "react-builtins/hook-use-state",
  hookUseState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["hook-use-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
