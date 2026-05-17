import { defineRule } from "../../utils/define-rule.js";
import type { Rule } from "../../utils/rule.js";
import type { RuleContext } from "../../utils/rule-context.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";

const ATTRIBUTE_TAGS_MAP: Record<string, Set<string>> = {
  abbr: new Set(["th", "td"]),
  charset: new Set(["meta"]),
  checked: new Set(["input"]),
  closedby: new Set(["dialog"]),
  crossOrigin: new Set(["script", "img", "video", "audio", "link", "image"]),
  displaystyle: new Set(["math"]),
  download: new Set(["a", "area"]),
  fetchPriority: new Set(["img", "link", "script"]),
  fill: new Set([
    "altGlyph", "circle", "ellipse", "g", "line", "marker", "mask", "path",
    "polygon", "polyline", "rect", "svg", "symbol", "text", "textPath", "tref",
    "tspan", "use", "animate", "animateColor", "animateMotion", "animateTransform", "set",
  ]),
  focusable: new Set(["svg"]),
  imageSizes: new Set(["link"]),
  imageSrcSet: new Set(["link"]),
  property: new Set(["meta"]),
  popoverTarget: new Set(["button", "input"]),
  popoverTargetAction: new Set(["button", "input"]),
  viewBox: new Set(["marker", "pattern", "svg", "symbol", "view"]),
  as: new Set(["link"]),
  align: new Set([
    "applet", "caption", "col", "colgroup", "hr", "iframe", "img", "table",
    "tbody", "td", "tfoot", "th", "thead", "tr",
  ]),
  valign: new Set(["tr", "td", "th", "thead", "tbody", "tfoot", "colgroup", "col"]),
  noModule: new Set(["script"]),
  onAbort: new Set(["audio", "video"]),
  onCancel: new Set(["dialog"]),
  onCanPlay: new Set(["audio", "video"]),
  onCanPlayThrough: new Set(["audio", "video"]),
  onClose: new Set(["dialog"]),
  onDurationChange: new Set(["audio", "video"]),
  onEmptied: new Set(["audio", "video"]),
  onEncrypted: new Set(["audio", "video"]),
  onEnded: new Set(["audio", "video"]),
  onError: new Set(["audio", "video", "img", "link", "source", "script", "picture", "iframe"]),
  onLoad: new Set(["script", "img", "link", "picture", "iframe", "object", "source", "body"]),
  onLoadedData: new Set(["audio", "video"]),
  onLoadedMetadata: new Set(["audio", "video"]),
  onLoadStart: new Set(["audio", "video"]),
  onPause: new Set(["audio", "video"]),
  onPlay: new Set(["audio", "video"]),
  onPlaying: new Set(["audio", "video"]),
  onProgress: new Set(["audio", "video"]),
  onRateChange: new Set(["audio", "video"]),
  onResize: new Set(["audio", "video"]),
  onSeeked: new Set(["audio", "video"]),
  onSeeking: new Set(["audio", "video"]),
  onStalled: new Set(["audio", "video"]),
  onSuspend: new Set(["audio", "video"]),
  onTimeUpdate: new Set(["audio", "video"]),
  onVolumeChange: new Set(["audio", "video"]),
  onWaiting: new Set(["audio", "video"]),
  autoPictureInPicture: new Set(["video"]),
  controls: new Set(["audio", "video"]),
  controlsList: new Set(["audio", "video"]),
  disablePictureInPicture: new Set(["video"]),
  disableRemotePlayback: new Set(["audio", "video"]),
  loop: new Set(["audio", "video"]),
  muted: new Set(["audio", "video"]),
  playsInline: new Set(["video"]),
  allowFullScreen: new Set(["iframe", "video"]),
  webkitAllowFullScreen: new Set(["iframe", "video"]),
  mozAllowFullScreen: new Set(["iframe", "video"]),
  poster: new Set(["video"]),
  preload: new Set(["audio", "video"]),
  scrolling: new Set(["iframe"]),
  returnValue: new Set(["dialog"]),
  webkitDirectory: new Set(["input"]),
  shadowrootmode: new Set(["template"]),
  shadowrootclonable: new Set(["template"]),
  shadowrootdelegatesfocus: new Set(["template"]),
  shadowrootserializable: new Set(["template"]),
  "transform-origin": new Set(["rect"]),
  precedence: new Set(["style", "link"]),
};

