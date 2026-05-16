import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-is-mounted");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_is_mounted.rs`.

describe("react-no-is-mounted", () => {
  it("flags `this.isMounted()` inside a class method", async () => {
    const projectDir = setupReactProject(tempRoot, "class-method", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  someMethod() {\n    if (!this.isMounted()) return;\n  }\n  render() { return <div>Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-is-mounted");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `this.isMounted()` inside a createReactClass object property", async () => {
    const projectDir = setupReactProject(tempRoot, "createReactClass", {
      files: {
        "src/Bad.tsx": `declare const createReactClass: any;\nexport const Hello = createReactClass({\n  componentDidUpdate: function() { if (!this.isMounted()) return; },\n  render: function() { return <div>Hello</div>; }\n});\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-is-mounted");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a method named `notIsMounted`", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-similar-name", {
      files: {
        "src/Ok.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  notIsMounted() {}\n  render() { this.notIsMounted(); return <div>Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-is-mounted");
    expect(hits).toHaveLength(0);
  });
});
