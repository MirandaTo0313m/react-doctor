import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";

// Mirrors oxc's `JS_SCRIPT_REGEX`: matches `javascript:` (case
// insensitive) with optional whitespace / line breaks between letters.
// React 19 disallows these URLs entirely as a security precaution
// (https://react.dev/blog/2024/04/25/react-19-upgrade-guide#other-breaking-changes).
const JAVASCRIPT_URL_PATTERN =
  /j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;

const isAnchorLikeTag = (tagName: string): boolean => tagName === "a";

// Ported from oxc's `react/jsx-no-script-url`. Reports `<a href="javascript:..." />`
// (and any equivalent `<a>` link prop value) as a React 19 hazard.
// The optional `components` config supported by ESLint /
// `eslint-plugin-react` is omitted — extending `<a>` to user-defined
// link components requires shared settings that this plugin does not
// thread through, and the bare-`<a>` case covers the vast majority of
// real attack surface.
export const reactJsxNoScriptUrl = defineRule<Rule>({
  id: "react-jsx-no-script-url",
  severity: "error",
  recommendation:
    'Replace `href="javascript:..."` with an `onClick` handler on a `<button>`, or remove the URL entirely. React 19 throws on render for any `javascript:` URL',
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const tagName = node.name.name;
      if (!isAnchorLikeTag(tagName)) return;

      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        if (!attribute.value) continue;

        const literalString = extractStringLiteralValue(attribute.value);
        if (literalString === null) continue;
        if (!JAVASCRIPT_URL_PATTERN.test(literalString)) continue;

        context.report({
          node: attribute,
          message: "React 19 disallows `javascript:` URLs as a security precaution.",
        });
      }
    },
  }),
});

const extractStringLiteralValue = (
  attributeValue: NonNullable<EsTreeNodeOfType<"JSXAttribute">["value"]>,
): string | null => {
  if (isNodeOfType(attributeValue, "Literal") && typeof attributeValue.value === "string") {
    return attributeValue.value;
  }
  if (isNodeOfType(attributeValue, "JSXExpressionContainer")) {
    const expression = attributeValue.expression;
    if (isNodeOfType(expression, "Literal") && typeof expression.value === "string") {
      return expression.value;
    }
  }
  return null;
};
