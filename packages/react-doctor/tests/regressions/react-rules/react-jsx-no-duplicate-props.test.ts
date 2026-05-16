import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-jsx-no-duplicate-props");

// Mirrors the oxc rust pass / fail vectors in
// `oxc/crates/oxc_linter/src/rules/react/jsx_no_duplicate_props.rs`.

describe("react-jsx-no-duplicate-props", () => {
  it("flags `<App a a />` (boolean shorthand duplicates)", async () => {
    const projectDir = setupReactProject(tempRoot, "boolean-dupe", {
      files: { "src/Dupe.tsx": `export const Dupe = () => <div data-x data-x />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-duplicate-props");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags duplicates even when interspersed with `{...spread}`", async () => {
    const projectDir = setupReactProject(tempRoot, "spread-dupe", {
      files: {
        "src/Spread.tsx": `export const Spread = (props: object) => <div data-a="a" {...props} data-a="a" />;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-duplicate-props");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag props that differ only in case (matches oxc behavior)", async () => {
    const projectDir = setupReactProject(tempRoot, "case-distinct", {
      files: {
        "src/CaseDistinct.tsx": `export const CaseDistinct = () => <div data-a data-A />;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-duplicate-props");
    expect(hits).toHaveLength(0);
  });

  it("does not flag legitimate distinct props", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-distinct", {
      files: { "src/Ok.tsx": `export const Ok = () => <div data-a data-b data-c />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-duplicate-props");
    expect(hits).toHaveLength(0);
  });
});
