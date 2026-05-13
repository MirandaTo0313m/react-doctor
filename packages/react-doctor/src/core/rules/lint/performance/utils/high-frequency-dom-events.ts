// HACK: hooks that return a continuously-changing numeric value
// (`useWindowWidth`, `useScrollPosition`, etc.) trigger a re-render on
// every change. If the component only cares about a coarser boolean
// derived from that value (`width < 768` → "is mobile"), it ends up
// rendering on every pixel of resize. Use a media-query / threshold
// hook (`useMediaQuery("(max-width: 767px)")`) which only fires when
// the threshold flips.
//
// Heuristic: `const x = useFooBar(...)` immediately followed by a
// `const y = x [<>=] literal` (or boolean expression on x), where y is
// the only value referenced in the JSX.

export const HIGH_FREQUENCY_DOM_EVENTS = new Set([
  "scroll",
  "mousemove",
  "wheel",
  "pointermove",
  "touchmove",
  "drag",
]);
