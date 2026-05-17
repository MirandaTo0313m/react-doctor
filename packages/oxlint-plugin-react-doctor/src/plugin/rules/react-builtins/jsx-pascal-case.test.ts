// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-pascal-case.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-pascal-case.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxPascalCase } from "./jsx-pascal-case.js";

const divergence = DIVERGENCES["jsx-pascal-case"];
runOxcFixtures(
  "react-builtins/jsx-pascal-case",
  jsxPascalCase,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-pascal-case"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
