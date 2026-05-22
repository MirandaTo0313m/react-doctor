// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-handler-names.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-handler-names.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxHandlerNames } from "./jsx-handler-names.js";

const divergence = DIVERGENCES["jsx-handler-names"];
runOxcFixtures(
  "react-builtins/jsx-handler-names",
  jsxHandlerNames,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-handler-names"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
