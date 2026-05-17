// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-props-no-spreading.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-props-no-spreading.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxPropsNoSpreading } from "./jsx-props-no-spreading.js";

const divergence = DIVERGENCES["jsx-props-no-spreading"];
runOxcFixtures(
  "react-builtins/jsx-props-no-spreading",
  jsxPropsNoSpreading,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-props-no-spreading"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
