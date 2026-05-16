import type { OxlintRuleSeverity } from "oxlint-plugin-react-doctor";

// These four maps enumerate rules from OTHER plugins (not react-doctor's own
// registry) that the scan opts into via the generated oxlint config. They
// don't have a colocated `defineRule({...})` source like our rules do — the
// rule definitions live inside their respective npm packages — so the
// `<rule-key, severity>` pairs have to be enumerated by hand here. New
// entries land here when we adopt another rule from an upstream plugin or
// when we want a non-default severity for one already adopted.

// HACK: every diagnostic from `eslint-plugin-react-hooks` (the React
// Compiler frontend, oxlint-namespaced as `react-hooks-js`) ships at
// `"error"` severity. Each one represents a code shape the compiler
// cannot optimize - leaving the surrounding component un-memoized at
// runtime - so we want the GitHub Action's default `--fail-on error`
// to trip on these. PR #140 silently downgraded the whole map to
// `"warn"` as part of a broader refactor, which made "React Compiler
// can't optimize this code" diagnostics stop counting toward
// `errorCount` and stop failing CI; restored here.
export const REACT_COMPILER_RULES: Record<string, OxlintRuleSeverity> = {
  "react-hooks-js/set-state-in-render": "error",
  "react-hooks-js/immutability": "error",
  "react-hooks-js/refs": "error",
  "react-hooks-js/purity": "error",
  "react-hooks-js/hooks": "error",
  "react-hooks-js/set-state-in-effect": "error",
  "react-hooks-js/globals": "error",
  "react-hooks-js/error-boundaries": "error",
  "react-hooks-js/preserve-manual-memoization": "error",
  "react-hooks-js/unsupported-syntax": "error",
  "react-hooks-js/component-hook-factories": "error",
  "react-hooks-js/static-components": "error",
  "react-hooks-js/use-memo": "error",
  "react-hooks-js/void-use-memo": "error",
  "react-hooks-js/incompatible-library": "error",
  "react-hooks-js/todo": "error",
};

// HACK: complementary rule surface from
// `eslint-plugin-react-you-might-not-need-an-effect` (#187). These
// fire alongside react-doctor's native `state-and-effects` rules when
// the plugin is installed, providing additional anti-pattern
// detection for effects. Severities are `warn` to match the rest of
// the effects-rule cohort and avoid changing CI pass/fail behavior
// for projects that adopt the plugin.
export const YOU_MIGHT_NOT_NEED_EFFECT_RULES: Record<string, OxlintRuleSeverity> = {
  "effect/no-derived-state": "warn",
  "effect/no-chain-state-updates": "warn",
  "effect/no-event-handler": "warn",
  "effect/no-adjust-state-on-prop-change": "warn",
  "effect/no-reset-all-state-on-prop-change": "warn",
  "effect/no-pass-live-state-to-parent": "warn",
  "effect/no-pass-data-to-parent": "warn",
  "effect/no-initialize-state": "warn",
};

// HACK: oxc's bundled `react` plugin used to be enabled here as
// `BUILTIN_REACT_RULES`, a 12-entry list that this scan re-exported
// verbatim. Eleven of those rules have been rewritten as JS rules
// under `oxlint-plugin-react-doctor/src/plugin/rules/<bucket>/react-*.ts`
// and now activate via `react-doctor/react-*` exactly like our other
// rules. The one exception is `rules-of-hooks` — internally it lives
// in oxc's `react-hooks` plugin (which oxc folds into the `react`
// LintPlugins flag) and depends on full CFG analysis we don't
// reproduce here. We keep using the upstream rule for that one,
// listed below so the `react` plugin still gets enabled.
export const BUILTIN_REACT_RULES: Record<string, OxlintRuleSeverity> = {
  "react/rules-of-hooks": "error",
};

export const BUILTIN_A11Y_RULES: Record<string, OxlintRuleSeverity> = {
  "jsx-a11y/alt-text": "error",
  "jsx-a11y/anchor-is-valid": "warn",
  "jsx-a11y/click-events-have-key-events": "warn",
  "jsx-a11y/no-static-element-interactions": "warn",
  "jsx-a11y/role-has-required-aria-props": "error",
  "jsx-a11y/no-autofocus": "warn",
  "jsx-a11y/heading-has-content": "warn",
  "jsx-a11y/html-has-lang": "warn",
  "jsx-a11y/no-redundant-roles": "warn",
  "jsx-a11y/scope": "warn",
  "jsx-a11y/tabindex-no-positive": "warn",
  "jsx-a11y/label-has-associated-control": "warn",
  "jsx-a11y/no-distracting-elements": "error",
  "jsx-a11y/iframe-has-title": "warn",
};
