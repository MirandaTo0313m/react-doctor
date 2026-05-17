// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-children-prop.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-children-prop.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noChildrenProp } from "./no-children-prop.js";

const divergence = DIVERGENCES["no-children-prop"];
runOxcFixtures(
  "react-builtins/no-children-prop",
  noChildrenProp,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-children-prop"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
