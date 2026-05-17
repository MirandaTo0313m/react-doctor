// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-static-element-interactions.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-static-element-interactions.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noStaticElementInteractions } from "./no-static-element-interactions.js";

const divergence = DIVERGENCES["no-static-element-interactions"];
runOxcFixtures(
  "a11y/no-static-element-interactions",
  noStaticElementInteractions,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-static-element-interactions"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
