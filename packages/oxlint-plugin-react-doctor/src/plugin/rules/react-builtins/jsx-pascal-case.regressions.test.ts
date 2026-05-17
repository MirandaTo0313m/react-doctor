import { describe, expect, it } from "vite-plus/test";
import { runRule } from "../../../test-utils/run-rule.js";
import { jsxPascalCase } from "./jsx-pascal-case.js";

describe("react-builtins/jsx-pascal-case — regressions", () => {
  // Bugbot review: a single-char first segment shouldn't short-circuit
  // the entire visitor and skip later segments — `<X.bad_name />` must
  // still flag `bad_name`.
  it("flags <X.bad_name /> (skipping over short first segment)", () => {
    const result = runRule(jsxPascalCase, `<X.bad_name />`);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
