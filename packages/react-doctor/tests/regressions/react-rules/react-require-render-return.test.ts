import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-require-render-return");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/require_render_return.rs`.

describe("react-require-render-return", () => {
  it("flags an empty class-component `render()` body", async () => {
    const projectDir = setupReactProject(tempRoot, "empty-render", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render() {}\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-require-render-return");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags an empty `render() { ... }` that omits the return statement", async () => {
    const projectDir = setupReactProject(tempRoot, "missing-return", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component<{ names: string[] }> {\n  render() { const x = this.props.names.map((name) => <div key={name}>{name}</div>); void x; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-require-render-return");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a render arrow with a block body that omits return", async () => {
    const projectDir = setupReactProject(tempRoot, "render-arrow-no-return", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render = () => { <div>Hello</div>; };\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-require-render-return");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag a `render()` with a return statement", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-with-return", {
      files: {
        "src/Ok.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render() { return <div>Hello</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-require-render-return");
    expect(hits).toHaveLength(0);
  });

  it("does not flag arrow expression `render = () => (...)`", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-arrow-expression", {
      files: {
        "src/Ok.tsx": `import React from "react";\nexport class Hello extends React.Component {\n  render = () => (<div>Hello</div>);\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-require-render-return");
    expect(hits).toHaveLength(0);
  });
});
