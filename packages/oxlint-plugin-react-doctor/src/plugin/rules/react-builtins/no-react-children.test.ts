// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-react-children.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-react-children.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noReactChildren } from "./no-react-children.js";

const divergence = DIVERGENCES["no-react-children"];
runOxcFixtures(
  "react-builtins/no-react-children",
  noReactChildren,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-react-children"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
