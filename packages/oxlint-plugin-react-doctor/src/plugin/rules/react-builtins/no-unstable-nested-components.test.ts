// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-unstable-nested-components.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-unstable-nested-components.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noUnstableNestedComponents } from "./no-unstable-nested-components.js";

const divergence = DIVERGENCES["no-unstable-nested-components"];
runOxcFixtures(
  "react-builtins/no-unstable-nested-components",
  noUnstableNestedComponents,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-unstable-nested-components"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
