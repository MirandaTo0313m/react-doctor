// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-constructed-context-values.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-constructed-context-values.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoConstructedContextValues } from "./jsx-no-constructed-context-values.js";

const divergence = DIVERGENCES["jsx-no-constructed-context-values"];
runOxcFixtures(
  "react-builtins/jsx-no-constructed-context-values",
  jsxNoConstructedContextValues,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-constructed-context-values"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
