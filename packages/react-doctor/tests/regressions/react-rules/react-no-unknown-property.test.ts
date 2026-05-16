import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-unknown-property");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_unknown_property.rs`.

describe("react-no-unknown-property", () => {
  it('flags `<div class="bar" />` (use `className`)', async () => {
    const projectDir = setupReactProject(tempRoot, "class-attr", {
      files: { "src/Bad.tsx": `export const Bad = () => <div class="bar" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits.length).toBeGreaterThan(0);
  });

  it('flags `<div for="bar" />` (use `htmlFor`)', async () => {
    const projectDir = setupReactProject(tempRoot, "for-attr", {
      files: { "src/Bad.tsx": `export const Bad = () => <div for="bar" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `<div crossOrigin />` (only allowed on `<script>`/`<img>`/etc.)", async () => {
    const projectDir = setupReactProject(tempRoot, "crossorigin-on-div", {
      files: { "src/Bad.tsx": `export const Bad = () => <div crossOrigin="anonymous" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `data-XML-anything=...` (data-xml prefix is reserved)", async () => {
    const projectDir = setupReactProject(tempRoot, "data-xml", {
      files: { "src/Bad.tsx": `export const Bad = () => <div data-xml-anything="x" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag `<div className=...>`", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-classname", {
      files: { "src/Ok.tsx": `export const Ok = () => <div className="bar" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits).toHaveLength(0);
  });

  it("does not flag a custom-element opt-in via `is`", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-is", {
      files: { "src/Ok.tsx": `export const Ok = () => <div class="x" is="my-elem" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits).toHaveLength(0);
  });

  it("does not flag `data-foo=...` lowercase data attributes", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-data-foo", {
      files: { "src/Ok.tsx": `export const Ok = () => <div data-foo="bar" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits).toHaveLength(0);
  });

  it("does not flag `<App class=...>` on a custom (capitalized) component", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-custom-component", {
      files: {
        "src/Ok.tsx": `const App = (props: any) => <div {...props} />;\nexport const Ok = () => <App class="bar" />;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-unknown-property");
    expect(hits).toHaveLength(0);
  });
});
