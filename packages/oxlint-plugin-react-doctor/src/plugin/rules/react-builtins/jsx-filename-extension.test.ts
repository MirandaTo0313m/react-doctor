// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-filename-extension.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-filename-extension.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxFilenameExtension } from "./jsx-filename-extension.js";

const divergence = DIVERGENCES["jsx-filename-extension"];
runOxcFixtures(
  "react-builtins/jsx-filename-extension",
  jsxFilenameExtension,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-filename-extension"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
