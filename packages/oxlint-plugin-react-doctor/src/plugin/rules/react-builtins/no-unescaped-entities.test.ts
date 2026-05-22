// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-unescaped-entities.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-unescaped-entities.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noUnescapedEntities } from "./no-unescaped-entities.js";

const divergence = DIVERGENCES["no-unescaped-entities"];
runOxcFixtures(
  "react-builtins/no-unescaped-entities",
  noUnescapedEntities,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-unescaped-entities"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
