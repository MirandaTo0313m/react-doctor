// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `style-prop-object.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/style-prop-object.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { stylePropObject } from "./style-prop-object.js";

const divergence = DIVERGENCES["style-prop-object"];
runOxcFixtures(
  "react-builtins/style-prop-object",
  stylePropObject,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["style-prop-object"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
