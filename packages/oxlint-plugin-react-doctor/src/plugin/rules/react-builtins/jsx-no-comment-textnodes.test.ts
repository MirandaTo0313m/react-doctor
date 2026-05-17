// GENERATED — do not edit by hand. Run `pnpm gen:fixture-tests` to
// regenerate. Hand-written regression tests live in
// `jsx-no-comment-textnodes.regressions.test.ts` and survive regeneration.

import { runOxcFixtures } from "../../../test-utils/run-fixtures.js";
import { failCases, passCases } from "./__fixtures__/jsx-no-comment-textnodes.fixtures.js";
import { DIVERGENCES } from "./__fixtures__/oxc-divergences.js";
import { TRANSLATORS } from "./__fixtures__/oxc-settings-translators.js";
import { jsxNoCommentTextnodes } from "./jsx-no-comment-textnodes.js";

const divergence = DIVERGENCES["jsx-no-comment-textnodes"];
runOxcFixtures(
  "react-builtins/jsx-no-comment-textnodes",
  jsxNoCommentTextnodes,
  { passCases, failCases },
  {
    translateOxcFixture: TRANSLATORS["jsx-no-comment-textnodes"],
    knownPassDivergences: divergence?.passSkips,
    knownFailDivergences: divergence?.failSkips,
  },
);
