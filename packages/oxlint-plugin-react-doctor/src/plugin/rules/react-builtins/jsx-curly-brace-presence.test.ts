// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-curly-brace-presence.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-curly-brace-presence.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxCurlyBracePresence } from "./jsx-curly-brace-presence.js";

const divergence = DIVERGENCES["jsx-curly-brace-presence"];
runOxcFixtures(
  "react-builtins/jsx-curly-brace-presence",
  jsxCurlyBracePresence,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-curly-brace-presence"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
