// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-redundant-roles.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-redundant-roles.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noRedundantRoles } from "./no-redundant-roles.js";

const divergence = DIVERGENCES["no-redundant-roles"];
runOxcFixtures(
  "a11y/no-redundant-roles",
  noRedundantRoles,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-redundant-roles"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
