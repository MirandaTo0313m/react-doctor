// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-access-key.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-access-key.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noAccessKey } from "./no-access-key.js";

const divergence = DIVERGENCES["no-access-key"];
runOxcFixtures(
  "a11y/no-access-key",
  noAccessKey,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-access-key"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