const DOM_PROPERTIES_NAMES = new Set([
  "dir", "draggable", "hidden", "id", "lang", "nonce", "part", "popover", "slot", "style", "title", "translate", "inert",
  "accept", "action", "allow", "alt", "as", "async", "buffered", "capture", "challenge", "cite", "code", "cols",
  "content", "coords", "csp", "data", "decoding", "default", "defer", "disabled", "form",
  "headers", "height", "high", "href", "icon", "importance", "integrity", "kind", "label",
  "language", "loading", "list", "loop", "low", "manifest", "max", "media", "method", "min", "multiple", "muted",
  "name", "open", "optimum", "pattern", "ping", "placeholder", "poster", "preload", "profile",
  "rel", "required", "reversed", "role", "rows", "sandbox", "scope", "seamless", "selected", "shape", "size", "sizes",
  "span", "src", "start", "step", "summary", "target", "type", "value", "width", "wmode", "wrap",
  "accumulate", "additive", "alphabetic", "amplitude", "ascent", "azimuth", "bbox", "begin",
  "bias", "by", "clip", "color", "cursor", "cx", "cy", "d", "decelerate", "descent", "direction",
  "display", "divisor", "dur", "dx", "dy", "elevation", "end", "exponent", "fill", "filter",
  "format", "from", "fr", "fx", "fy", "g1", "g2", "hanging", "hreflang", "ideographic",
  "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "local", "mask", "mode",
  "offset", "opacity", "operator", "order", "orient", "orientation", "origin", "overflow", "path",
  "points", "r", "radius", "restart", "result", "rotate", "rx", "ry", "scale",
  "seed", "slope", "spacing", "speed", "stemh", "stemv", "string", "stroke", "to", "transform",
  "u1", "u2", "unicode", "values", "version", "visibility", "widths", "x", "x1", "x2", "xmlns",
  "y", "y1", "y2", "z",
  "property",
  "ref", "key", "children",
  "results", "security",
  "controls",
  "accessKey", "autoCapitalize", "autoFocus", "contentEditable", "enterKeyHint", "exportParts",
  "inputMode", "itemID", "itemRef", "itemProp", "itemScope", "itemType", "spellCheck", "tabIndex",
  "acceptCharset", "autoComplete", "autoPlay", "border", "cellPadding", "cellSpacing", "classID", "codeBase",
  "colSpan", "contextMenu", "dateTime", "encType", "formAction", "formEncType", "formMethod", "formNoValidate", "formTarget",
  "frameBorder", "hrefLang", "httpEquiv", "imageSizes", "imageSrcSet", "isMap", "keyParams", "keyType", "marginHeight", "marginWidth",
  "maxLength", "mediaGroup", "minLength", "noValidate", "onAnimationEnd", "onAnimationIteration", "onAnimationStart",
  "onBlur", "onChange", "onClick", "onContextMenu", "onCopy", "onCompositionEnd", "onCompositionStart",
  "onCompositionUpdate", "onCut", "onDoubleClick", "onDrag", "onDragEnd", "onDragEnter", "onDragExit", "onDragLeave",
  "onError", "onFocus", "onInput", "onKeyDown", "onKeyPress", "onKeyUp", "onLoad", "onWheel", "onDragOver",
  "onDragStart", "onDrop", "onMouseDown", "onMouseEnter", "onMouseLeave", "onMouseMove", "onMouseOut", "onMouseOver",
  "onMouseUp", "onPaste", "onScroll", "onScrollEnd", "onSelect", "onSubmit", "onBeforeToggle", "onToggle", "onTransitionEnd", "radioGroup",
  "readOnly", "referrerPolicy", "rowSpan", "srcDoc", "srcLang", "srcSet", "useMap",
  "crossOrigin", "accentHeight", "alignmentBaseline", "arabicForm", "attributeName",
  "attributeType", "baseFrequency", "baselineShift", "baseProfile", "calcMode", "capHeight",
  "clipPathUnits", "clipPath", "clipRule", "colorInterpolation", "colorInterpolationFilters",
  "colorProfile", "colorRendering", "contentScriptType", "contentStyleType", "diffuseConstant",
  "dominantBaseline", "edgeMode", "enableBackground", "fillOpacity", "fillRule", "filterRes",
  "filterUnits", "floodColor", "floodOpacity", "fontFamily", "fontSize", "fontSizeAdjust",
  "fontStretch", "fontStyle", "fontVariant", "fontWeight", "glyphName",
  "glyphOrientationHorizontal", "glyphOrientationVertical", "glyphRef", "gradientTransform",
  "gradientUnits", "horizAdvX", "horizOriginX", "imageRendering", "kernelMatrix",
  "kernelUnitLength", "keyPoints", "keySplines", "keyTimes", "lengthAdjust", "letterSpacing",
  "lightingColor", "limitingConeAngle", "markerEnd", "markerMid", "markerStart", "markerHeight",
  "markerUnits", "markerWidth", "maskContentUnits", "maskUnits", "mathematical", "numOctaves",
  "overlinePosition", "overlineThickness", "panose1", "paintOrder", "pathLength",
  "patternContentUnits", "patternTransform", "patternUnits", "pointerEvents", "pointsAtX",
  "pointsAtY", "pointsAtZ", "preserveAlpha", "preserveAspectRatio", "primitiveUnits",
  "refX", "refY", "rendering-intent", "repeatCount", "repeatDur",
  "requiredExtensions", "requiredFeatures", "shapeRendering", "specularConstant",
  "specularExponent", "spreadMethod", "startOffset", "stdDeviation", "stitchTiles", "stopColor",
  "stopOpacity", "strikethroughPosition", "strikethroughThickness", "strokeDasharray",
  "strokeDashoffset", "strokeLinecap", "strokeLinejoin", "strokeMiterlimit", "strokeOpacity",
  "strokeWidth", "surfaceScale", "systemLanguage", "tableValues", "targetX", "targetY",
  "textAnchor", "textDecoration", "textRendering", "textLength", "transformOrigin",
  "underlinePosition", "underlineThickness", "unicodeBidi", "unicodeRange", "unitsPerEm",
  "vAlphabetic", "vHanging", "vIdeographic", "vMathematical", "vectorEffect", "vertAdvY",
  "vertOriginX", "vertOriginY", "viewBox", "viewTarget", "wordSpacing", "writingMode", "xHeight",
  "xChannelSelector", "xlinkActuate", "xlinkArcrole", "xlinkHref", "xlinkRole", "xlinkShow",
  "xlinkTitle", "xlinkType", "xmlBase", "xmlLang", "xmlnsXlink", "xmlSpace", "yChannelSelector",
  "zoomAndPan",
  "autoCorrect", "autoSave",
  "className", "dangerouslySetInnerHTML", "defaultValue", "defaultChecked", "htmlFor",
  "onBeforeInput",
  "onInvalid", "onReset", "onTouchCancel", "onTouchEnd", "onTouchMove", "onTouchStart", "suppressContentEditableWarning", "suppressHydrationWarning",
  "onAbort", "onCanPlay", "onCanPlayThrough", "onDurationChange", "onEmptied", "onEncrypted", "onEnded",
  "onLoadedData", "onLoadedMetadata", "onLoadStart", "onPause", "onPlay", "onPlaying", "onProgress", "onRateChange", "onResize",
  "onSeeked", "onSeeking", "onStalled", "onSuspend", "onTimeUpdate", "onVolumeChange", "onWaiting",
  "onCopyCapture", "onCutCapture", "onPasteCapture", "onCompositionEndCapture", "onCompositionStartCapture", "onCompositionUpdateCapture",
  "onFocusCapture", "onBlurCapture", "onChangeCapture", "onBeforeInputCapture", "onInputCapture", "onResetCapture", "onSubmitCapture",
  "onInvalidCapture", "onLoadCapture", "onErrorCapture", "onKeyDownCapture", "onKeyPressCapture", "onKeyUpCapture",
  "onAbortCapture", "onCanPlayCapture", "onCanPlayThroughCapture", "onDurationChangeCapture", "onEmptiedCapture", "onEncryptedCapture",
  "onEndedCapture", "onLoadedDataCapture", "onLoadedMetadataCapture", "onLoadStartCapture", "onPauseCapture", "onPlayCapture",
  "onPlayingCapture", "onProgressCapture", "onRateChangeCapture", "onSeekedCapture", "onSeekingCapture", "onStalledCapture", "onSuspendCapture",
  "onTimeUpdateCapture", "onVolumeChangeCapture", "onWaitingCapture", "onSelectCapture", "onTouchCancelCapture", "onTouchEndCapture",
  "onTouchMoveCapture", "onTouchStartCapture", "onScrollCapture", "onScrollEndCapture", "onWheelCapture", "onAnimationEndCapture",
  "onAnimationStartCapture", "onTransitionEndCapture",
  "onAuxClick", "onAuxClickCapture", "onClickCapture", "onContextMenuCapture", "onDoubleClickCapture",
  "onDragCapture", "onDragEndCapture", "onDragEnterCapture", "onDragExitCapture", "onDragLeaveCapture",
  "onDragOverCapture", "onDragStartCapture", "onDropCapture", "onMouseDownCapture",
  "onMouseMoveCapture", "onMouseOutCapture", "onMouseOverCapture", "onMouseUpCapture",
  "autoPictureInPicture", "controlsList", "disablePictureInPicture", "disableRemotePlayback",
  "onGotPointerCaptureCapture",
  "onLostPointerCapture", "onLostPointerCaptureCapture",
  "onPointerCancel", "onPointerCancelCapture",
  "onPointerDown", "onPointerDownCapture",
  "onPointerEnter", "onPointerEnterCapture",
  "onPointerLeave", "onPointerLeaveCapture",
  "onPointerMove", "onPointerMoveCapture",
  "onPointerOut", "onPointerOutCapture",
  "onPointerOver", "onPointerOverCapture",
  "onPointerUp", "onPointerUpCapture",
]);

