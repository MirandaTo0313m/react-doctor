import type { EsTreeNode } from "../../utils/index.js";
import type { ServerFnChainInfo } from "./server-fn-chain-info.js";
import { TANSTACK_SERVER_FN_NAMES } from "../../constants.js";
import { getCalleeName } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

export const walkServerFnChain = (outerNode: EsTreeNode): ServerFnChainInfo => {
  const chainInfo: ServerFnChainInfo = {
    isServerFnChain: false,
    specifiedMethod: null,
    hasInputValidator: false,
  };

  let currentNode: EsTreeNode = outerNode.callee?.object;

  while (isNodeOfType(currentNode, "CallExpression")) {
    const calleeName = getCalleeName(currentNode);

    if (calleeName && TANSTACK_SERVER_FN_NAMES.has(calleeName)) {
      chainInfo.isServerFnChain = true;

      const optionsArgument = currentNode.arguments?.[0];
      if (isNodeOfType(optionsArgument, "ObjectExpression")) {
        for (const property of optionsArgument.properties ?? []) {
          if (
            isNodeOfType(property.key, "Identifier") &&
            property.key.name === "method" &&
            isNodeOfType(property.value, "Literal") &&
            typeof property.value.value === "string"
          ) {
            chainInfo.specifiedMethod = property.value.value;
          }
        }
      }
    }

    if (calleeName === "inputValidator") {
      chainInfo.hasInputValidator = true;
    }

    if (isNodeOfType(currentNode.callee, "MemberExpression")) {
      currentNode = currentNode.callee.object;
    } else {
      break;
    }
  }

  return chainInfo;
};
