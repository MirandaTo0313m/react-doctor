import { findEnclosingMultilineJsxOpenerStart } from "./find-enclosing-jsx-opener.js";
import { findStackedDisableCommentsAbove } from "./find-stacked-disable-comments.js";
import { isRuleListedInComment } from "./is-rule-listed-in-comment.js";

const DISABLE_LINE_PATTERN =
  /(?:\/\/|\/\*)\s*react-doctor-disable-line\b(?:\s+([\w/\-.,\s]+?))?\s*(?:\*\/)?\s*\}?\s*$/;

const isRuleSuppressedByChainAbove = (
  lines: string[],
  anchorIndex: number,
  ruleId: string,
): boolean =>
  findStackedDisableCommentsAbove(lines, anchorIndex).some(
    (comment) => comment.isInChain && isRuleListedInComment(comment.ruleList, ruleId),
  );

export const isRuleSuppressedAt = (
  lines: string[],
  diagnosticLineIndex: number,
  ruleId: string,
): boolean => {
  const sameLineMatch = lines[diagnosticLineIndex]?.match(DISABLE_LINE_PATTERN);
  if (sameLineMatch && isRuleListedInComment(sameLineMatch[1], ruleId)) return true;

  if (isRuleSuppressedByChainAbove(lines, diagnosticLineIndex, ruleId)) return true;

  const openerStartIndex = findEnclosingMultilineJsxOpenerStart(lines, diagnosticLineIndex);
  if (openerStartIndex !== null && openerStartIndex > 0) {
    return isRuleSuppressedByChainAbove(lines, openerStartIndex, ruleId);
  }

  return false;
};
