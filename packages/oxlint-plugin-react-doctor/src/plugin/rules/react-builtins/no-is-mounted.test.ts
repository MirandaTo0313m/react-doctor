// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-is-mounted.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-is-mounted.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noIsMounted } from "./no-is-mounted.js";

const divergence = DIVERGENCES["no-is-mounted"];
runOxcFixtures(
  "react-builtins/no-is-mounted",
  noIsMounted,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-is-mounted"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
