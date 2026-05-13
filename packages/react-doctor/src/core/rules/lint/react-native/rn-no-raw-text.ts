import { defineRule } from "../../registry.js";
import {
  getRawTextDescription,
  hasDirective,
  isInsideWebPlatformBranch,
  isNodeOfType,
  isRawTextContent,
  isTextHandlingComponent,
  isWebOnlyPath,
  resolveJsxElementName,
} from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const NATIVE_PLATFORM_FILE_PATTERN = /\.(?:android|ios|native)\.[jt]sx?$/;

const isReactNativeImportSource = (sourceValue: unknown): boolean =>
  typeof sourceValue === "string" &&
  (sourceValue === "react-native" || sourceValue.startsWith("react-native/"));

const hasReactNativeImport = (programNode: EsTreeNode): boolean =>
  Boolean(
    programNode.body?.some(
      (statementNode: EsTreeNode) =>
        isNodeOfType(statementNode, "ImportDeclaration") &&
        isReactNativeImportSource(statementNode.source?.value),
    ),
  );

export const rnNoRawText = defineRule<Rule>({
  recommendation:
    "Wrap raw strings in React Native Text components so text layout and accessibility are valid.",
  examples: [
    {
      before: `<FlatList renderItem={({ item }) => <Row style={{ padding: 8 }} item={item} />} />`,
      after: `const renderItem = ({ item }) => <Row item={item} />;
<FlatList renderItem={renderItem} />`,
    },
  ],
  create: (context: RuleContext) => {
    let isNativePlatformFile = false;
    let isWebOnlyFile = false;
    let isDomComponentFile = false;

    return {
      Program(programNode: EsTreeNode) {
        isDomComponentFile = hasDirective(programNode, "use dom");
        isWebOnlyFile = isWebOnlyPath(context.getFilename?.() ?? "");
        isNativePlatformFile =
          NATIVE_PLATFORM_FILE_PATTERN.test(context.getFilename?.() ?? "") ||
          hasReactNativeImport(programNode);
      },
      JSXElement(node: EsTreeNode) {
        if (!isNativePlatformFile) return;
        if (isDomComponentFile || isWebOnlyFile || isInsideWebPlatformBranch(node)) return;

        const elementName = resolveJsxElementName(node.openingElement);
        if (elementName && isTextHandlingComponent(elementName)) return;

        for (const child of node.children ?? []) {
          if (!isRawTextContent(child)) continue;

          context.report({
            node: child,
            message: `Raw ${getRawTextDescription(child)} outside a <Text> component - this will crash on React Native`,
          });
        }
      },
    };
  },
});
