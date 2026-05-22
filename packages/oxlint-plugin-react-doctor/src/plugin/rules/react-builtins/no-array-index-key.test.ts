// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-array-index-key.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-array-index-key.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noArrayIndexKey } from "./no-array-index-key.js";

const divergence = DIVERGENCES["no-array-index-key"];
runOxcFixtures(
  "react-builtins/no-array-index-key",
  noArrayIndexKey,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-array-index-key"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
