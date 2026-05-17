// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `forbid-dom-props.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/forbid-dom-props.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { forbidDomProps } from "./forbid-dom-props.js";

const divergence = DIVERGENCES["forbid-dom-props"];
runOxcFixtures(
  "react-builtins/forbid-dom-props",
  forbidDomProps,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["forbid-dom-props"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
