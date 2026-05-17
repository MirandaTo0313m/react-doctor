// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `role-has-required-aria-props.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/role-has-required-aria-props.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { roleHasRequiredAriaProps } from "./role-has-required-aria-props.js";

const divergence = DIVERGENCES["role-has-required-aria-props"];
runOxcFixtures(
  "a11y/role-has-required-aria-props",
  roleHasRequiredAriaProps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["role-has-required-aria-props"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
