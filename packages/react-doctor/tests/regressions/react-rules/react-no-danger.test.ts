import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-danger");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_danger.rs`.

describe("react-no-danger", () => {
  it("flags `<div dangerouslySetInnerHTML={...} />`", async () => {
    const projectDir = setupReactProject(tempRoot, "danger-jsx", {
      files: {
        "src/Danger.tsx": `export const Danger = ({ html }: { html: string }) =>\n  <div dangerouslySetInnerHTML={{ __html: html }} />;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-danger");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags React.createElement with a `dangerouslySetInnerHTML` prop", async () => {
    const projectDir = setupReactProject(tempRoot, "danger-createElement", {
      files: {
        "src/Danger.tsx": `import * as React from "react";\nexport const Danger = ({ html }: { html: string }) =>\n  React.createElement("div", { dangerouslySetInnerHTML: { __html: html } });\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-danger");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a regular div with className", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-className", {
      files: { "src/Ok.tsx": `export const Ok = () => <div className="bar" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-no-danger");
    expect(hits).toHaveLength(0);
  });
});
