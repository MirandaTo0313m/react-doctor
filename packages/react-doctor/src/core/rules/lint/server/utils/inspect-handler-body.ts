import type { EsTreeNode } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import { callReadsHandlerArgs } from "./call-reads-handler-args.js";
import { isFetchOfImportMetaUrl } from "./is-fetch-of-import-meta-url.js";
import { isNodeOfType } from "../../utils/index.js";
import { isStaticIoCall } from "./is-static-io-call.js";
import { walkAst } from "../../utils/index.js";

export const inspectHandlerBody = (
  context: RuleContext,
  handlerBody: EsTreeNode,
  handlerLabel: string,
  handlerParamNames: Set<string>,
): void => {
  walkAst(handlerBody, (child: EsTreeNode) => {
    let staticCall: EsTreeNode | null = null;
    if (isStaticIoCall(child)) staticCall = child;
    else if (isFetchOfImportMetaUrl(child)) staticCall = child;
    else if (
      isNodeOfType(child, "AwaitExpression") &&
      child.argument &&
      (isStaticIoCall(child.argument) || isFetchOfImportMetaUrl(child.argument))
    ) {
      staticCall = child.argument;
    }
    if (!staticCall) return;
    if (callReadsHandlerArgs(staticCall, handlerParamNames)) return;

    const calleeText =
      isNodeOfType(staticCall.callee, "MemberExpression") &&
      isNodeOfType(staticCall.callee.property, "Identifier")
        ? `${
            isNodeOfType(staticCall.callee.object, "Identifier")
              ? staticCall.callee.object.name
              : "?"
          }.${staticCall.callee.property.name}`
        : isNodeOfType(staticCall.callee, "Identifier")
          ? staticCall.callee.name
          : "io";
    context.report({
      node: staticCall,
      message: `${calleeText}() in ${handlerLabel} reads the same static asset every request - hoist to module scope so the read happens once at module load`,
    });
  });
};
