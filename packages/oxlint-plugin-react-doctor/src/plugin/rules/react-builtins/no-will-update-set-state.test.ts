// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-will-update-set-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-will-update-set-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noWillUpdateSetState } from "./no-will-update-set-state.js";

const divergence = DIVERGENCES["no-will-update-set-state"];
runOxcFixtures(
  "react-builtins/no-will-update-set-state",
  noWillUpdateSetState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-will-update-set-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
