export { BOOLEAN_PROP_PREFIX_PATTERN } from "./boolean-prop-prefix-pattern.js";
export type { DeprecatedReactImportRuleOptions } from "./deprecated-react-import-rule-options.js";
export { HOOK_OBJECTS_WITH_METHODS } from "./hook-objects-with-methods.js";
export { LEGACY_CONTEXT_NAMES } from "./legacy-context-names.js";
export { LEGACY_LIFECYCLE_REPLACEMENTS } from "./legacy-lifecycle-replacements.js";
export { REACT_19_DEPRECATED_MESSAGES } from "./react-19-deprecated-messages.js";
export { REACT_DOM_DEPRECATED_MESSAGES } from "./react-dom-deprecated-messages.js";
export { REACT_DOM_TEST_UTILS_REPLACEMENTS } from "./react-dom-test-utils-replacements.js";
export { RENDER_PROP_PATTERN } from "./render-prop-pattern.js";
export type { UnsafePrefixSplit } from "./unsafe-prefix-split.js";
export { buildHookBindingMap } from "./build-hook-binding-map.js";
export { buildLegacyContextMessage } from "./build-legacy-context-message.js";
export { stripUnsafePrefix } from "./strip-unsafe-prefix.js";
export { buildLegacyLifecycleMessage } from "./build-legacy-lifecycle-message.js";
export { buildTestUtilsMessage } from "./build-test-utils-message.js";
export { collectBooleanLikePropsFromBody } from "./collect-boolean-like-props-from-body.js";
export { createDeprecatedReactImportRule } from "./create-deprecated-react-import-rule.js";
export { isInsideClassBody } from "./is-inside-class-body.js";
export { reportTestUtilsImports } from "./report-test-utils-imports.js";
export type { CallableReadClassification } from "./callable-read-classification.js";
export { DEFERRABLE_HOOK_NAMES } from "./deferrable-hook-names.js";
export type { EffectInfo } from "./effect-info.js";
export type { MirrorBinding } from "./mirror-binding.js";
export { SENTINEL_IDENTIFIER_NAMES } from "./sentinel-identifier-names.js";
export { STATE_ARITHMETIC_OPERATORS } from "./state-arithmetic-operators.js";
export type { SubscribeLikeUsage } from "./subscribe-like-usage.js";
export { collectIdentifierNames } from "./collect-identifier-names.js";
export { buildLocalDependencyGraph } from "./build-local-dependency-graph.js";
export { findEnclosingFunctionInsideEffect } from "./find-enclosing-function-inside-effect.js";
export { getEnclosingFunctionBindingName } from "./get-enclosing-function-binding-name.js";
export { isCallExpressionWithSubHandlerCallee } from "./is-call-expression-with-sub-handler-callee.js";
export { findSubHandlerForEnclosingFunction } from "./find-sub-handler-for-enclosing-function.js";
export { getSubHandlerCalleeName } from "./get-sub-handler-callee-name.js";
export { classifyCallableReadsInsideEffect } from "./classify-callable-reads-inside-effect.js";
export { isReleaseLikeCall } from "./is-release-like-call.js";
export { containsReleaseLikeCall } from "./contains-release-like-call.js";
export { isSubscribeLikeCallExpression } from "./is-subscribe-like-call-expression.js";
export { isCleanupReturn } from "./is-cleanup-return.js";
export { cleanupReleasesSubscription } from "./cleanup-releases-subscription.js";
export { collectDepIdentifierNames } from "./collect-dep-identifier-names.js";
export { collectFunctionLocalBindings } from "./collect-function-local-bindings.js";
export { collectFunctionTypedLocalBindings } from "./collect-function-typed-local-bindings.js";
export { collectHandlerBindingNames } from "./collect-handler-binding-names.js";
export { isInsideEventHandler } from "./is-inside-event-handler.js";
export { collectHandlerOnlyWriteStateNames } from "./collect-handler-only-write-state-names.js";
export { collectReleasableBindingNames } from "./collect-releasable-binding-names.js";
export { collectRenderReachableNames } from "./collect-render-reachable-names.js";
export { collectReturnExpressions } from "./collect-return-expressions.js";
export { collectUseRefBindingNames } from "./collect-use-ref-binding-names.js";
export { collectUseStateBindings } from "./collect-use-state-bindings.js";
export { collectValueIdentifierNames } from "./collect-value-identifier-names.js";
export { collectWrittenStateNamesInEffect } from "./collect-written-state-names-in-effect.js";
export { deriveStateVariableName } from "./derive-state-variable-name.js";
export { effectHasCleanupRelease } from "./effect-has-cleanup-release.js";
export { expandTransitiveDependencies } from "./expand-transitive-dependencies.js";
export { findHookCallBindings } from "./find-hook-call-bindings.js";
export { findMutableDepIssue } from "./find-mutable-dep-issue.js";
export { findSubscribeLikeUsages } from "./find-subscribe-like-usages.js";
export { findSubscriptionCall } from "./find-subscription-call.js";
export { findTopLevelEffectCalls } from "./find-top-level-effect-calls.js";
export { findTriggeredSideEffectCalleeName } from "./find-triggered-side-effect-callee-name.js";
export { findUseEffectsInComponent } from "./find-use-effects-in-component.js";
export { getPropRootName } from "./get-prop-root-name.js";
export { getSingleSetterCallFromHandler } from "./get-single-setter-call-from-handler.js";
export { getSubscriptionHandlerArgument } from "./get-subscription-handler-argument.js";
export { isSentinelIdentifier } from "./is-sentinel-identifier.js";
export { getTriggerGuardRootName } from "./get-trigger-guard-root-name.js";
export { isFunctionShapedReturn } from "./is-function-shaped-return.js";
export { isExternalSyncEffect } from "./is-external-sync-effect.js";
export { isFunctionLikeNode } from "./is-function-like-node.js";
export { isUnconditionalSetterCallStatement } from "./is-unconditional-setter-call-statement.js";
export { walkComponentRespectingShadows } from "./walk-component-respecting-shadows.js";
export { NUMERIC_NAME_HINTS } from "./numeric-name-hints.js";
export { PREVENT_DEFAULT_ELEMENTS } from "./prevent-default-elements.js";
export { STRING_COERCION_FUNCTIONS } from "./string-coercion-functions.js";
export { SVG_PATH_ATTRIBUTES } from "./svg-path-attributes.js";
export { SVG_PATH_HIGH_PRECISION_PATTERN } from "./svg-path-high-precision-pattern.js";
export { UNCONTROLLED_INPUT_TAGS } from "./uncontrolled-input-tags.js";
export { VALUE_BYPASS_INPUT_TYPES } from "./value-bypass-input-types.js";
export { VALUE_PARTNER_ATTRIBUTES } from "./value-partner-attributes.js";
export { buildPreventDefaultMessage } from "./build-prevent-default-message.js";
export { isUseStateUndefinedInitializer } from "./is-use-state-undefined-initializer.js";
export { collectUndefinedInitialStateNames } from "./collect-undefined-initial-state-names.js";
export { containsPreventDefaultCall } from "./contains-prevent-default-call.js";
export { extractIndexName } from "./extract-index-name.js";
export { getInputTypeLiteral } from "./get-input-type-literal.js";
export { hasJsxSpreadAttribute } from "./has-jsx-spread-attribute.js";
export { isInsideStaticPlaceholderMap } from "./is-inside-static-placeholder-map.js";
export { isNumericName } from "./is-numeric-name.js";
export {
  BOOLEAN_PROP_THRESHOLD,
  GENERIC_EVENT_SUFFIXES,
  GIANT_COMPONENT_LINE_THRESHOLD,
  RENDER_FUNCTION_PATTERN,
  RENDER_PROP_PROLIFERATION_THRESHOLD,
  BUILTIN_GLOBAL_NAMESPACE_NAMES,
  CASCADING_SET_STATE_THRESHOLD,
  EFFECT_HOOK_NAMES,
  HOOKS_WITH_DEPS,
  MUTATING_ARRAY_METHODS,
  REACT_HANDLER_PROP_PATTERN,
  RELATED_USE_STATE_THRESHOLD,
  SUBSCRIPTION_METHOD_NAMES,
  TRIVIAL_DERIVATION_CALLEE_NAMES,
  TRIVIAL_INITIALIZER_NAMES,
} from "../../constants.js";
export {
  isComponentAssignment,
  isComponentDeclaration,
  isUppercaseName,
  areExpressionsStructurallyEqual,
  containsFetchCall,
  countSetStateCalls,
  createComponentBindingStackTracker,
  createComponentPropStackTracker,
  getCallbackStatements,
  getEffectCallback,
  getRootIdentifierName,
  isHookCall,
  isSetterCall,
  isSetterIdentifier,
  walkAst,
  walkInsideStatementBlocks,
  findJsxAttribute,
  isNodeOfType,
} from "../../utils/index.js";
export type { EsTreeNode, RuleContext, Rule } from "../../utils/index.js";
