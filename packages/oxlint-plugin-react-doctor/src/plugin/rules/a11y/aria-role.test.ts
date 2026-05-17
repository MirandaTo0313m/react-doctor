// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `aria-role.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/aria-role.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { ariaRole } from "./aria-role.js";

const divergence = DIVERGENCES["aria-role"];
runOxcFixtures(
  "a11y/aria-role",
  ariaRole,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["aria-role"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
