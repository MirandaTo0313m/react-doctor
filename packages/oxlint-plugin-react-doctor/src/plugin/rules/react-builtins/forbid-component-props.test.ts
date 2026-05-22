// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `forbid-component-props.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/forbid-component-props.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { forbidComponentProps } from "./forbid-component-props.js";

const divergence = DIVERGENCES["forbid-component-props"];
runOxcFixtures(
  "react-builtins/forbid-component-props",
  forbidComponentProps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["forbid-component-props"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
