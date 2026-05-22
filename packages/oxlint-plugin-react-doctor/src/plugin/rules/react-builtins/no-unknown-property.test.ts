// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-unknown-property.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-unknown-property.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noUnknownProperty } from "./no-unknown-property.js";

const divergence = DIVERGENCES["no-unknown-property"];
runOxcFixtures(
  "react-builtins/no-unknown-property",
  noUnknownProperty,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-unknown-property"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
