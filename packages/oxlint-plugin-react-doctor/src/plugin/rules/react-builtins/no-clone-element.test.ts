// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-clone-element.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-clone-element.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noCloneElement } from "./no-clone-element.js";

const divergence = DIVERGENCES["no-clone-element"];
runOxcFixtures(
  "react-builtins/no-clone-element",
  noCloneElement,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-clone-element"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
