import { defineRule } from "../../registry.js";
import {
  NONDETERMINISTIC_RENDER_PATTERNS,
  TEST_OR_INFRA_FILE_PATTERN,
  findOpeningElementOfChild,
  hasSuppressHydrationWarningAttribute,
  isNodeOfType,
  walkAst,
} from "./utils/index.js";
import type { RuleVisitors } from "../utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const isFunctionNode = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "ArrowFunctionExpression") || isNodeOfType(node, "FunctionExpression");

const EMPTY_VISITORS: RuleVisitors = {};

export const renderingHydrationMismatchTime = defineRule<Rule>({
  recommendation:
    "Move time, random, locale, and browser-only values to client-only state or render a stable server placeholder; do not silence real mismatches with suppressHydrationWarning.",
  examples: [
    {
      before: `<span>{new Date().toLocaleString()}</span>`,
      after: `<ClientTime />`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    if (TEST_OR_INFRA_FILE_PATTERN.test(filename)) return EMPTY_VISITORS;
    return {
      JSXExpressionContainer(node: EsTreeNode) {
        if (!node.expression) return;
        const matched = NONDETERMINISTIC_RENDER_PATTERNS.find((pattern) =>
          pattern.matches(node.expression),
        );
        if (matched) {
          const openingElement = findOpeningElementOfChild(node);
          if (hasSuppressHydrationWarningAttribute(openingElement)) return;
          context.report({
            node,
            message: `${matched.display} in JSX renders differently on server vs client - move it to client-only state or render a stable server placeholder instead of silencing the mismatch`,
          });
          return;
        }

        walkAst(node.expression, (child: EsTreeNode) => {
          if (isFunctionNode(child)) return false;
          for (const pattern of NONDETERMINISTIC_RENDER_PATTERNS) {
            if (pattern.matches(child)) {
              const openingElement = findOpeningElementOfChild(node);
              if (hasSuppressHydrationWarningAttribute(openingElement)) return;
              context.report({
                node: child,
                message: `${pattern.display} reachable from JSX renders differently on server vs client - move it to client-only state or render a stable server placeholder instead of silencing the mismatch`,
              });
              return;
            }
          }
        });
      },
    };
  },
});
