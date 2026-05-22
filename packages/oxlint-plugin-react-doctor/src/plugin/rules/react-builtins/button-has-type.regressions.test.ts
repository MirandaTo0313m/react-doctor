import { describe, expect, it } from "vite-plus/test";
import { runRule } from "../../../test-utils/run-rule.js";
import { buttonHasType } from "./button-has-type.js";

describe("react-builtins/button-has-type — regressions", () => {
  // Bugbot review: bare `<button type />` is shorthand for
  // `type={true}` — should be flagged as invalid type, not silently
  // accepted via `if (!value) return`.
  it("flags bare <button type />", () => {
    const result = runRule(buttonHasType, `<button type />`);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
