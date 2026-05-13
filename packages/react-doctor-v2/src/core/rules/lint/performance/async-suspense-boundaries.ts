import { defineRule } from "../../registry.js";
import { isComponentAssignment, isUppercaseName } from "../react/utils/index.js";
import {
  ROUTE_HANDLER_FILE_PATTERN,
  PAGE_OR_LAYOUT_FILE_PATTERN,
  isNodeOfType,
} from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const containsJsxNode = (node: EsTreeNode, targetName?: string): boolean => {
  let found = false;
  const visit = (child: EsTreeNode): void => {
    if (found) return;
    if (isNodeOfType(child, "JSXOpeningElement")) {
      if (!targetName) {
        found = true;
        return;
      }
      const name = child.name;
      if (isNodeOfType(name, "JSXIdentifier") && name.name === targetName) found = true;
    }
    if (isNodeOfType(child, "JSXFragment")) {
      if (!targetName) {
        found = true;
        return;
      }
    }
    for (const key of Object.keys(child)) {
      if (key === "parent") continue;
      const value = child[key];
      if (Array.isArray(value)) {
        for (const item of value) if (item?.type) visit(item);
      } else if (value?.type) visit(value);
    }
  };
  visit(node);
  return found;
};

export const asyncSuspenseBoundaries = defineRule<Rule>({
  recommendation:
    "Wrap slow async child regions in Suspense boundaries so React can stream available UI while slower data resolves.",
  examples: [
    {
      before: `<Page>{await SlowPanel()}</Page>`,
      after: `<Suspense fallback={<Spinner />}><SlowPanel /></Suspense>`,
    },
  ],
  create: (context: RuleContext) => {
    const filename = context.getFilename?.() ?? "";
    const isSkippedFile =
      PAGE_OR_LAYOUT_FILE_PATTERN.test(filename) || ROUTE_HANDLER_FILE_PATTERN.test(filename);

    const checkAsyncComponent = (node: EsTreeNode, body: EsTreeNode | null | undefined): void => {
      if (isSkippedFile) return;
      if (!node.async || !body) return;
      if (!containsJsxNode(body)) return;
      if (containsJsxNode(body, "Suspense")) return;
      context.report({
        node,
        message:
          "async component renders without a Suspense boundary - wrap slower child regions in <Suspense> so React can stream available content",
      });
    };

    return {
      FunctionDeclaration(node: EsTreeNode) {
        if (!node.id?.name || !isUppercaseName(node.id.name)) return;
        checkAsyncComponent(node, node.body);
      },
      VariableDeclarator(node: EsTreeNode) {
        if (!isComponentAssignment(node)) return;
        checkAsyncComponent(node.init, node.init?.body);
      },
    };
  },
});
