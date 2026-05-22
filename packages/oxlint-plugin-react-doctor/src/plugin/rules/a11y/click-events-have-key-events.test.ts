// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `click-events-have-key-events.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/click-events-have-key-events.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { clickEventsHaveKeyEvents } from "./click-events-have-key-events.js";

const divergence = DIVERGENCES["click-events-have-key-events"];
runOxcFixtures(
  "a11y/click-events-have-key-events",
  clickEventsHaveKeyEvents,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["click-events-have-key-events"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
