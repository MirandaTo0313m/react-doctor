import type { EsTreeNode } from "../../utils/index.js";
import { EXTERNAL_SYNC_AMBIGUOUS_HTTP_METHOD_NAMES } from "../../constants.js";
import { EXTERNAL_SYNC_DIRECT_CALLEE_NAMES } from "../../constants.js";
import { EXTERNAL_SYNC_HTTP_CLIENT_RECEIVERS } from "../../constants.js";
import { EXTERNAL_SYNC_MEMBER_METHOD_NAMES } from "../../constants.js";
import { EXTERNAL_SYNC_OBSERVER_CONSTRUCTORS } from "../../constants.js";
import { getRootIdentifierName } from "../../utils/index.js";
import { isFunctionShapedReturn } from "./is-function-shaped-return.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

export const isExternalSyncEffect = (effectCallback: EsTreeNode): boolean => {
  // A cleanup return is the strongest signal that the effect owns
  // an external resource - once we see one, we don't need to inspect
  // the body for an external-sync call shape.
  if (isNodeOfType(effectCallback.body, "BlockStatement")) {
    const statements = effectCallback.body.body ?? [];
    for (const statement of statements) {
      if (
        isNodeOfType(statement, "ReturnStatement") &&
        statement.argument &&
        isFunctionShapedReturn(statement.argument)
      ) {
        return true;
      }
    }
  }

  let didFindExternalCall = false;
  walkAst(effectCallback, (child: EsTreeNode) => {
    if (didFindExternalCall) return false;

    if (isNodeOfType(child, "NewExpression")) {
      const constructor = child.callee;
      if (
        isNodeOfType(constructor, "Identifier") &&
        EXTERNAL_SYNC_OBSERVER_CONSTRUCTORS.has(constructor.name)
      ) {
        didFindExternalCall = true;
      }
      return;
    }

    if (isNodeOfType(child, "AssignmentExpression")) {
      if (
        isNodeOfType(child.left, "MemberExpression") &&
        isNodeOfType(child.left.property, "Identifier") &&
        child.left.property.name === "current"
      ) {
        didFindExternalCall = true;
      }
      return;
    }

    if (!isNodeOfType(child, "CallExpression")) return;

    if (
      isNodeOfType(child.callee, "Identifier") &&
      EXTERNAL_SYNC_DIRECT_CALLEE_NAMES.has(child.callee.name)
    ) {
      didFindExternalCall = true;
      return;
    }

    if (
      isNodeOfType(child.callee, "MemberExpression") &&
      isNodeOfType(child.callee.property, "Identifier")
    ) {
      const propertyName = child.callee.property.name;
      if (EXTERNAL_SYNC_MEMBER_METHOD_NAMES.has(propertyName)) {
        didFindExternalCall = true;
        return;
      }
      // HACK: `get` / `head` / `options` are HTTP verbs but also names
      // of universal data-structure methods (Map.get, URLSearchParams.get,
      // etc.). Only count them when the receiver looks like an HTTP
      // client.
      if (EXTERNAL_SYNC_AMBIGUOUS_HTTP_METHOD_NAMES.has(propertyName)) {
        const receiverRootName = getRootIdentifierName(child.callee.object);
        if (
          receiverRootName !== null &&
          EXTERNAL_SYNC_HTTP_CLIENT_RECEIVERS.has(receiverRootName)
        ) {
          didFindExternalCall = true;
        }
      }
    }
  });

  return didFindExternalCall;
};
