// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-danger-with-children.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-danger-with-children.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noDangerWithChildren } from "./no-danger-with-children.js";

const divergence = DIVERGENCES["no-danger-with-children"];
runOxcFixtures(
  "react-builtins/no-danger-with-children",
  noDangerWithChildren,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-danger-with-children"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
