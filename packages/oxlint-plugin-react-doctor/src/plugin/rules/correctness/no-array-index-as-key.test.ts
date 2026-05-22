import { describe, expect, it } from "vite-plus/test";
import { runRule } from "../../../test-utils/run-rule.js";
import { noArrayIndexAsKey } from "./no-array-index-as-key.js";

describe("no-array-index-as-key (test-harness smoke test)", () => {
  it("flags index used as JSX key", () => {
    const code = `const App = ({ items }) => items.map((item, index) => <li key={index}>{item}</li>);
`;
    const result = runRule(noArrayIndexAsKey, code);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain("index");
  });

  it("does not flag stable id used as JSX key", () => {
    const code = `const App = ({ items }) => items.map((item) => <li key={item.id}>{item.name}</li>);
`;
    const result = runRule(noArrayIndexAsKey, code);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("does not flag index inside Array.from(...).map(...)", () => {
    const code = `const App = () => Array.from({ length: 5 }).map((_, index) => <li key={index} />);
`;
    const result = runRule(noArrayIndexAsKey, code);
    expect(result.parseErrors).toEqual([]);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("flags String(index) coercion used as JSX key", () => {
    const code = `const App = ({ items }) => items.map((item, index) => <li key={String(index)}>{item}</li>);
`;
    const result = runRule(noArrayIndexAsKey, code);
    expect(result.diagnostics).toHaveLength(1);
  });
});
