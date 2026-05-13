import type { CallableReadClassification } from "./callable-read-classification.js";
import type { EsTreeNode } from "../../utils/index.js";
import { findEnclosingFunctionInsideEffect } from "./find-enclosing-function-inside-effect.js";
import { findSubHandlerForEnclosingFunction } from "./find-sub-handler-for-enclosing-function.js";
import { getSubHandlerCalleeName } from "./get-sub-handler-callee-name.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: handles the dominant real-world shape where the handler is
// bound to a const before being passed to addEventListener / subscribe:
//
//   const handler = (event) => onKey(event.key);
//   window.addEventListener('keydown', handler);
//   return () => window.removeEventListener('keydown', handler);
//
// Walks up to the function-level node (the arrow expression) and checks
// for either a direct sub-handler argument position OR a const binding
// whose Identifier appears as an argument to a sub-handler call later
// in the same effect body.
// Resolve the enclosing function back to its local-binding name across
// the three idiomatic shapes:
//   const handler = (e) => ...      → VariableDeclarator binding
//   function handler(e) { ... }     → FunctionDeclaration self-binding
//   let handler; handler = (e) => ... → AssignmentExpression binding

export const classifyCallableReadsInsideEffect = (
  callableName: string,
  effectCallback: EsTreeNode,
): CallableReadClassification => {
  let hasAnyRead = false;
  let allReadsAreInSubHandlers = true;
  let firstSubHandlerName: string | null = null;

  walkAst(effectCallback, (child: EsTreeNode) => {
    if (!isNodeOfType(child, "Identifier")) return;
    if (child.name !== callableName) return;
    const parent = child.parent;
    if (isNodeOfType(parent, "ArrayExpression")) return;
    if (isNodeOfType(parent, "MemberExpression") && !parent.computed && parent.property === child) {
      return;
    }
    if (
      isNodeOfType(parent, "Property") &&
      !parent.computed &&
      !parent.shorthand &&
      parent.key === child
    ) {
      return;
    }

    hasAnyRead = true;

    const enclosingFunction = findEnclosingFunctionInsideEffect(child, effectCallback);
    if (!enclosingFunction) {
      allReadsAreInSubHandlers = false;
      return;
    }
    const subHandlerCall = findSubHandlerForEnclosingFunction(enclosingFunction, effectCallback);
    if (!subHandlerCall) {
      allReadsAreInSubHandlers = false;
      return;
    }
    if (firstSubHandlerName === null) {
      firstSubHandlerName = getSubHandlerCalleeName(subHandlerCall);
    }
  });

  return { hasAnyRead, allReadsAreInSubHandlers, firstSubHandlerName };
};
