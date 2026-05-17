// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-undef.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-undef.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoUndef } from "./jsx-no-undef.js";

const divergence = DIVERGENCES["jsx-no-undef"];
runOxcFixtures(
  "react-builtins/jsx-no-undef",
  jsxNoUndef,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-undef"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
