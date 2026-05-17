// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-multi-comp.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-multi-comp.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noMultiComp } from "./no-multi-comp.js";

const divergence = DIVERGENCES["no-multi-comp"];
runOxcFixtures(
  "react-builtins/no-multi-comp",
  noMultiComp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-multi-comp"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
