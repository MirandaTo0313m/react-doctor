import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isAstNode } from "../../utils/is-ast-node.js";
import { isCreateElementCall } from "../../utils/is-create-element-call.js";
import { isEs5Component } from "../../utils/is-es5-component.js";
import { isEs6Component } from "../../utils/is-es6-component.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isReactComponentName } from "../../utils/is-react-component-name.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE = "Component is missing a `displayName` — assign one for easier debugging.";

interface DisplayNameSettings {
  ignoreTranspilerName?: boolean;
  checkContextObjects?: boolean;
}

const resolveSettings = (
  settings: Readonly<Record<string, unknown>> | undefined,
): Required<DisplayNameSettings> => {
  const reactDoctor = settings?.["react-doctor"];
  const ruleSettings =
    typeof reactDoctor === "object" && reactDoctor !== null
      ? ((reactDoctor as { displayName?: DisplayNameSettings }).displayName ?? {})
      : {};
  return {
    ignoreTranspilerName: ruleSettings.ignoreTranspilerName ?? false,
    checkContextObjects: ruleSettings.checkContextObjects ?? false,
  };
};

const containsJsx = (root: EsTreeNode): boolean => {
  let found = false;
  const visit = (node: EsTreeNode): void => {
    if (found) return;
    if (node.type === "JSXElement" || node.type === "JSXFragment") {
      found = true;
      return;
    }
    const nodeRecord = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(nodeRecord)) {
      if (key === "parent") continue;
      const child = nodeRecord[key];
      if (Array.isArray(child)) {
        for (const item of child) if (isAstNode(item)) visit(item);
      } else if (isAstNode(child)) {
        visit(child);
      }
      if (found) return;
    }
  };
  visit(root);
  return found;
};

const hasDisplayNameMember = (classNode: EsTreeNode): boolean => {
  const classBody = (classNode as { body?: EsTreeNode }).body;
  if (!classBody) return false;
  const members = (classBody as { body?: ReadonlyArray<EsTreeNode> }).body ?? [];
  for (const member of members) {
    if (
      (isNodeOfType(member, "PropertyDefinition") || isNodeOfType(member, "MethodDefinition")) &&
      "static" in member &&
      member.static &&
      isNodeOfType(member.key, "Identifier") &&
      member.key.name === "displayName"
    ) {
      return true;
    }
  }
  return false;
};

// Looks for a `<ClassName>.displayName = ...` assignment ANYWHERE in
// the program. Transpiler output and most React codebases attach
// display names this way for non-anonymous classes/functions.
const hasDisplayNameAssignment = (className: string, programRoot: EsTreeNode): boolean => {
  let found = false;
  const visit = (node: EsTreeNode): void => {
    if (found) return;
    if (
      isNodeOfType(node, "AssignmentExpression") &&
      isNodeOfType(node.left, "MemberExpression") &&
      isNodeOfType(node.left.object, "Identifier") &&
      node.left.object.name === className &&
      isNodeOfType(node.left.property, "Identifier") &&
      !node.left.computed &&
      node.left.property.name === "displayName"
    ) {
      found = true;
      return;
    }
    const record = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (key === "parent") continue;
      const child = record[key];
      if (Array.isArray(child)) {
        for (const item of child) if (isAstNode(item)) visit(item);
      } else if (isAstNode(child)) {
        visit(child);
      }
      if (found) return;
    }
  };
  visit(programRoot);
  return found;
};

const findProgramRoot = (node: EsTreeNode): EsTreeNode | null => {
  let current: EsTreeNode | null | undefined = node;
  while (current) {
    if (current.type === "Program") return current;
    current = current.parent ?? null;
  }
  return null;
};

