import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-no-direct-mutation-state");

// Mirrors `oxc/crates/oxc_linter/src/rules/react/no_direct_mutation_state.rs`.

describe("react-no-direct-mutation-state", () => {
  it("flags `this.state.foo = ...` inside a class method", async () => {
    const projectDir = setupReactProject(tempRoot, "method-mutation", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component<{}, { foo: string }> {\n  componentDidMount() { this.state.foo = "bar"; }\n  render() { return <div>{this.state.foo}</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-direct-mutation-state");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags `this.state.foo++` (UpdateExpression)", async () => {
    const projectDir = setupReactProject(tempRoot, "update-expression", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component<{}, { foo: number }> {\n  componentDidMount() { this.state.foo++; }\n  render() { return <div>{this.state.foo}</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-direct-mutation-state");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags nested `this.state.person.name.first = ...`", async () => {
    const projectDir = setupReactProject(tempRoot, "nested-mutation", {
      files: {
        "src/Bad.tsx": `import React from "react";\nexport class Hello extends React.Component<{}, any> {\n  componentDidMount() { this.state.person.name.first = "bar"; }\n  render() { return <div>x</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-direct-mutation-state");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag `this.state = {...}` inside the constructor", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-constructor-init", {
      files: {
        "src/Ok.tsx": `import React from "react";\nexport class Hello extends React.Component<{}, { foo: string }> {\n  constructor(props: {}) { super(props); this.state = { foo: "bar" }; }\n  render() { return <div>{this.state.foo}</div>; }\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-direct-mutation-state");
    expect(hits).toHaveLength(0);
  });

  it("does not flag mutations on a non-React class", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-non-component", {
      files: {
        "src/Helper.ts": `export class Helper { state: any = {}; getFoo() { this.state.foo = "bar"; return this.state.foo; } }\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-no-direct-mutation-state");
    expect(hits).toHaveLength(0);
  });
});
