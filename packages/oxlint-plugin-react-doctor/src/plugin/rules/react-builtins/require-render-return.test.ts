// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `require-render-return.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/require-render-return.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { requireRenderReturn } from "./require-render-return.js";

const divergence = DIVERGENCES["require-render-return"];
runOxcFixtures(
  "react-builtins/require-render-return",
  requireRenderReturn,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["require-render-return"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
