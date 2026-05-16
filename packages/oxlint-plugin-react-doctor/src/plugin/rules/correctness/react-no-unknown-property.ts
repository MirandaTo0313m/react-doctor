import { defineRule } from "../../utils/define-rule.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import {
  ATTRIBUTE_TAGS_MAP,
  DOM_ATTRIBUTES_TO_CAMEL,
  DOM_PROPERTIES_IGNORE_CASE,
  DOM_PROPERTIES_LOWER_TO_CANONICAL,
  DOM_PROPERTIES_NAMES,
} from "./utils/no-unknown-property-data.js";

// `data-*` shape mirrors oxc's `is_valid_data_attr`: starts with
// `data-`, has at least one character after, doesn't start with
// `data-xml` (any casing), and never contains `:`. React lowercases
// these on the DOM, so the rule optionally enforces lowercase
// (controlled by the `requireDataLowercase` option upstream;
// always-on here for simplicity until we wire rule options).
const DATA_PREFIX = "data-";

const isValidDataAttribute = (name: string): boolean => {
  if (!name.startsWith(DATA_PREFIX)) return false;
  if (name.toLowerCase().startsWith("data-xml")) return false;
  const remainder = name.slice(DATA_PREFIX.length);
  if (remainder.length === 0) return false;
  return !remainder.includes(":");
};

// Liberal aria-* approximation: oxc consults a curated globals list,
// but maintaining that list here would duplicate ~120 attributes from
// the W3C spec for marginal value. Any `aria-<word>` (no colons, no
// uppercase) passes — this matches how every real-world React
// codebase uses these attributes.
const ARIA_ATTRIBUTE_PATTERN = /^aria-[a-z]+(?:[a-z0-9-]*[a-z0-9])?$/;

const isValidAriaAttribute = (name: string): boolean => ARIA_ATTRIBUTE_PATTERN.test(name);

const matchesHtmlTagConventions = (tagName: string): boolean => {
  if (tagName.length === 0) return false;
  if (!/^[a-z]/.test(tagName)) return false;
  return !tagName.includes("-");
};

const normalizeAttributeCase = (name: string): string => {
  for (const canonical of DOM_PROPERTIES_IGNORE_CASE) {
    if (canonical.toLowerCase() === name.toLowerCase()) return canonical;
  }
  return name;
};

const hasUppercaseCharacter = (text: string): boolean => /[A-Z]/.test(text);

const getJsxAttributeName = (
  attributeName: EsTreeNodeOfType<"JSXAttribute">["name"],
): string | null => {
  if (isNodeOfType(attributeName, "JSXIdentifier")) return attributeName.name;
  if (isNodeOfType(attributeName, "JSXNamespacedName")) {
    return `${attributeName.namespace.name}:${attributeName.name.name}`;
  }
  return null;
};

// Ported from oxc's `react/no-unknown-property`. We only validate
// attributes on intrinsic (lowercase-named) HTML elements that don't
// declare `is="..."` (custom-element opt-in). All checks are
// stateless, just consulting the four tables ported in
// `no-unknown-property-data.ts`.
export const reactNoUnknownProperty = defineRule<Rule>({
  id: "react-no-unknown-property",
  severity: "warn",
  recommendation:
    "Use the React-specific name (e.g. `className` instead of `class`, `htmlFor` instead of `for`), or move the attribute to the element it actually belongs to (`crossOrigin` only on `<script>`/`<img>`/...)",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const tagName = node.name.name;
      if (tagName.length === 0) return;
      if (!/^[a-z]/.test(tagName) || tagName === "fbt" || tagName === "fbs") return;

      // `<div is="my-elem" class="...">` opts the element into custom-element
      // semantics; React passes attributes through unchanged, so we skip.
      let isCustomElement = false;
      if (matchesHtmlTagConventions(tagName)) {
        for (const attribute of node.attributes ?? []) {
          if (!isNodeOfType(attribute, "JSXAttribute")) continue;
          if (!isNodeOfType(attribute.name, "JSXIdentifier")) continue;
          if (attribute.name.name === "is") {
            isCustomElement = true;
            break;
          }
        }
      }
      const isStandardHtmlTag = matchesHtmlTagConventions(tagName) && !isCustomElement;

      for (const attribute of node.attributes ?? []) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;
        const attributeName = getJsxAttributeName(attribute.name);
        if (!attributeName) continue;

        if (isValidDataAttribute(attributeName)) {
          if (hasUppercaseCharacter(attributeName)) {
            context.report({
              node: attribute.name,
              message: `React does not recognize data-* props with uppercase characters on a DOM element. Use '${attributeName.toLowerCase()}' instead.`,
            });
          }
          continue;
        }

        if (isValidAriaAttribute(attributeName)) continue;
        if (!isStandardHtmlTag) continue;

        const canonicalName = normalizeAttributeCase(attributeName);
        const allowedTags = ATTRIBUTE_TAGS_MAP.get(canonicalName);
        if (allowedTags) {
          if (!allowedTags.has(tagName)) {
            const allowedList = [...allowedTags].join(", ");
            context.report({
              node: attribute.name,
              message: `Invalid property '${attributeName}' — only allowed on: ${allowedList}.`,
            });
          }
          continue;
        }

        if (DOM_PROPERTIES_NAMES.has(canonicalName)) continue;

        const camelEquivalent =
          DOM_PROPERTIES_LOWER_TO_CANONICAL.get(canonicalName.toLowerCase()) ??
          DOM_ATTRIBUTES_TO_CAMEL.get(canonicalName);
        if (camelEquivalent) {
          context.report({
            node: attribute.name,
            message: `Unknown property '${attributeName}' — use '${camelEquivalent}' instead.`,
          });
          continue;
        }
        context.report({
          node: attribute.name,
          message: `Unknown property '${attributeName}' — remove it.`,
        });
      }
    },
  }),
});
