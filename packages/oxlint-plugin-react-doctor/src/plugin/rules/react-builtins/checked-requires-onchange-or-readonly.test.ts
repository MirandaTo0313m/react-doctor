// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `checked-requires-onchange-or-readonly.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import {
  failCases,
  passCases,
} from "./__fixtures__/checked-requires-onchange-or-readonly.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { checkedRequiresOnchangeOrReadonly } from "./checked-requires-onchange-or-readonly.js";

const divergence = DIVERGENCES["checked-requires-onchange-or-readonly"];
runOxcFixtures(
  "react-builtins/checked-requires-onchange-or-readonly",
  checkedRequiresOnchangeOrReadonly,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["checked-requires-onchange-or-readonly"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
