// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-useless-fragment.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-useless-fragment.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoUselessFragment } from "./jsx-no-useless-fragment.js";

const divergence = DIVERGENCES["jsx-no-useless-fragment"];
runOxcFixtures(
  "react-builtins/jsx-no-useless-fragment",
  jsxNoUselessFragment,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-useless-fragment"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
