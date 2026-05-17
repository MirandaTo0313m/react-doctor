// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `void-dom-elements-no-children.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/void-dom-elements-no-children.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { voidDomElementsNoChildren } from "./void-dom-elements-no-children.js";

const divergence = DIVERGENCES["void-dom-elements-no-children"];
runOxcFixtures(
  "react-builtins/void-dom-elements-no-children",
  voidDomElementsNoChildren,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["void-dom-elements-no-children"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
