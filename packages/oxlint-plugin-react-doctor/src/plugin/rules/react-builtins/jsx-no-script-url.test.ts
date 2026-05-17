// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-script-url.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-script-url.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoScriptUrl } from "./jsx-no-script-url.js";

const divergence = DIVERGENCES["jsx-no-script-url"];
runOxcFixtures(
  "react-builtins/jsx-no-script-url",
  jsxNoScriptUrl,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-script-url"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
