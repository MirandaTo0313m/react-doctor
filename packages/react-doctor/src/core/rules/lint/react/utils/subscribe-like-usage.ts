// HACK: derive the state variable name from the setter name. `setCount` →
// `count`. We only flag arithmetic when one operand actually matches that
// derived name; otherwise `setCount(1 + computedValue)` would false-positive
// against any incidental Identifier on either side.

export interface SubscribeLikeUsage {
  kind: "subscribe" | "timer";
  resourceName: string;
}
