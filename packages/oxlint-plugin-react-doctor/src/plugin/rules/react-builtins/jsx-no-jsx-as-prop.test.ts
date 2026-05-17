// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-jsx-as-prop.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-jsx-as-prop.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoJsxAsProp } from "./jsx-no-jsx-as-prop.js";

const divergence = DIVERGENCES["jsx-no-jsx-as-prop"];
runOxcFixtures(
  "react-builtins/jsx-no-jsx-as-prop",
  jsxNoJsxAsProp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-jsx-as-prop"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
