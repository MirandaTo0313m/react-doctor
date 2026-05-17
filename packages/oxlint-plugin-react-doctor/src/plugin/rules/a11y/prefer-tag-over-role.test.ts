// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `prefer-tag-over-role.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/prefer-tag-over-role.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { preferTagOverRole } from "./prefer-tag-over-role.js";

const divergence = DIVERGENCES["prefer-tag-over-role"];
runOxcFixtures(
  "a11y/prefer-tag-over-role",
  preferTagOverRole,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["prefer-tag-over-role"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
