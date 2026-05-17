// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `display-name.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/display-name.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { displayName } from "./display-name.js";

const divergence = DIVERGENCES["display-name"];
runOxcFixtures(
  "react-builtins/display-name",
  displayName,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["display-name"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
