// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-did-update-set-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-did-update-set-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noDidUpdateSetState } from "./no-did-update-set-state.js";

const divergence = DIVERGENCES["no-did-update-set-state"];
runOxcFixtures(
  "react-builtins/no-did-update-set-state",
  noDidUpdateSetState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-did-update-set-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
