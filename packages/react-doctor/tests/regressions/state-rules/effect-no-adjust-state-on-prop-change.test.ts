import { describe, expect, it } from "vite-plus/test";

import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

const tempRoot = createScopedTempRoot("effect-no-adjust-state-on-prop-change");

const RULE_ID = "no-adjust-state-on-prop-change";

interface PortedCase {
  caseId: string;
  name: string;
  code: string;
  expectedErrors: number;
}

// 1:1 port of upstream
// `eslint-plugin-react-you-might-not-need-an-effect/test/rules/no-adjust-state-on-prop-change.test.js`.
// Cases are kept in upstream order. Comments mirror upstream `name`.

const valid: PortedCase[] = [
  {
    caseId: "adjusting-state-during-render",
    name: "Adjusting state directly during render",
    code: `import { useState } from "react";
export function List({ items }) {
  const [isReverse, setIsReverse] = useState(false);
  const [selection, setSelection] = useState(null);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelection(null);
  }
  return null;
}
`,
    expectedErrors: 0,
  },
  {
    caseId: "set-state-literal-on-internal-state",
    name: "Set state to literal when internal state changes",
    code: `import { useEffect, useState } from "react";
export function Counter() {
  const [count, setCount] = useState(0);
  const [otherState, setOtherState] = useState();

  useEffect(() => {
    setOtherState("Hello World");
  }, [count]);
  return null;
}
`,
    expectedErrors: 0,
  },
  {
    caseId: "set-state-derived-from-props",
    name: "Set state to a value derived from props",
    code: `import { useEffect, useState } from "react";
export function Counter({ count }) {
  const [doubleCount, setDoubleCount] = useState(0);

  useEffect(() => {
    setDoubleCount(count * 2);
  }, [count]);
  return null;
}
`,
    expectedErrors: 0,
  },
];

const invalid: PortedCase[] = [
  {
    caseId: "literal-on-prop-change",
    name: "Set state to literal when prop changes",
    code: `import { useEffect, useState } from "react";
export function List({ items }) {
  const [selection, setSelection] = useState();

  useEffect(() => {
    setSelection(null);
  }, [items]);
  return null;
}
`,
    expectedErrors: 1,
  },
  {
    caseId: "internal-state-on-prop-change",
    name: "Set state to internal state when prop changes",
    code: `import { useEffect, useState } from "react";
export function List({ items }) {
  const [selection, setSelection] = useState();
  const [internalData, setInternalData] = useState();

  useEffect(() => {
    setSelection(internalData);
  }, [items, internalData]);
  return null;
}
`,
    expectedErrors: 1,
  },
  {
    caseId: "external-state-on-prop-change",
    name: "Set state to external state when prop changes",
    code: `import { useEffect, useState } from "react";
declare const useDataSource: () => { data: unknown };
export function List({ items }) {
  const [selection, setSelection] = useState();
  const { data: externalData } = useDataSource();

  useEffect(() => {
    setSelection(externalData);
  }, [items]);
  return null;
}
`,
    expectedErrors: 1,
  },
  {
    caseId: "conditional-literal-on-prop-change",
    name: "Conditionally set state to literal when prop changes",
    code: `import { useEffect, useState } from "react";
export function Form({ result }) {
  const [error, setError] = useState();

  useEffect(() => {
    if (result.data) {
      setError(null);
    }
  }, [result]);
  return null;
}
`,
    expectedErrors: 1,
  },
];

describe(`${RULE_ID} (port of eslint-plugin-react-you-might-not-need-an-effect)`, () => {
  for (const portedCase of valid) {
    it(`valid: ${portedCase.name}`, async () => {
      const projectDir = setupReactProject(tempRoot, portedCase.caseId, {
        files: { "src/Component.tsx": portedCase.code },
      });
      const hits = await collectRuleHits(projectDir, RULE_ID);
      expect(hits).toHaveLength(portedCase.expectedErrors);
    });
  }

  for (const portedCase of invalid) {
    it(`invalid: ${portedCase.name}`, async () => {
      const projectDir = setupReactProject(tempRoot, portedCase.caseId, {
        files: { "src/Component.tsx": portedCase.code },
      });
      const hits = await collectRuleHits(projectDir, RULE_ID);
      expect(hits).toHaveLength(portedCase.expectedErrors);
    });
  }
});
