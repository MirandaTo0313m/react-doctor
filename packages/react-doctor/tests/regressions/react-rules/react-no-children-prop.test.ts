import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-children-prop");

// Pass / fail vectors mirror the oxc rust test in
// `oxc/crates/oxc_linter/src/rules/react/no_children_prop.rs`.

describe("react-no-children-prop", () => {
  it('flags `<div children="..." />` as a children-prop violation', async () => {
    const projectDir = setupReactProject(tempRoot, "div-children-attr", {
      files: {
        "src/Children.tsx": `export const Children = () => <div children="hi" />;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-children-prop");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags React.createElement with `{children: ...}` props", async () => {
    const projectDir = setupReactProject(tempRoot, "create-element-children", {
      files: {
        "src/Children.tsx": `import * as React from "react";\nexport const Children = () => React.createElement("div", { children: "hi" });\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-children-prop");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag JSX children placed between tags", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-jsx", {
      files: {
        "src/Ok.tsx": `export const Ok = () => <div>real children</div>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-children-prop");
    expect(hits).toHaveLength(0);
  });

  it("does not flag React.createElement with positional children arguments", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-positional", {
      files: {
        "src/Ok.tsx": `import * as React from "react";\nexport const Ok = () => React.createElement("div", { className: "x" }, "child");\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-children-prop");
    expect(hits).toHaveLength(0);
  });
});
