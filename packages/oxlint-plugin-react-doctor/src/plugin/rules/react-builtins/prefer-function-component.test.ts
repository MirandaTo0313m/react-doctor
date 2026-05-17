// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `prefer-function-component.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/prefer-function-component.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { preferFunctionComponent } from "./prefer-function-component.js";

const divergence = DIVERGENCES["prefer-function-component"];
runOxcFixtures(
  "react-builtins/prefer-function-component",
  preferFunctionComponent,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["prefer-function-component"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
