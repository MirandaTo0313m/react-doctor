// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-props-no-spread-multi.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-props-no-spread-multi.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxPropsNoSpreadMulti } from "./jsx-props-no-spread-multi.js";

const divergence = DIVERGENCES["jsx-props-no-spread-multi"];
runOxcFixtures(
  "react-builtins/jsx-props-no-spread-multi",
  jsxPropsNoSpreadMulti,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-props-no-spread-multi"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
