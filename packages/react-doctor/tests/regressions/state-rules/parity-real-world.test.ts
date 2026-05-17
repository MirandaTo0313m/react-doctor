// 1:1 port of upstream `test/real-world.test.js` — drives the full
// recommended config (all 8 rules) against real-world React snippets
// and asserts none of them fire. Mirrors upstream's
// `describe("recommended rules on real-world code", ...)` block.
import { runUpstreamParity } from "./_effect-parity-runner.js";

runUpstreamParity("real-world", { assertNoneOfPortedRules: true });
