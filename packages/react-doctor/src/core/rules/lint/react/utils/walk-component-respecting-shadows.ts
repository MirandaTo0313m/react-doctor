import type { EsTreeNode } from "../../utils/index.js";
import { collectFunctionLocalBindings } from "./collect-function-local-bindings.js";
import { isFunctionLikeNode } from "./is-function-like-node.js";

// HACK: §11 of "You Might Not Need an Effect" + the linked
// `useSyncExternalStore` docs warn that pairing a `useState(getSnapshot())`
// with a `useEffect(() => store.subscribe(() => setSnapshot(getSnapshot())))`
// reimplements `useSyncExternalStore` in user space - incorrectly.
// The hand-rolled version doesn't support concurrent rendering,
// allows tearing during transitions, and lacks server-snapshot
// support during hydration.
//
// We require a four-vertex AST match before reporting:
//
//   (1) useEffect with empty deps                   `[]`
//   (2) body declares `const u = X.subscribe(handler)` OR
//       directly invokes a subscription method      X.addEventListener(...)
//   (3) cleanup is a `return` that either returns the unsubscribe
//       binding directly OR returns a closure that unsubscribes
//   (4) handler is a single `setY(<getter>)` whose `<getter>`
//       is structurally equal to the matching useState's initializer
//
// The combined match is so specific that real-world false positives
// are essentially impossible.

export const walkComponentRespectingShadows = (
  node: EsTreeNode,
  shadowedStateNames: ReadonlySet<string>,
  visit: (child: EsTreeNode, currentlyShadowed: ReadonlySet<string>) => void,
): void => {
  if (!node || typeof node !== "object") return;

  let nextShadowedStateNames = shadowedStateNames;
  if (isFunctionLikeNode(node)) {
    const localBindings = collectFunctionLocalBindings(node);
    if (localBindings.size > 0) {
      const merged = new Set(shadowedStateNames);
      for (const localName of localBindings) merged.add(localName);
      nextShadowedStateNames = merged;
    }
  }

  visit(node, shadowedStateNames);

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === "object" && item.type) {
          walkComponentRespectingShadows(item, nextShadowedStateNames, visit);
        }
      }
    } else if (child && typeof child === "object" && child.type) {
      walkComponentRespectingShadows(child, nextShadowedStateNames, visit);
    }
  }
};
