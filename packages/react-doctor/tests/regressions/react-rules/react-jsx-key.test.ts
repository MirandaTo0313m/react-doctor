import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-jsx-key");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/jsx_key.rs`.

describe("react-jsx-key", () => {
  it("flags `[<App />]` (element in array literal without key)", async () => {
    const projectDir = setupReactProject(tempRoot, "array-literal", {
      files: {
        "src/Bad.tsx": `export const Bad = () => <div>{[<span>1</span>]}</div>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `arr.map(x => <App />)` (iterator without key)", async () => {
    const projectDir = setupReactProject(tempRoot, "map-iterator", {
      files: {
        "src/Bad.tsx": `export const Bad = ({ items }: { items: string[] }) =>\n  <ul>{items.map((item) => <li>{item}</li>)}</ul>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `Array.from(items, x => <App />)` (Array.from iterator)", async () => {
    const projectDir = setupReactProject(tempRoot, "array-from", {
      files: {
        "src/Bad.tsx": `export const Bad = ({ items }: { items: string[] }) =>\n  <ul>{Array.from(items, (item) => <li>{item}</li>)}</ul>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits.length).toBeGreaterThan(0);
  });

  it('flags `<App {...spread} key="x" />` (key after spread)', async () => {
    const projectDir = setupReactProject(tempRoot, "key-after-spread", {
      files: {
        "src/Bad.tsx": `export const Bad = ({ obj }: { obj: object }) =>\n  <div>{[<span {...obj} key="x" />]}</div>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags duplicate literal keys among siblings", async () => {
    const projectDir = setupReactProject(tempRoot, "duplicate-keys", {
      files: {
        "src/Bad.tsx": `export const Bad = () =>\n  <div>\n    <span key="dupe">a</span>\n    <span key="dupe">b</span>\n  </div>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a properly-keyed iterator", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-keyed-map", {
      files: {
        "src/Ok.tsx": `export const Ok = ({ items }: { items: string[] }) =>\n  <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-key");
    expect(hits).toHaveLength(0);
  });
});
