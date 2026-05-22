// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `iframe-missing-sandbox.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/iframe-missing-sandbox.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { iframeMissingSandbox } from "./iframe-missing-sandbox.js";

const divergence = DIVERGENCES["iframe-missing-sandbox"];
runOxcFixtures(
  "react-builtins/iframe-missing-sandbox",
  iframeMissingSandbox,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["iframe-missing-sandbox"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
