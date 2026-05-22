// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-new-array-as-prop.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-new-array-as-prop.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoNewArrayAsProp } from "./jsx-no-new-array-as-prop.js";

const divergence = DIVERGENCES["jsx-no-new-array-as-prop"];
runOxcFixtures(
  "react-builtins/jsx-no-new-array-as-prop",
  jsxNoNewArrayAsProp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-new-array-as-prop"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
