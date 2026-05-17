import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE =
  "Comment-like text in JSX must live inside `{/* … */}` — bare `//` or `/*` becomes literal text.";

const hasCommentLikePattern = (text: string): boolean => {
  for (const rawLine of text.split("\n")) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*")) return true;
  }
  return false;
};

// Port of `oxc_linter::rules::react::jsx_no_comment_textnodes`. Reports
// JSX text nodes whose lines start with `//` or `/*` — these aren't
// comments, they're rendered as literal text.
export const jsxNoCommentTextnodes = defineRule<Rule>({
  id: "jsx-no-comment-textnodes",
  severity: "warn",
  recommendation: "Wrap JSX comments in `{/* … */}` so they're parsed as comments, not children.",
  create: (context) => ({
    JSXText(node: EsTreeNodeOfType<"JSXText">) {
      if (!hasCommentLikePattern(node.value)) return;
      context.report({ node, message: MESSAGE });
    },
  }),
});
