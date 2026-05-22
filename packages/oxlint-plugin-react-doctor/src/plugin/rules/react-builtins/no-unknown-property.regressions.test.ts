import { describe, expect, it } from "vite-plus/test";
import { runRule } from "../../../test-utils/run-rule.js";
import { noUnknownProperty } from "./no-unknown-property.js";

describe("react-builtins/no-unknown-property — regressions", () => {
  // Bugbot review: `onGotPointerCapture` (bubbling handler) was missing
  // from DOM_PROPERTY_NAMES even though `onGotPointerCaptureCapture`
  // was present, producing false positives on the bubbling form.
  it("does not flag onGotPointerCapture", () => {
    const result = runRule(noUnknownProperty, `<div onGotPointerCapture={x} />`);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics).toHaveLength(0);
  });
});
