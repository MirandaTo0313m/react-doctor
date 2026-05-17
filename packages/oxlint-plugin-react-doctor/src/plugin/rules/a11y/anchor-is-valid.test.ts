// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `anchor-is-valid.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/anchor-is-valid.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { anchorIsValid } from "./anchor-is-valid.js";

const divergence = DIVERGENCES["anchor-is-valid"];
runOxcFixtures(
  "a11y/anchor-is-valid",
  anchorIsValid,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["anchor-is-valid"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