const DOM_ATTRIBUTES_TO_CAMEL: Record<string, string> = {
  "accept-charset": "acceptCharset",
  class: "className",
  "http-equiv": "httpEquiv",
  crossorigin: "crossOrigin",
  fetchpriority: "fetchPriority",
  for: "htmlFor",
  nomodule: "noModule",
  popovertarget: "popoverTarget",
  popovertargetaction: "popoverTargetAction",
  "accent-height": "accentHeight",
  "alignment-baseline": "alignmentBaseline",
  "arabic-form": "arabicForm",
  "baseline-shift": "baselineShift",
  "cap-height": "capHeight",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",
  "color-profile": "colorProfile",
  "color-rendering": "colorRendering",
  "dominant-baseline": "dominantBaseline",
  "enable-background": "enableBackground",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "flood-color": "floodColor",
  "flood-opacity": "floodOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-size-adjust": "fontSizeAdjust",
  "font-stretch": "fontStretch",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "font-weight": "fontWeight",
  "glyph-name": "glyphName",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  "horiz-adv-x": "horizAdvX",
  "horiz-origin-x": "horizOriginX",
  "image-rendering": "imageRendering",
  "letter-spacing": "letterSpacing",
  "lighting-color": "lightingColor",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "overline-position": "overlinePosition",
  "overline-thickness": "overlineThickness",
  "paint-order": "paintOrder",
  "panose-1": "panose1",
  "pointer-events": "pointerEvents",
  "rendering-intent": "renderingIntent",
  "shape-rendering": "shapeRendering",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "strikethrough-position": "strikethroughPosition",
  "strikethrough-thickness": "strikethroughThickness",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "text-decoration": "textDecoration",
  "text-rendering": "textRendering",
  "underline-position": "underlinePosition",
  "underline-thickness": "underlineThickness",
  "unicode-bidi": "unicodeBidi",
  "unicode-range": "unicodeRange",
  "units-per-em": "unitsPerEm",
  "v-alphabetic": "vAlphabetic",
  "v-hanging": "vHanging",
  "v-ideographic": "vIdeographic",
  "v-mathematical": "vMathematical",
  "vector-effect": "vectorEffect",
  "vert-adv-y": "vertAdvY",
  "vert-origin-x": "vertOriginX",
  "vert-origin-y": "vertOriginY",
  "word-spacing": "wordSpacing",
  "writing-mode": "writingMode",
  "x-height": "xHeight",
  "xlink:actuate": "xlinkActuate",
  "xlink:arcrole": "xlinkArcrole",
  "xlink:href": "xlinkHref",
  "xlink:role": "xlinkRole",
  "xlink:show": "xlinkShow",
  "xlink:title": "xlinkTitle",
  "xlink:type": "xlinkType",
  "xml:base": "xmlBase",
  "xml:lang": "xmlLang",
  "xml:space": "xmlSpace",
};

