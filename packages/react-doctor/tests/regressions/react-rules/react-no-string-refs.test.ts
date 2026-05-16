import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-string-refs");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_string_refs.rs`.

describe("react-no-string-refs", () => {
  it('flags `<div ref="hello" />`', async () => {
    const projectDir = setupReactProject(tempRoot, "string-ref-attr", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render() { return <div ref="hello">Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-string-refs");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `<div ref={'hello'} />` (string in expression container)", async () => {
    const projectDir = setupReactProject(tempRoot, "string-ref-expr", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render() { return <div ref={'hello'}>Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-string-refs");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `this.refs.x` reads inside a class component", async () => {
    const projectDir = setupReactProject(tempRoot, "this-refs-read", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  componentDidMount() { const x = this.refs.hello; void x; }\n  render() { return <div>Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-string-refs");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a callback-ref pattern", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-callback-ref", {
      files: {
        "src/Ok.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  hello: HTMLDivElement | null = null;\n  render() { return <div ref={(el: HTMLDivElement | null) => { this.hello = el; }}>Hi</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-string-refs");
    expect(hits).toHaveLength(0);
  });
});
