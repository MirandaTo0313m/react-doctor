import type { EsTreeNode } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import type { RuleExample } from "../../utils/index.js";

export interface DeprecatedReactImportRuleOptions {
  /** The exact `import "..."` source string this rule watches. */
  source: string;
  recommendation: string;
  examples?: RuleExample[];
  /** Per-imported-name message dictionary. Exact-match lookup. */
  messages: ReadonlyMap<string, string>;
  /**
   * Optional extra ImportDeclaration handler invoked BEFORE the standard
   * source check - used by the react-dom rule to flag every import from
   * `react-dom/test-utils` (whole entry point gone in React 19).
   * Return `true` to mark "handled, skip the standard branch".
   */
  handleExtraSource?: (node: EsTreeNode, context: RuleContext) => boolean;
}
