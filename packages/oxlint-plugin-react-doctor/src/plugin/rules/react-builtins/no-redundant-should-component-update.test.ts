// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-redundant-should-component-update.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import {
  failCases,
  passCases,
} from "./__fixtures__/no-redundant-should-component-update.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noRedundantShouldComponentUpdate } from "./no-redundant-should-component-update.js";

const divergence = DIVERGENCES["no-redundant-should-component-update"];
runOxcFixtures(
  "react-builtins/no-redundant-should-component-update",
  noRedundantShouldComponentUpdate,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-redundant-should-component-update"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
