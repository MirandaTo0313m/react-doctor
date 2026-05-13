import { defineRule } from "../../registry.js";
import { isNodeOfType } from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const isCreateElementCall = (node: EsTreeNode): boolean =>
  isNodeOfType(node, "CallExpression") &&
  isNodeOfType(node.callee, "MemberExpression") &&
  isNodeOfType(node.callee.object, "Identifier") &&
  node.callee.object.name === "document" &&
  isNodeOfType(node.callee.property, "Identifier") &&
  node.callee.property.name === "createElement";

const isInsideRequestAnimationFrame = (node: EsTreeNode): boolean => {
  let current: EsTreeNode | null | undefined = node.parent;
  while (current) {
    if (
      isNodeOfType(current, "CallExpression") &&
      isNodeOfType(current.callee, "Identifier") &&
      current.callee.name === "requestAnimationFrame"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

export const jsBatchDomCss = defineRule<Rule>({
  recommendation:
    "Batch DOM style changes with classes, cssText, or a single write phase to avoid repeated layout work.",
  examples: [
    {
      before: `el.style.width = width;
el.style.height = height;`,
      after: `el.className = "expanded";`,
    },
  ],
  create: (context: RuleContext) => {
    const isStyleAssignment = (node: EsTreeNode): boolean =>
      isNodeOfType(node, "ExpressionStatement") &&
      isNodeOfType(node.expression, "AssignmentExpression") &&
      isNodeOfType(node.expression.left, "MemberExpression") &&
      isNodeOfType(node.expression.left.object, "MemberExpression") &&
      isNodeOfType(node.expression.left.object.property, "Identifier") &&
      node.expression.left.object.property.name === "style";

    const getStyleReceiver = (node: EsTreeNode): string | null => {
      if (!isStyleAssignment(node)) return null;
      const receiver = node.expression.left.object.object;
      return isNodeOfType(receiver, "Identifier") ? receiver.name : null;
    };

    const collectCreatedElementNames = (statements: EsTreeNode[]): Set<string> => {
      const names = new Set<string>();
      for (const statement of statements) {
        if (
          isNodeOfType(statement, "VariableDeclaration") &&
          Array.isArray(statement.declarations)
        ) {
          for (const declarator of statement.declarations) {
            if (isNodeOfType(declarator.id, "Identifier") && isCreateElementCall(declarator.init)) {
              names.add(declarator.id.name);
            }
          }
        }
        if (
          isNodeOfType(statement, "ExpressionStatement") &&
          isNodeOfType(statement.expression, "AssignmentExpression") &&
          isNodeOfType(statement.expression.left, "Identifier") &&
          isCreateElementCall(statement.expression.right)
        ) {
          names.add(statement.expression.left.name);
        }
      }
      return names;
    };

    return {
      BlockStatement(node: EsTreeNode) {
        if (isInsideRequestAnimationFrame(node)) return;
        const statements = node.body ?? [];
        const createdElementNames = collectCreatedElementNames(statements);

        for (let statementIndex = 1; statementIndex < statements.length; statementIndex++) {
          if (
            isStyleAssignment(statements[statementIndex]) &&
            isStyleAssignment(statements[statementIndex - 1])
          ) {
            const receiverName = getStyleReceiver(statements[statementIndex]);
            if (receiverName !== null && createdElementNames.has(receiverName)) continue;
            context.report({
              node: statements[statementIndex],
              message:
                "Multiple sequential element.style assignments - batch with cssText or classList for fewer reflows",
            });
          }
        }
      },
    };
  },
});
