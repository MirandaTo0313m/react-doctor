import { defineRule } from "../../registry.js";
import { REACT_19_DEPRECATED_MESSAGES, createDeprecatedReactImportRule } from "./utils/index.js";
import type { Rule } from "./utils/index.js";

export const noReact19DeprecatedApis = defineRule<Rule>(
  createDeprecatedReactImportRule({
    recommendation:
      "Replace APIs deprecated or removed in React 19 with their supported alternatives before upgrading.",
    examples: [
      {
        before: `import { forwardRef } from "react";`,
        after: `function Input({ ref, ...props }) { return <input ref={ref} {...props} />; }`,
      },
    ],
    source: "react",
    messages: REACT_19_DEPRECATED_MESSAGES,
  }),
);
