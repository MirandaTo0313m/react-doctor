import { defineRule } from "../../registry.js";
import { createLoopAwareVisitors, isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const STRING_RETURNING_METHODS: ReadonlySet<string> = new Set([
  "toString",
  "toLocaleString",
  "toLowerCase",
  "toUpperCase",
  "toLocaleLowerCase",
  "toLocaleUpperCase",
  "trim",
  "trimStart",
  "trimEnd",
  "padStart",
  "padEnd",
  "normalize",
  "repeat",
  "replace",
  "replaceAll",
  "substring",
  "substr",
  "charAt",
  "toFixed",
  "toExponential",
  "toPrecision",
  "toJSON",
]);

const STRING_TYPED_PROPERTY_NAMES: ReadonlySet<string> = new Set([
  "textContent",
  "innerText",
  "innerHTML",
  "outerHTML",
  "nodeValue",
  "nodeName",
  "localName",
  "namespaceURI",
  "baseURI",
  "documentURI",
  "tagName",
  "className",
  "id",
  "lang",
  "dir",
  "title",
  "alt",
  "type",
  "name",
  "placeholder",
  "href",
  "src",
  "value",
  "accessKey",
  "contentEditable",
  "hash",
  "host",
  "hostname",
  "pathname",
  "port",
  "protocol",
  "search",
  "origin",
  "username",
  "password",
  "characterSet",
  "contentType",
  "charset",
  "mimeType",
  "mediaType",
  "cssText",
  "message",
  "stack",
  "fileName",
  "code",
  "label",
  "slug",
  "prefix",
]);

const STRING_TYPED_IDENTIFIER_NAMES: ReadonlySet<string> = new Set([
  "text",
  "string",
  "str",
  "content",
  "contents",
  "html",
  "xml",
  "json",
  "css",
  "yaml",
  "markdown",
  "source",
  "sourceCode",
  "template",
  "raw",
  "comment",
  "description",
  "summary",
  "snippet",
  "url",
  "uri",
  "path",
  "filename",
  "filepath",
  "fileName",
  "filePath",
  "line",
  "char",
  "character",
  "letter",
  "word",
  "phrase",
  "sentence",
  "paragraph",
  "query",
  "search",
  "haystack",
  "needle",
  "route",
  "key",
  "token",
  "tag",
]);

const STRING_TYPED_IDENTIFIER_SUFFIX_PATTERN =
  /(?:Text|Name|Label|Title|Url|Path|Key|Route|Slug|Token|Tag|Id|Code|Type|Value)$/;

const isLikelyStringReceiver = (receiver: EsTreeNode | null | undefined): boolean => {
  if (!receiver) return false;
  if (isNodeOfType(receiver, "Literal") && typeof receiver.value === "string") return true;
  if (isNodeOfType(receiver, "TemplateLiteral")) return true;
  if (
    isNodeOfType(receiver, "CallExpression") &&
    isNodeOfType(receiver.callee, "Identifier") &&
    receiver.callee.name === "String"
  ) {
    return true;
  }
  if (
    isNodeOfType(receiver, "CallExpression") &&
    isNodeOfType(receiver.callee, "MemberExpression") &&
    isNodeOfType(receiver.callee.property, "Identifier") &&
    STRING_RETURNING_METHODS.has(receiver.callee.property.name)
  ) {
    return true;
  }
  if (
    isNodeOfType(receiver, "MemberExpression") &&
    isNodeOfType(receiver.property, "Identifier") &&
    (STRING_TYPED_PROPERTY_NAMES.has(receiver.property.name) ||
      STRING_TYPED_IDENTIFIER_SUFFIX_PATTERN.test(receiver.property.name))
  ) {
    return true;
  }
  if (
    isNodeOfType(receiver, "ChainExpression") &&
    receiver.expression &&
    isLikelyStringReceiver(receiver.expression)
  ) {
    return true;
  }
  if (isNodeOfType(receiver, "Identifier")) {
    return (
      STRING_TYPED_IDENTIFIER_NAMES.has(receiver.name) ||
      STRING_TYPED_IDENTIFIER_SUFFIX_PATTERN.test(receiver.name)
    );
  }
  return false;
};

export const jsSetMapLookups = defineRule<Rule>({
  recommendation:
    "Use Set or Map for repeated membership and lookup checks instead of scanning arrays repeatedly.",
  examples: [
    {
      before: `selectedIds.includes(item.id);`,
      after: `selectedIdSet.has(item.id);`,
    },
  ],
  create: (context: RuleContext) =>
    createLoopAwareVisitors({
      CallExpression(node: EsTreeNode) {
        if (
          !isNodeOfType(node.callee, "MemberExpression") ||
          !isNodeOfType(node.callee.property, "Identifier")
        )
          return;
        const methodName = node.callee.property.name;
        if (methodName !== "includes" && methodName !== "indexOf") return;
        if (methodName === "indexOf" && (node.arguments?.length ?? 0) >= 2) return;
        if (isLikelyStringReceiver(node.callee.object)) return;
        if (
          isNodeOfType(node.callee.object, "ArrayExpression") &&
          (node.callee.object.elements?.length ?? 0) < 8
        ) {
          return;
        }
        context.report({
          node,
          message: `array.${methodName}() in a loop is O(n) per call - convert to a Set for O(1) lookups`,
        });
      },
    }),
});
