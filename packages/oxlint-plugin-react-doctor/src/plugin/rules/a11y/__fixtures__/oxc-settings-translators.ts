// Per-rule adapters that translate OXC's option/settings shape into the
// react-doctor settings format consumed by each ported a11y rule.
//
// Each translator receives the raw `oxcOptions` (first config arg from
// OXC's test tuple) and `oxcSettings` (the third tuple slot used for
// plugin settings) and returns the `context.settings` object the
// rule will see — i.e. usually a `{ "react-doctor": { <ruleKey>: {…} } }`
// plus optional `{ "jsx-a11y": {…} }` block forwarding.

interface OxcFixtureLike {
  code: string;
  oxcOptions?: unknown;
  oxcSettings?: unknown;
  oxcFilename?: string;
}

const passthroughTopLevelObject = (raw: unknown): Record<string, unknown> | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const first = raw[0];
  if (typeof first !== "object" || first === null) return null;
  return first as Record<string, unknown>;
};

const wrapForReactDoctor = (
  ruleSettingsKey: string,
  options: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (!options) return null;
  return { "react-doctor": { [ruleSettingsKey]: options } };
};

// Forwards `oxcSettings.settings.jsx-a11y` through verbatim so rules
// that consume polymorphicPropName / components see them.
const oxcSettingsJsxA11yBlock = (oxcSettings: unknown): Record<string, unknown> | null => {
  if (typeof oxcSettings !== "object" || oxcSettings === null) return null;
  const settings = (oxcSettings as { settings?: Record<string, unknown> }).settings;
  if (!settings || typeof settings !== "object") return null;
  const jsxA11y = (settings as { ["jsx-a11y"]?: Record<string, unknown> })["jsx-a11y"];
  return jsxA11y && typeof jsxA11y === "object" ? jsxA11y : null;
};

// Generic translator: wraps the first option into
// `{ "react-doctor": { <ruleKey>: <options> } }` and forwards
// jsx-a11y settings through.
const buildGenericTranslator = (ruleSettingsKey: string) => (fixture: OxcFixtureLike) => {
  const result: Record<string, unknown> = {};
  const reactDoctorBlock = wrapForReactDoctor(
    ruleSettingsKey,
    passthroughTopLevelObject(fixture.oxcOptions),
  );
  if (reactDoctorBlock) Object.assign(result, reactDoctorBlock);
  const jsxA11yBlock = oxcSettingsJsxA11yBlock(fixture.oxcSettings);
  if (jsxA11yBlock) result["jsx-a11y"] = jsxA11yBlock;
  return Object.keys(result).length > 0 ? result : null;
};

export const TRANSLATORS: Record<
  string,
  (fixture: OxcFixtureLike) => Record<string, unknown> | null
> = {
  "alt-text": buildGenericTranslator("altText"),
  "anchor-is-valid": buildGenericTranslator("anchorIsValid"),
  "click-events-have-key-events": buildGenericTranslator("clickEventsHaveKeyEvents"),
  "control-has-associated-label": buildGenericTranslator("controlHasAssociatedLabel"),
  "heading-has-content": buildGenericTranslator("headingHasContent"),
  "html-has-lang": buildGenericTranslator("htmlHasLang"),
  "iframe-has-title": buildGenericTranslator("iframeHasTitle"),
  "label-has-associated-control": buildGenericTranslator("labelHasAssociatedControl"),
  "no-autofocus": buildGenericTranslator("noAutofocus"),
  "no-redundant-roles": buildGenericTranslator("noRedundantRoles"),
  "no-static-element-interactions": buildGenericTranslator("noStaticElementInteractions"),
  "no-distracting-elements": buildGenericTranslator("noDistractingElements"),
  "role-has-required-aria-props": buildGenericTranslator("roleHasRequiredAriaProps"),
  scope: buildGenericTranslator("scope"),
  "tabindex-no-positive": buildGenericTranslator("tabindexNoPositive"),
  // Forward jsx-a11y settings even when no options.
  "aria-props": buildGenericTranslator("ariaProps"),
  "aria-role": buildGenericTranslator("ariaRole"),
  "aria-proptypes": buildGenericTranslator("ariaProptypes"),
  "aria-unsupported-elements": buildGenericTranslator("ariaUnsupportedElements"),
  "anchor-has-content": buildGenericTranslator("anchorHasContent"),
  "no-access-key": buildGenericTranslator("noAccessKey"),
  "img-redundant-alt": buildGenericTranslator("imgRedundantAlt"),
  "interactive-supports-focus": buildGenericTranslator("interactiveSupportsFocus"),
  "media-has-caption": buildGenericTranslator("mediaHasCaption"),
  "mouse-events-have-key-events": buildGenericTranslator("mouseEventsHaveKeyEvents"),
  "no-aria-hidden-on-focusable": buildGenericTranslator("noAriaHiddenOnFocusable"),
  "no-noninteractive-tabindex": buildGenericTranslator("noNoninteractiveTabindex"),
  "role-supports-aria-props": buildGenericTranslator("roleSupportsAriaProps"),
  "anchor-ambiguous-text": buildGenericTranslator("anchorAmbiguousText"),
  "aria-activedescendant-has-tabindex": buildGenericTranslator("ariaActivedescendantHasTabindex"),
  "autocomplete-valid": buildGenericTranslator("autocompleteValid"),
  lang: buildGenericTranslator("lang"),
  "no-interactive-element-to-noninteractive-role": buildGenericTranslator(
    "noInteractiveElementToNoninteractiveRole",
  ),
  "no-noninteractive-element-interactions": buildGenericTranslator(
    "noNoninteractiveElementInteractions",
  ),
  "no-noninteractive-element-to-interactive-role": buildGenericTranslator(
    "noNoninteractiveElementToInteractiveRole",
  ),
  "prefer-tag-over-role": buildGenericTranslator("preferTagOverRole"),
};
