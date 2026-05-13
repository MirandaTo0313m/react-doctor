import { defineRule } from "../../registry.js";
import {
  ANALYTICS_DEFERRABLE_METHODS,
  ANALYTICS_DEFERRABLE_OBJECTS,
} from "../server/utils/index.js";
import { TEST_OR_INFRA_FILE_PATTERN, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const SERVER_OR_CLI_FILE_PATTERN = /\/(?:server|cli|bin|scripts|workers?|cron|jobs?|commands?|api)\//;

const isDeferrableCall = (node: EsTreeNode): boolean => {
  if (!isNodeOfType(node, "CallExpression")) return false;
  const callee = node.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return false;
  if (!isNodeOfType(callee.object, "Identifier")) return false;
  if (!isNodeOfType(callee.property, "Identifier")) return false;
  return (
    ANALYTICS_DEFERRABLE_OBJECTS.has(callee.object.name) &&
    ANALYTICS_DEFERRABLE_METHODS.has(callee.property.name)
  );
};

export const jsRequestIdleCallback = defineRule<Rule>({
  recommendation:
    "Schedule non-critical analytics, logging, and background work with requestIdleCallback or a timeout-backed idle scheduler.",
  examples: [
    {
      before: `analytics.track("view");`,
      after: `requestIdleCallback(() => analytics.track("view"));`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const isNonBrowserFile =
      TEST_OR_INFRA_FILE_PATTERN.test(filename) ||
      SERVER_OR_CLI_FILE_PATTERN.test(filename);

    return {
      CallExpression(node: EsTreeNode) {
        if (isNonBrowserFile) return;
        if (!isDeferrableCall(node)) return;
        context.report({
          node,
          message:
            "non-critical analytics/logging runs immediately - schedule it with requestIdleCallback (with a timeout if required) so input and animation work stay responsive",
        });
      },
    };
  },
});
