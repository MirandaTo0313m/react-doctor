// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-max-depth.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-max-depth.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxMaxDepth } from "./jsx-max-depth.js";

const divergence = DIVERGENCES["jsx-max-depth"];
runOxcFixtures(
  "react-builtins/jsx-max-depth",
  jsxMaxDepth,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-max-depth"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
