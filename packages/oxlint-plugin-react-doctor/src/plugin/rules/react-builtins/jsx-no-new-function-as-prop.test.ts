// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-new-function-as-prop.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-new-function-as-prop.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoNewFunctionAsProp } from "./jsx-no-new-function-as-prop.js";

const divergence = DIVERGENCES["jsx-no-new-function-as-prop"];
runOxcFixtures(
  "react-builtins/jsx-no-new-function-as-prop",
  jsxNoNewFunctionAsProp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-new-function-as-prop"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
