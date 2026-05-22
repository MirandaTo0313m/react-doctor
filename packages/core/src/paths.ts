import * as Schema from "effect/Schema";

/**
 * Absolute filesystem path to the oxlint binary loaded by the lint
 * runner. Branded so it doesn't get confused with `NodeBinaryPath` at
 * a call site: both are `string` but pass them in the wrong order
 * (e.g. `spawn(oxlintBinary, [nodeBinary, ...])`) and the lint scan
 * silently fails. The brand lets the typechecker catch the swap.
 */
export const OxlintBinaryPath = Schema.String.pipe(Schema.brand("OxlintBinaryPath"));
export type OxlintBinaryPath = Schema.Schema.Type<typeof OxlintBinaryPath>;

/**
 * Absolute filesystem path to a Node binary whose native bindings
 * are loadable by the oxlint native module. Resolved by
 * `resolveOxlintNode` on the host; the brand pairs with
 * `OxlintBinaryPath` to keep the two from being swapped.
 */
export const NodeBinaryPath = Schema.String.pipe(Schema.brand("NodeBinaryPath"));
export type NodeBinaryPath = Schema.Schema.Type<typeof NodeBinaryPath>;
