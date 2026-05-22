// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `forward-ref-uses-ref.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/forward-ref-uses-ref.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { forwardRefUsesRef } from "./forward-ref-uses-ref.js";

const divergence = DIVERGENCES["forward-ref-uses-ref"];
runOxcFixtures(
  "react-builtins/forward-ref-uses-ref",
  forwardRefUsesRef,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["forward-ref-uses-ref"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
