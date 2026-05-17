// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `react-in-jsx-scope.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/react-in-jsx-scope.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { reactInJsxScope } from "./react-in-jsx-scope.js";

const divergence = DIVERGENCES["react-in-jsx-scope"];
runOxcFixtures(
  "react-builtins/react-in-jsx-scope",
  reactInJsxScope,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["react-in-jsx-scope"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
