// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `anchor-has-content.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/anchor-has-content.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { anchorHasContent } from "./anchor-has-content.js";

const divergence = DIVERGENCES["anchor-has-content"];
runOxcFixtures(
  "a11y/anchor-has-content",
  anchorHasContent,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["anchor-has-content"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
