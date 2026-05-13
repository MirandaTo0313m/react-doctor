import type { EsTreeNode } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";
import { SEQUENTIAL_DELAY_FUNCTION_NAMES } from "../../constants.js";

const MUTATING_RECEIVER_METHODS = new Set([
  "mkdir",
  "mkdirSync",
  "writeFile",
  "writeFiles",
  "writeFileSync",
  "rename",
  "copy",
  "move",
  "remove",
  "unlink",
  "rmdir",
  "install",
  "run",
  "exec",
  "spawn",
  "connect",
  "disconnect",
  "start",
  "stop",
  "init",
  "setup",
  "configure",
  "deploy",
  "create",
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "begin",
  "commit",
  "rollback",
  "lock",
  "unlock",
  "send",
  "publish",
  "subscribe",
  "close",
  "destroy",
]);

const getAwaitReceiverAndMethod = (
  statement: EsTreeNode,
): { receiver: string; method: string } | null => {
  const awaitArg = isNodeOfType(statement, "VariableDeclaration")
    ? statement.declarations?.[0]?.init?.argument
    : isNodeOfType(statement, "ExpressionStatement") &&
        isNodeOfType(statement.expression, "AwaitExpression")
      ? statement.expression.argument
      : null;
  if (!awaitArg) return null;
  if (!isNodeOfType(awaitArg, "CallExpression")) return null;
  const callee = awaitArg.callee;
  if (!isNodeOfType(callee, "MemberExpression")) return null;
  const method = isNodeOfType(callee.property, "Identifier") ? callee.property.name : null;
  if (!method) return null;
  let receiver: string | null = null;
  if (isNodeOfType(callee.object, "Identifier")) receiver = callee.object.name;
  else if (
    isNodeOfType(callee.object, "MemberExpression") &&
    isNodeOfType(callee.object.object, "Identifier")
  ) {
    receiver = callee.object.object.name;
  }
  return receiver ? { receiver, method } : null;
};

const getCalleeName = (awaitArgument: EsTreeNode | null | undefined): string | null => {
  if (!awaitArgument || !isNodeOfType(awaitArgument, "CallExpression")) return null;
  const callee = awaitArgument.callee;
  if (isNodeOfType(callee, "Identifier")) return callee.name;
  if (isNodeOfType(callee, "MemberExpression") && isNodeOfType(callee.property, "Identifier")) {
    return callee.property.name;
  }
  return null;
};

const getAwaitArgument = (statement: EsTreeNode): EsTreeNode | null | undefined => {
  if (isNodeOfType(statement, "VariableDeclaration")) {
    return statement.declarations?.[0]?.init?.argument;
  }
  if (
    isNodeOfType(statement, "ExpressionStatement") &&
    isNodeOfType(statement.expression, "AwaitExpression")
  ) {
    return statement.expression.argument;
  }
  return null;
};

export const reportIfIndependent = (statements: EsTreeNode[], context: RuleContext): void => {
  const declaredNames = new Set<string>();
  const seenReceivers = new Map<string, string[]>();

  for (const statement of statements) {
    const awaitArgument = getAwaitArgument(statement);
    const calleeName = getCalleeName(awaitArgument);
    if (calleeName && SEQUENTIAL_DELAY_FUNCTION_NAMES.has(calleeName)) return;

    if (awaitArgument) {
      let referencesEarlierResult = false;
      walkAst(awaitArgument, (child: EsTreeNode) => {
        if (isNodeOfType(child, "Identifier") && declaredNames.has(child.name)) {
          referencesEarlierResult = true;
        }
      });

      if (referencesEarlierResult) return;
    }

    const receiverInfo = getAwaitReceiverAndMethod(statement);
    if (receiverInfo) {
      const hasMutatingMethod =
        MUTATING_RECEIVER_METHODS.has(receiverInfo.method) ||
        seenReceivers
          .get(receiverInfo.receiver)
          ?.some((prevMethod) => MUTATING_RECEIVER_METHODS.has(prevMethod));
      if (hasMutatingMethod && seenReceivers.has(receiverInfo.receiver)) return;
      const prevMethods = seenReceivers.get(receiverInfo.receiver) ?? [];
      prevMethods.push(receiverInfo.method);
      seenReceivers.set(receiverInfo.receiver, prevMethods);
    }

    if (isNodeOfType(statement, "VariableDeclaration")) {
      const declarator = statement.declarations[0];
      walkAst(declarator.id, (child: EsTreeNode) => {
        if (isNodeOfType(child, "Identifier")) {
          declaredNames.add(child.name);
        }
      });
    }
  }

  context.report({
    node: statements[0],
    message: `${statements.length} sequential await statements that appear independent - use Promise.all() for parallel execution`,
  });
};
