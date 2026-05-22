// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-unsafe.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-unsafe.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noUnsafe } from "./no-unsafe.js";

const divergence = DIVERGENCES["no-unsafe"];
runOxcFixtures(
  "react-builtins/no-unsafe",
  noUnsafe,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-unsafe"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