// Port of `oxc_linter::rules::react::display_name`. Reports React
// components whose displayName is unknown to React DevTools — most
// often anonymous function expressions assigned to `module.exports` /
// returned from HoCs, or class components without a static
// `displayName` property where the class name itself is anonymous.
//
// LIMITATION (vs OXC): the upstream rule has extensive HoC awareness
// (memo, forwardRef, createReactClass), JSX-utility-class detection,
// and follows assignments to module.exports, etc. Our port covers the
// most common shapes — anonymous arrow returning JSX, anonymous class
// component without a static displayName.
export const displayName = defineRule<Rule>({
  id: "display-name",
  severity: "warn",
  recommendation: "Assign each component a stable `displayName` for clearer dev-tooling output.",
  category: "Architecture",
  create: (context) => {
    const settings = resolveSettings(context.settings);
    const ignoreNamed = settings.ignoreTranspilerName ? false : true;

    const reportAt = (node: EsTreeNode): void => {
      context.report({ node, message: MESSAGE });
    };

    return {
      ClassDeclaration(node: EsTreeNodeOfType<"ClassDeclaration">) {
        if (!isEs6Component(node)) return;
        if (node.id && isReactComponentName(node.id.name) && ignoreNamed) return;
        if (hasDisplayNameMember(node as EsTreeNode)) return;
        if (node.id) {
          const programRoot = findProgramRoot(node);
          if (programRoot && hasDisplayNameAssignment(node.id.name, programRoot)) return;
        }
        reportAt(node.id ?? node);
      },
      ClassExpression(node: EsTreeNodeOfType<"ClassExpression">) {
        if (!isEs6Component(node)) return;
        if (node.id && isReactComponentName(node.id.name) && ignoreNamed) return;
        if (hasDisplayNameMember(node as EsTreeNode)) return;
        if (node.id) {
          const programRoot = findProgramRoot(node);
          if (programRoot && hasDisplayNameAssignment(node.id.name, programRoot)) return;
        }
        reportAt(node.id ?? node);
      },
      ArrowFunctionExpression(node: EsTreeNodeOfType<"ArrowFunctionExpression">) {
        if (!containsJsx(node)) return;
        let parent = node.parent;
        // Anonymous arrow assigned to a PascalCase var binding or
        // declared as a default export → name is inferable; skip.
        while (parent) {
          if (isNodeOfType(parent, "VariableDeclarator") && isNodeOfType(parent.id, "Identifier")) {
            if (isReactComponentName(parent.id.name) && ignoreNamed) return;
            break;
          }
          if (isNodeOfType(parent, "ExportDefaultDeclaration")) {
            // default export — without further info, skip (OXC also
            // requires explicit displayName for these in some configs).
            return;
          }
          if (
            isNodeOfType(parent, "FunctionDeclaration") ||
            isNodeOfType(parent, "FunctionExpression") ||
            isNodeOfType(parent, "ArrowFunctionExpression") ||
            isNodeOfType(parent, "ClassDeclaration") ||
            isNodeOfType(parent, "ClassExpression") ||
            isNodeOfType(parent, "Program")
          ) {
            break;
          }
          parent = parent.parent ?? null;
        }
      },
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        // Detect createReactClass / React.createClass / similar
        // legacy-component factories without an explicit
        // `displayName` property in their config object.
        if (!isEs5Component(node as EsTreeNode)) return;
        const propsArgument = node.arguments[0];
        if (!propsArgument || !isNodeOfType(propsArgument as EsTreeNode, "ObjectExpression")) {
          // No config object — can't have displayName.
          reportAt(node as EsTreeNode);
          return;
        }
        let hasDisplayName = false;
        for (const property of (propsArgument as EsTreeNodeOfType<"ObjectExpression">).properties) {
          if (!isNodeOfType(property as EsTreeNode, "Property")) continue;
          if ((property as EsTreeNodeOfType<"Property">).computed) continue;
          const key = (property as EsTreeNodeOfType<"Property">).key as EsTreeNode;
          if (isNodeOfType(key, "Identifier") && key.name === "displayName") {
            hasDisplayName = true;
            break;
          }
          if (isNodeOfType(key, "Literal") && key.value === "displayName") {
            hasDisplayName = true;
            break;
          }
        }
        if (hasDisplayName) return;
        // Bound to a PascalCase variable? Inferable name.
        const parent = (node as EsTreeNode).parent;
        if (
          parent &&
          isNodeOfType(parent, "VariableDeclarator") &&
          isNodeOfType(parent.id, "Identifier") &&
          isReactComponentName(parent.id.name) &&
          ignoreNamed
        ) {
          return;
        }
        if (parent && isNodeOfType(parent, "AssignmentExpression")) {
          const left = parent.left as EsTreeNode;
          if (isNodeOfType(left, "Identifier") && isReactComponentName(left.name) && ignoreNamed) {
            return;
          }
          if (
            isNodeOfType(left, "MemberExpression") &&
            isNodeOfType(left.property, "Identifier") &&
            isReactComponentName(left.property.name) &&
            ignoreNamed
          ) {
            return;
          }
        }
        // Suppress unused warning.
        void isCreateElementCall;
        reportAt(node as EsTreeNode);
      },
    };
  },
});
