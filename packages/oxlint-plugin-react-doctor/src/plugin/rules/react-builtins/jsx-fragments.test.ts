// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-fragments.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-fragments.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxFragments } from "./jsx-fragments.js";

const divergence = DIVERGENCES["jsx-fragments"];
runOxcFixtures(
  "react-builtins/jsx-fragments",
  jsxFragments,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-fragments"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
