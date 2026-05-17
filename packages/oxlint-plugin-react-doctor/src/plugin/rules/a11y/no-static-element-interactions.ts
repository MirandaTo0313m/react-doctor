import { HTML_TAGS } from "../../constants/html-tags.js";
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { getElementType } from "../../utils/get-element-type.js";
import { hasJsxPropIgnoreCase } from "../../utils/has-jsx-prop-ignore-case.js";
import { isAbstractRole } from "../../utils/is-abstract-role.js";
import { isHiddenFromScreenReader } from "../../utils/is-hidden-from-screen-reader.js";
import { isInteractiveElement } from "../../utils/is-interactive-element.js";
import { isInteractiveRole } from "../../utils/is-interactive-role.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isNonInteractiveElement } from "../../utils/is-non-interactive-element.js";
import { isNonInteractiveRole } from "../../utils/is-non-interactive-role.js";
import { isPresentationRole } from "../../utils/is-presentation-role.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE =
  'Static HTML elements with event handlers require a role — add `role="…"` or use a semantic HTML element instead.';

const DEFAULT_HANDLERS: ReadonlyArray<string> = [
  "onClick",
  "onMouseDown",
  "onMouseUp",
  "onKeyPress",
  "onKeyDown",
  "onKeyUp",
];

interface NoStaticElementInteractionsSettings {
  handlers?: ReadonlyArray<string>;
  allowExpressionValues?: boolean;
}

const resolveSettings = (
  settings: Readonly<Record<string, unknown>> | undefined,
): Required<NoStaticElementInteractionsSettings> => {
  const reactDoctor = settings?.["react-doctor"];
  const ruleSettings =
    typeof reactDoctor === "object" && reactDoctor !== null
      ? ((reactDoctor as { noStaticElementInteractions?: NoStaticElementInteractionsSettings })
          .noStaticElementInteractions ?? {})
      : {};
  return {
    handlers: ruleSettings.handlers ?? DEFAULT_HANDLERS,
    allowExpressionValues: ruleSettings.allowExpressionValues ?? false,
  };
};

// True when the attribute value is `={null}`.
const isNullValue = (attribute: EsTreeNodeOfType<"JSXAttribute">): boolean => {
  if (!attribute.value) return false;
  if (!isNodeOfType(attribute.value, "JSXExpressionContainer")) return false;
  const expression = attribute.value.expression;
  return (
    isNodeOfType(expression as EsTreeNode, "Literal") &&
    (expression as { value: unknown }).value === null
  );
};

// Port of `oxc_linter::rules::jsx_a11y::no_static_element_interactions`.
export const noStaticElementInteractions = defineRule<Rule>({
  id: "no-static-element-interactions",
  severity: "warn",
  recommendation:
    "Static HTML elements with event handlers require a role, or use a semantic HTML element instead.",
  category: "Accessibility",
  create: (context) => {
    const settings = resolveSettings(context.settings);
    return {
      JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
        // Find any active handler.
        const hasHandler = settings.handlers.some((handler) => {
          const attribute = hasJsxPropIgnoreCase(node.attributes, handler);
          if (!attribute) return false;
          return !isNullValue(attribute);
        });
        if (!hasHandler) return;

        const elementType = getElementType(node, context.settings);
        // Custom JSX elements pass through.
        if (!HTML_TAGS.has(elementType)) return;
        if (isHiddenFromScreenReader(node, context.settings)) return;
        if (isPresentationRole(node)) return;
        if (isInteractiveElement(elementType, node)) return;
        if (isNonInteractiveElement(elementType, node)) return;
        if (isAbstractRole(node, context.settings)) return;

        const roleAttribute = hasJsxPropIgnoreCase(node.attributes, "role");
        if (!roleAttribute || !roleAttribute.value) {
          context.report({ node: node.name, message: MESSAGE });
          return;
        }

        const attributeValue = roleAttribute.value as EsTreeNode;
        if (isNodeOfType(attributeValue, "Literal") && typeof attributeValue.value === "string") {
          const firstRole = attributeValue.value.toLowerCase().trim().split(/\s+/)[0];
          if (firstRole && (isInteractiveRole(firstRole) || isNonInteractiveRole(firstRole))) {
            return;
          }
          context.report({ node: node.name, message: MESSAGE });
          return;
        }
        if (
          isNodeOfType(attributeValue, "JSXExpressionContainer") &&
          settings.allowExpressionValues
        ) {
          return;
        }
        context.report({ node: node.name, message: MESSAGE });
      },
    };
  },
});
