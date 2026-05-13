import type { EsTreeNode } from "../../utils/index.js";

// HACK: "Lifecycle of Reactive Effects" - Can global or mutable
// values be dependencies? - calls out that `location.pathname`,
// `ref.current`, and other mutable values can't be deps:
//
//   "Mutable values aren't reactive. Changing it wouldn't trigger
//    a re-render, so even if you specified it in the dependencies,
//    React wouldn't know to re-synchronize the Effect."
//
// We flag two shapes:
//   (1) MemberExpression rooted in a known mutable global
//       (location, window, document, navigator, history, ...) -
//       e.g. `location.pathname`, `window.innerWidth`, `document.title`
//   (2) MemberExpression `<x>.current` where `x` is a `useRef`
//       binding declared in the same component
//
// Bare `location` / bare `useRef`-returned identifiers are NOT
// flagged - those are themselves stable references; only their
// mutable property reads are the bug.

export interface MirrorBinding {
  valueName: string;
  setterName: string;
  initializer: EsTreeNode;
  propRootName: string;
}
