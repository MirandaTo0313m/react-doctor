// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-interactive-element-to-noninteractive-role.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import {
  failCases,
  passCases,
} from "./__fixtures__/no-interactive-element-to-noninteractive-role.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noInteractiveElementToNoninteractiveRole } from "./no-interactive-element-to-noninteractive-role.js";

const divergence = DIVERGENCES["no-interactive-element-to-noninteractive-role"];
runOxcFixtures(
  "a11y/no-interactive-element-to-noninteractive-role",
  noInteractiveElementToNoninteractiveRole,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-interactive-element-to-noninteractive-role"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
