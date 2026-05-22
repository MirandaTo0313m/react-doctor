// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-noninteractive-element-to-interactive-role.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import {
  failCases,
  passCases,
} from "./__fixtures__/no-noninteractive-element-to-interactive-role.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noNoninteractiveElementToInteractiveRole } from "./no-noninteractive-element-to-interactive-role.js";

const divergence = DIVERGENCES["no-noninteractive-element-to-interactive-role"];
runOxcFixtures(
  "a11y/no-noninteractive-element-to-interactive-role",
  noNoninteractiveElementToInteractiveRole,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-noninteractive-element-to-interactive-role"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