const DOM_PROPERTIES_IGNORE_CASE = ["charset", "allowFullScreen", "webkitAllowFullScreen", "mozAllowFullScreen", "webkitDirectory"];

const DOM_PROPERTIES_LOWER_MAP = new Map<string, string>();
for (const property of DOM_PROPERTIES_NAMES) {
  DOM_PROPERTIES_LOWER_MAP.set(property.toLowerCase(), property);
}

const isValidDataAttribute = (name: string): boolean => {
  if (!name.startsWith("data-")) return false;
  if (name.toLowerCase().startsWith("data-xml")) return false;
  const dataName = name.slice(5);
  if (dataName.length === 0) return false;
  return !dataName.includes(":");
};

const isValidAriaProperty = (name: string): boolean => name.startsWith("aria-");

const matchesHtmlTagConventions = (tag: string): boolean => {
  if (tag.length === 0) return false;
  const firstChar = tag[0];
  if (firstChar !== firstChar.toLowerCase()) return false;
  return !tag.includes("-");
};

const normalizeAttributeCase = (name: string): string => {
  const found = DOM_PROPERTIES_IGNORE_CASE.find(
    (camelName) => camelName.toLowerCase() === name.toLowerCase(),
  );
  return found ?? name;
};

const getJsxAttributeName = (node: EsTreeNodeOfType<"JSXAttribute">["name"]): string | null => {
  if (isNodeOfType(node, "JSXIdentifier")) return node.name;
  if (isNodeOfType(node, "JSXNamespacedName")) return `${node.namespace.name}:${node.name.name}`;
  return null;
};

