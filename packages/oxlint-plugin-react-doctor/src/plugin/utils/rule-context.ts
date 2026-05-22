import type { ReportDescriptor } from "./report-descriptor.js";
import type { ControlFlowAnalysis } from "../semantic/control-flow-graph.js";
import type { ScopeAnalysis } from "../semantic/scope-analysis.js";

// The "base" context the host (oxlint at runtime, ESLint via the
// adapter, our test harness) hands to a rule. Pure I/O surface — the
// host doesn't need to compute scope or CFG for us.
export interface BaseRuleContext {
  report: (descriptor: ReportDescriptor) => void;
  getFilename?: () => string;
  readonly settings?: Readonly<Record<string, unknown>>;
}

// The rule-facing context. Rules read `scopes` / `cfg` when they need
// them; both are guaranteed non-null because every rule is wrapped at
// plugin load time by `wrapWithSemanticContext`, which enriches the
// host's BaseRuleContext into a RuleContext with lazy scope + CFG
// builders. Tests pass a fully-built context directly via run-rule.ts.
export interface RuleContext extends BaseRuleContext {
  readonly scopes: ScopeAnalysis;
  readonly cfg: ControlFlowAnalysis;
}
