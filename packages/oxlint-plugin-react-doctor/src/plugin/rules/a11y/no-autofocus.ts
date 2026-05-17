import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getElementType } from "../../utils/get-element-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import { HTML_TAGS } from "../../constants/html-tags.js";

const MESSAGE =
  "`autoFocus` should not be used — it disrupts users who expect the page focus to remain at the top of the document on load.";

interface NoAutofocusSettings {
  ignoreNonDOM?: boolean;
}

const resolveSettings = (
  settings: Readonly<Record<string, unknown>> | undefined,
): Required<NoAutofocusSettings> => {
  const reactDoctor = settings?.["react-doctor"];
  const ruleSettings =
    typeof reactDoctor === "object" && reactDoctor !== null
      ? ((reactDoctor as { noAutofocus?: NoAutofocusSettings }).noAutofocus ?? {})
      : {};
  return { ignoreNonDOM: ruleSettings.ignoreNonDOM ?? false };
};

// Strip parens around an expression — OXC's ESTree parser doesn't
// emit ParenthesizedExpression by default, but be defensive.
const innerExpression = (expression: EsTreeNode): EsTreeNode => {
  if (
    (expression as { type: string }).type === "ParenthesizedExpression" &&
    "expression" in expression
  ) {
    return innerExpression((expression as { expression: EsTreeNode }).expression);
  }
  return expression;
};

// Returns true when an attribute value is statically equivalent to
// `false` (per OXC's `is_false_attribute_value`).
const isFalseAttributeValue = (value: EsTreeNode): boolean => {
  if (isNodeOfType(value, "Literal")) {
    return typeof value.value === "string" ? value.value === "false" : value.value === false;
  }
  if (isNodeOfType(value, "JSXExpressionContainer")) {
    const expression = innerExpression(value.expression);
    if (isNodeOfType(expression, "Literal")) {
      if (typeof expression.value === "boolean") return !expression.value;
      if (typeof expression.value === "string") return expression.value === "false";
      return false;
    }
    if (isNodeOfType(expression, "TemplateLiteral")) {
      return (
        expression.expressions.length === 0 &&
        expression.quasis.length === 1 &&
        expression.quasis[0]!.value.cooked === "false"
      );
    }
  }
  return false;
};

// Port of `oxc_linter::rules::jsx_a11y::no_autofocus`. Reports any
// case-sensitive `autoFocus=` attribute on JSX elements whose value
// isn't statically `false`. With `ignoreNonDOM: true`, only HTML
// elements (lowercase tag in HTML_TAGS) are checked.
export const noAutofocus = defineRule<Rule>({
  id: "no-autofocus",
  severity: "warn",
  recommendation: "Don't use `autoFocus` — it disorients users.",
  category: "Accessibility",
  create: (context) => {
    const settings = resolveSettings(context.settings);
    return {
      JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
        const autoFocusAttribute = node.attributes.find((attribute) => {
          if (!isNodeOfType(attribute as EsTreeNode, "JSXAttribute")) return false;
          const attributeName = (attribute as EsTreeNodeOfType<"JSXAttribute">).name;
          return (
            isNodeOfType(attributeName as EsTreeNode, "JSXIdentifier") &&
            (attributeName as EsTreeNodeOfType<"JSXIdentifier">).name === "autoFocus"
          );
        });
        if (!autoFocusAttribute) return;
        const attributeValue = (autoFocusAttribute as EsTreeNodeOfType<"JSXAttribute">)
          .value as EsTreeNode | null;
        if (attributeValue && isFalseAttributeValue(attributeValue)) return;
        if (settings.ignoreNonDOM) {
          const tag = getElementType(node, context.settings);
          if (!HTML_TAGS.has(tag)) return;
        }
        context.report({ node: autoFocusAttribute as EsTreeNode, message: MESSAGE });
      },
    };
  },
});