export const noUnknownProperty = defineRule<Rule>({
  id: "no-unknown-property",
  severity: "warn",
  recommendation: "Use the correct React DOM property name instead of the unknown attribute",
  create: (context: RuleContext) => ({
    JSXOpeningElement(node: EsTreeNodeOfType<"JSXOpeningElement">) {
      if (!isNodeOfType(node.name, "JSXIdentifier")) return;
      const elementType = node.name.name;

      if (elementType[0] !== elementType[0].toLowerCase()) return;
      if (elementType === "fbt" || elementType === "fbs") return;

      const isValidHtmlTag =
        matchesHtmlTagConventions(elementType) &&
        !node.attributes.some(
          (attribute) =>
            isNodeOfType(attribute, "JSXAttribute") &&
            isNodeOfType(attribute.name, "JSXIdentifier") &&
            attribute.name.name === "is",
        );

      for (const attribute of node.attributes) {
        if (!isNodeOfType(attribute, "JSXAttribute")) continue;

        const actualName = getJsxAttributeName(attribute.name);
        if (!actualName) continue;

        if (isValidDataAttribute(actualName)) continue;
        if (isValidAriaProperty(actualName) || !isValidHtmlTag) continue;

        const name = normalizeAttributeCase(actualName);
        const tagRestriction = ATTRIBUTE_TAGS_MAP[name];
        if (tagRestriction) {
          if (!tagRestriction.has(elementType)) {
            context.report({
              node: attribute,
              message: `Property "${actualName}" is only allowed on: ${[...tagRestriction].join(", ")}`,
            });
          }
          continue;
        }

        if (DOM_PROPERTIES_NAMES.has(name)) continue;

        const lowerSuggestion = DOM_PROPERTIES_LOWER_MAP.get(name.toLowerCase());
        const camelSuggestion = DOM_ATTRIBUTES_TO_CAMEL[name];
        const suggestion = lowerSuggestion ?? camelSuggestion;

        if (suggestion) {
          context.report({
            node: attribute,
            message: `Unknown property "${actualName}" found — did you mean "${suggestion}"?`,
          });
        } else {
          context.report({
            node: attribute,
            message: `Unknown property "${actualName}" found`,
          });
        }
      }
    },
  }),
});
