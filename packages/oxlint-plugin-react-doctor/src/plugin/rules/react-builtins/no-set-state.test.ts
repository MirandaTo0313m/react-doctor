// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-set-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-set-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noSetState } from "./no-set-state.js";

const divergence = DIVERGENCES["no-set-state"];
runOxcFixtures(
  "react-builtins/no-set-state",
  noSetState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-set-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
