// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-direct-mutation-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-direct-mutation-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noDirectMutationState } from "./no-direct-mutation-state.js";

const divergence = DIVERGENCES["no-direct-mutation-state"];
runOxcFixtures(
  "react-builtins/no-direct-mutation-state",
  noDirectMutationState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-direct-mutation-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
