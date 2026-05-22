// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-render-return-value.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-render-return-value.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noRenderReturnValue } from "./no-render-return-value.js";

const divergence = DIVERGENCES["no-render-return-value"];
runOxcFixtures(
  "react-builtins/no-render-return-value",
  noRenderReturnValue,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-render-return-value"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
