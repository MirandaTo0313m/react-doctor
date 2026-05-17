// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `media-has-caption.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/media-has-caption.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { mediaHasCaption } from "./media-has-caption.js";

const divergence = DIVERGENCES["media-has-caption"];
runOxcFixtures(
  "a11y/media-has-caption",
  mediaHasCaption,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["media-has-caption"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
