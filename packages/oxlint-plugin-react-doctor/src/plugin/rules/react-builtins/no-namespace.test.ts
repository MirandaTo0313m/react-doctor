// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-namespace.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-namespace.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noNamespace } from "./no-namespace.js";

const divergence = DIVERGENCES["no-namespace"];
runOxcFixtures(
  "react-builtins/no-namespace",
  noNamespace,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-namespace"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
