import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-jsx-no-script-url");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/jsx_no_script_url.rs`.

describe("react-jsx-no-script-url", () => {
  it('flags `<a href="javascript:..." />`', async () => {
    const projectDir = setupReactProject(tempRoot, "javascript-url", {
      files: {
        "src/Bad.tsx": `export const Bad = () => <a href="javascript:void(0)">click</a>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-script-url");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags case-broken `JaVaScRiPt:` prefixes (matches oxc regex)", async () => {
    const projectDir = setupReactProject(tempRoot, "javascript-url-mixed-case", {
      files: {
        "src/Bad.tsx": `export const Bad = () => <a href="JaVaScRiPt:alert(1)">click</a>;\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-script-url");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a regular https URL", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-https", {
      files: { "src/Ok.tsx": `export const Ok = () => <a href="https://example.com">go</a>;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-script-url");
    expect(hits).toHaveLength(0);
  });

  it("does not flag a non-anchor element with a `javascript:` value", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-non-anchor", {
      files: { "src/Ok.tsx": `export const Ok = () => <Foo href="javascript:" />;\n` },
    });
    const hits = await collectRuleHits(projectDir, "react-jsx-no-script-url");
    expect(hits).toHaveLength(0);
  });
});
