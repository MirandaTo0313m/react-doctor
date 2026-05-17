// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `only-export-components.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/only-export-components.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { onlyExportComponents } from "./only-export-components.js";

const divergence = DIVERGENCES["only-export-components"];
runOxcFixtures(
  "react-builtins/only-export-components",
  onlyExportComponents,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["only-export-components"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
