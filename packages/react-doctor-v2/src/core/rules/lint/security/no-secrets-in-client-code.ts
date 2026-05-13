import { defineRule } from "../../registry.js";
import {
  SECRET_FALSE_POSITIVE_SUFFIXES,
  SECRET_MIN_LENGTH_CHARS,
  SECRET_PATTERNS,
  SECRET_VARIABLE_PATTERN,
  TEST_OR_INFRA_FILE_PATTERN,
  isNodeOfType,
} from "./utils/index.js";
import type { RuleVisitors } from "../utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const URL_LITERAL_PATTERN = /^(?:https?:|wss?:|mailto:)/;

const getTrailingNameSegment = (name: string): string => {
  const normalizedName = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
  return normalizedName.split("_").pop()?.toLowerCase() ?? "";
};

const EMPTY_VISITORS: RuleVisitors = {};

export const noSecretsInClientCode = defineRule<Rule>({
  recommendation:
    "Move secrets to server-only environment variables and expose only public, intentionally prefixed client configuration.",
  examples: [
    {
      before: `const apiKey = process.env.SECRET_API_KEY;`,
      after: `const apiKey = process.env.NEXT_PUBLIC_ANALYTICS_KEY;`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    if (TEST_OR_INFRA_FILE_PATTERN.test(filename)) return EMPTY_VISITORS;
    return {
      VariableDeclarator(node: EsTreeNode) {
        if (!isNodeOfType(node.id, "Identifier")) return;
        if (!isNodeOfType(node.init, "Literal") || typeof node.init.value !== "string") return;

        const variableName = node.id.name;
        const literalValue = node.init.value;
        if (URL_LITERAL_PATTERN.test(literalValue)) return;

        const trailingSuffix = getTrailingNameSegment(variableName);
        const isUiConstant = SECRET_FALSE_POSITIVE_SUFFIXES.has(trailingSuffix);

        if (
          SECRET_VARIABLE_PATTERN.test(variableName) &&
          !isUiConstant &&
          literalValue.length > SECRET_MIN_LENGTH_CHARS
        ) {
          context.report({
            node,
            message: `Possible hardcoded secret in "${variableName}" - use environment variables instead`,
          });
          return;
        }

        if (SECRET_PATTERNS.some((pattern) => pattern.test(literalValue))) {
          context.report({
            node,
            message: "Hardcoded secret detected - use environment variables instead",
          });
        }
      },
    };
  },
});
