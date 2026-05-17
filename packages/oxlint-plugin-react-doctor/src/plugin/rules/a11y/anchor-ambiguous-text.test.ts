// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `anchor-ambiguous-text.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/anchor-ambiguous-text.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { anchorAmbiguousText } from "./anchor-ambiguous-text.js";

const divergence = DIVERGENCES["anchor-ambiguous-text"];
runOxcFixtures(
  "a11y/anchor-ambiguous-text",
  anchorAmbiguousText,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["anchor-ambiguous-text"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
