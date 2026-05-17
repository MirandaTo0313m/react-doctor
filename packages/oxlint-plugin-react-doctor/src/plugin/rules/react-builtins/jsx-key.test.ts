// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-key.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-key.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxKey } from "./jsx-key.js";

const divergence = DIVERGENCES["jsx-key"];
runOxcFixtures(
  "react-builtins/jsx-key",
  jsxKey,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-key"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
