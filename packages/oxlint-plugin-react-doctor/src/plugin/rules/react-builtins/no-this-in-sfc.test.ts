// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-this-in-sfc.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-this-in-sfc.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noThisInSfc } from "./no-this-in-sfc.js";

const divergence = DIVERGENCES["no-this-in-sfc"];
runOxcFixtures(
  "react-builtins/no-this-in-sfc",
  noThisInSfc,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-this-in-sfc"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
