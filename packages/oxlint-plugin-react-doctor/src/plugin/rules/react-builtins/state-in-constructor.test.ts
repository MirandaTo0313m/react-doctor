// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `state-in-constructor.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/state-in-constructor.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { stateInConstructor } from "./state-in-constructor.js";

const divergence = DIVERGENCES["state-in-constructor"];
runOxcFixtures(
  "react-builtins/state-in-constructor",
  stateInConstructor,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["state-in-constructor"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
