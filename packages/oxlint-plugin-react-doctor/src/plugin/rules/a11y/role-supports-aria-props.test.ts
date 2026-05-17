// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `role-supports-aria-props.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/role-supports-aria-props.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { roleSupportsAriaProps } from "./role-supports-aria-props.js";

const divergence = DIVERGENCES["role-supports-aria-props"];
runOxcFixtures(
  "a11y/role-supports-aria-props",
  roleSupportsAriaProps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["role-supports-aria-props"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
