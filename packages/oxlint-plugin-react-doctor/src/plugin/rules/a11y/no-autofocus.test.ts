// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-autofocus.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-autofocus.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noAutofocus } from "./no-autofocus.js";

const divergence = DIVERGENCES["no-autofocus"];
runOxcFixtures(
  "a11y/no-autofocus",
  noAutofocus,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-autofocus"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
