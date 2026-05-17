// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-boolean-value.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-boolean-value.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxBooleanValue } from "./jsx-boolean-value.js";

const divergence = DIVERGENCES["jsx-boolean-value"];
runOxcFixtures(
  "react-builtins/jsx-boolean-value",
  jsxBooleanValue,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-boolean-value"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
