// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-duplicate-props.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-duplicate-props.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoDuplicateProps } from "./jsx-no-duplicate-props.js";

const divergence = DIVERGENCES["jsx-no-duplicate-props"];
runOxcFixtures(
  "react-builtins/jsx-no-duplicate-props",
  jsxNoDuplicateProps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-duplicate-props"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
