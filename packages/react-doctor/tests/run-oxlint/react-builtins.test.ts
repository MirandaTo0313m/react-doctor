import { beforeAll, describe } from "vite-plus/test";
import type { Diagnostic } from "@react-doctor/types";
import { runOxlint } from "@react-doctor/core";
import { buildTestProject } from "../regressions/_helpers.js";
import { BASIC_REACT_DIRECTORY, describeRules } from "./_helpers.js";

let basicReactDiagnostics: Diagnostic[];

describe("runOxlint", () => {
  beforeAll(async () => {
    basicReactDiagnostics = await runOxlint({
      rootDirectory: BASIC_REACT_DIRECTORY,
      project: buildTestProject({
        rootDirectory: BASIC_REACT_DIRECTORY,
        hasTanStackQuery: true,
      }),
    });
  });

  describeRules(
    "ported react builtin rules",
    {
      "no-children-prop": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "no-danger": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "jsx-no-duplicate-props": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
        severity: "error",
      },
      "jsx-no-script-url": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
        severity: "error",
      },
      "jsx-key": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
        severity: "error",
      },
      "no-string-refs": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "no-direct-mutation-state": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
        severity: "error",
      },
      "no-render-return-value": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "no-unknown-property": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "rules-of-hooks": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "no-is-mounted": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
      },
      "require-render-return": {
        fixture: "react-builtin-issues.tsx",
        ruleSource: "rules/correctness.ts",
        severity: "error",
      },
    },
    () => basicReactDiagnostics,
  );
});
