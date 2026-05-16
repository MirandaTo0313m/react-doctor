import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("react-rules-of-hooks");

// Mirrors a subset of `oxc/crates/oxc_linter/src/rules/react/rules_of_hooks.rs`.
// Our port is a structural / lexical check rather than the full CFG analysis,
// so we test the high-confidence cases only.

describe("react-rules-of-hooks", () => {
  it("flags a hook called from a regular helper function (lowercase name)", async () => {
    const projectDir = setupReactProject(tempRoot, "regular-helper", {
      files: {
        "src/Bad.tsx": `import { useState } from "react";\nexport function helper() {\n  const [x, setX] = useState(0);\n  void [x, setX];\n}\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-rules-of-hooks");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a hook called inside an `if` branch", async () => {
    const projectDir = setupReactProject(tempRoot, "conditional-hook", {
      files: {
        "src/Bad.tsx": `import { useState } from "react";\nexport const Counter = ({ flag }: { flag: boolean }) => {\n  if (flag) { const [x, setX] = useState(0); void [x, setX]; }\n  return null;\n};\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-rules-of-hooks");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a hook called inside a `for` loop", async () => {
    const projectDir = setupReactProject(tempRoot, "loop-hook", {
      files: {
        "src/Bad.tsx": `import { useState } from "react";\nexport const Repeated = () => {\n  for (let i = 0; i < 3; i++) { const [x] = useState(0); void x; }\n  return null;\n};\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-rules-of-hooks");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("does not flag hook calls at the top of a component body", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-top-level", {
      files: {
        "src/Ok.tsx": `import { useState } from "react";\nexport const Counter = () => {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n};\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-rules-of-hooks");
    expect(hits).toHaveLength(0);
  });

  it("does not flag hook calls at the top of a custom hook", async () => {
    const projectDir = setupReactProject(tempRoot, "ok-custom-hook", {
      files: {
        "src/use-something.ts": `import { useState } from "react";\nexport const useSomething = () => {\n  const [value, setValue] = useState(0);\n  return [value, setValue] as const;\n};\n`,
      },
    });
    const hits = await collectRuleHits(projectDir, "react-rules-of-hooks");
    expect(hits).toHaveLength(0);
  });
});
