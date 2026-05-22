// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-aria-hidden-on-focusable.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-aria-hidden-on-focusable.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noAriaHiddenOnFocusable } from "./no-aria-hidden-on-focusable.js";

const divergence = DIVERGENCES["no-aria-hidden-on-focusable"];
runOxcFixtures(
  "a11y/no-aria-hidden-on-focusable",
  noAriaHiddenOnFocusable,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-aria-hidden-on-focusable"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
