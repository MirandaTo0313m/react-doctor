// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `no-find-dom-node.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/no-find-dom-node.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { noFindDomNode } from "./no-find-dom-node.js";

const divergence = DIVERGENCES["no-find-dom-node"];
runOxcFixtures(
  "react-builtins/no-find-dom-node",
  noFindDomNode,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["no-find-dom-node"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
