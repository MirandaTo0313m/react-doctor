// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `self-closing-comp.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/self-closing-comp.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { selfClosingComp } from "./self-closing-comp.js";

const divergence = DIVERGENCES["self-closing-comp"];
runOxcFixtures(
  "react-builtins/self-closing-comp",
  selfClosingComp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["self-closing-comp"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
