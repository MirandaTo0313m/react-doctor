// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-string-refs.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-string-refs.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noStringRefs } from "./no-string-refs.js";

const divergence = DIVERGENCES["no-string-refs"];
runOxcFixtures(
  "react-builtins/no-string-refs",
  noStringRefs,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-string-refs"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
