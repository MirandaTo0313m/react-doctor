// 1:1 port of upstream `test/syntax.test.js` — drives `no-derived-state`
// with 31 syntactic variations (different `useEffect` import shapes,
// arrow vs function components, single vs multi-statement effect bodies,
// `useCallback` wrappers, etc.). These exist upstream as a smoke test
// for the scope-based ast/react helpers; we replay them through our
// eslint-scope-backed analyzer for the same coverage.
import { runUpstreamParity } from "./_effect-parity-runner.js";

runUpstreamParity("syntax", { ruleId: "no-derived-state" });
