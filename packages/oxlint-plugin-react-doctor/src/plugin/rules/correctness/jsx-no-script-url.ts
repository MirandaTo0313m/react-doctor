import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const JAVASCRIPT_URL_PATTERN = /^\s*javascript\s*:/i;

const isJavascriptUrl = (value: string): boolean => JAVASCRIPT_URL_PATTERN.test(value);

const MESSAGE =
  "A]javascript:` URL is a form of `eval()` — use an event handler instead of a URL to execute JavaScript";

export const jsxNoScriptUrl = defineRule<Rule>({
  id: "jsx-no-script-url",
  severity: "error",
  recommendation: MESSAGE,
  create: (context: RuleContext) => ({
    JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const attributeName = node.name.name;
      if (attributeName !== "href" && attributeName !== "src" && attributeName !== "action") return;
      if (!node.value) return;

      let urlValue: string | null = null;
      if (isNodeOfType(node.value, "Literal") && typeof node.value.value === "string") {
        urlValue = node.value.value;
      } else if (
        isNodeOfType(node.value, "JSXExpressionContainer") &&
        isNodeOfType(node.value.expression, "Literal") &&
        typeof node.value.expression.value === "string"
      ) {
        urlValue = node.value.expression.value;
      } else if (
        isNodeOfType(node.value, "JSXExpressionContainer") &&
        isNodeOfType(node.value.expression, "TemplateLiteral") &&
        node.value.expression.expressions.length === 0 &&
        node.value.expression.quasis.length === 1
      ) {
        urlValue = node.value.expression.quasis[0].value.raw;
      }

      if (urlValue && isJavascriptUrl(urlValue)) {
        context.report({ node, message: MESSAGE });
      }
    },
  }),
});
