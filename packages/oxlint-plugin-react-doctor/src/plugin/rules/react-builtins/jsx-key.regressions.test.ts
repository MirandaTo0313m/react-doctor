import { describe, expect, it } from "vite-plus/test";
import { runRule } from "../../../test-utils/run-rule.js";
import { jsxKey } from "./jsx-key.js";

const expectFail = (code: string): void => {
  const result = runRule(jsxKey, code);
  expect(result.parseErrors).toEqual([]);
  expect(result.diagnostics.length).toBeGreaterThan(0);
};

describe("react-builtins/jsx-key — regressions", () => {
  // Bugbot review: key sandwiched between two spreads should still flag
  // (key appears after the FIRST spread, even if before LATER spreads).
  it("flags key between two spreads", () => expectFail(`[<App {...a} key="x" {...b} />];`));
});
