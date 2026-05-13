import { defineRule } from "../../registry.js";
import {
  createComponentPropStackTracker,
  getRootIdentifierName,
  isHookCall,
  isNodeOfType,
} from "./utils/index.js";
import type { EsTreeNode, Rule, RuleContext } from "./utils/index.js";

const INITIAL_VALUE_PROP_PATTERN = /^(?:default|initial)[A-Z]/;

const isInitialValueProp = (propName: string): boolean =>
  INITIAL_VALUE_PROP_PATTERN.test(propName);

export const noDerivedUseState = defineRule<Rule>({
  recommendation:
    "Initialize state only for truly mutable local state; derive props and computed values directly during render or with useMemo.",
  examples: [
    {
      before: `const [fullName] = useState(\`\${first} \${last}\`);`,
      after: `const fullName = \`\${first} \${last}\`;`,
    },
  ],
  create: (context: RuleContext) => {
    const propStackTracker = createComponentPropStackTracker();

    return {
      ...propStackTracker.visitors,
      CallExpression(node: EsTreeNode) {
        if (!isHookCall(node, "useState") || !node.arguments?.length) return;
        const initializer = node.arguments[0];

        if (
          isNodeOfType(initializer, "Identifier") &&
          propStackTracker.isPropName(initializer.name)
        ) {
          if (isInitialValueProp(initializer.name)) return;
          context.report({
            node,
            message: `useState initialized from prop "${initializer.name}" - if this value should stay in sync with the prop, derive it during render instead`,
          });
          return;
        }

        if (isNodeOfType(initializer, "MemberExpression") && !initializer.computed) {
          const rootIdentifierName = getRootIdentifierName(initializer);
          if (rootIdentifierName && propStackTracker.isPropName(rootIdentifierName)) {
            if (isInitialValueProp(rootIdentifierName)) return;
            context.report({
              node,
              message: `useState initialized from prop "${rootIdentifierName}" - if this value should stay in sync with the prop, derive it during render instead`,
            });
          }
        }
      },
    };
  },
});
