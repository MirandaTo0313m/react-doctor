// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-did-mount-set-state.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-did-mount-set-state.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noDidMountSetState } from "./no-did-mount-set-state.js";

const divergence = DIVERGENCES["no-did-mount-set-state"];
runOxcFixtures(
  "react-builtins/no-did-mount-set-state",
  noDidMountSetState,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-did-mount-set-state"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
