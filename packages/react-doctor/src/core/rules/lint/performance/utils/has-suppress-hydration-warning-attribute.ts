import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: scroll, mousemove, wheel, pointermove, and similar high-frequency
// DOM events fire dozens to hundreds of times per second. Calling
// `setState` from these handlers triggers a re-render on every event,
// pegging the JS thread and causing the user-visible jank these
// listeners were trying to react to. Use `useTransition`/`startTransition`
// to mark the update as non-urgent (so the browser can interrupt it for
// input), or stash the value in a ref + raf throttle, or use
// `useDeferredValue`.

// HACK: rendering `new Date()`, `Date.now()`, `Math.random()`, etc.
// directly inside JSX produces a different value on the server vs the
// client. Real fixes keep server HTML stable, then fill the dynamic value
// from a client-only boundary.

export const hasSuppressHydrationWarningAttribute = (
  openingElement: EsTreeNode | null,
): boolean => {
  if (!openingElement) return false;
  for (const attribute of openingElement.attributes ?? []) {
    if (
      isNodeOfType(attribute, "JSXAttribute") &&
      isNodeOfType(attribute.name, "JSXIdentifier") &&
      attribute.name.name === "suppressHydrationWarning"
    ) {
      return true;
    }
  }
  return false;
};
