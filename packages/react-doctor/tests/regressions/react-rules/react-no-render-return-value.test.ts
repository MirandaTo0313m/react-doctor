import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-render-return-value");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_render_return_value.rs`.

describe("react-no-render-return-value", () => {
  it("flags `var inst = ReactDOM.render(...)`", async () => {
    const projectDir = setupReactProject(tempRoot, "var-init", {
      files: {
        "src/Bad.tsx": `import ReactDOM from "react-dom";\nconst inst = ReactDOM.render(<div />, document.body);\nexport { inst };\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-render-return-value");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `return ReactDOM.render(...)` inside a function", async () => {
    const projectDir = setupReactProject(tempRoot, "return-statement", {
      files: {
        "src/Bad.tsx": `import ReactDOM from "react-dom";\nexport function render() { return ReactDOM.render(<div />, document.body); }\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-render-return-value");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags arrow expression `(a, b) => ReactDOM.render(a, b)`", async () => {
    const projectDir = setupReactProject(tempRoot, "arrow-expr", {
      files: {
        "src/Bad.tsx": `import ReactDOM from "react-dom";\nexport const render = (a: any, b: any) => ReactDOM.render(a, b);\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-render-return-value");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag bare `ReactDOM.render(...)`", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-bare", {
      files: {
        "src/Ok.tsx": `import ReactDOM from "react-dom";\nReactDOM.render(<div />, document.body);\nexport {};\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-render-return-value");
    expect(hits).toHaveLength(0);
  });
});
