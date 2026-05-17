// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `mouse-events-have-key-events.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/mouse-events-have-key-events.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { mouseEventsHaveKeyEvents } from "./mouse-events-have-key-events.js";

const divergence = DIVERGENCES["mouse-events-have-key-events"];
runOxcFixtures(
  "a11y/mouse-events-have-key-events",
  mouseEventsHaveKeyEvents,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["mouse-events-have-key-events"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
