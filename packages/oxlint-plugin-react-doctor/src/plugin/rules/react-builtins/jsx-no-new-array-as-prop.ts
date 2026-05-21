import {
  buildSameFileMemoRegistry,
  memoStatusForJsxOpeningName,
  type MemoStatus,
} from "../../utils/build-same-file-memo-registry.js";
import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNode } from "../../utils/es-tree-node.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { findVariableInitializer } from "../../utils/find-variable-initializer.js";
import { isInsideFunctionScope } from "../../utils/is-inside-function-scope.js";
import { isJsxAttributeOnIntrinsicHtmlElement } from "../../utils/is-on-intrinsic-html-element.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isTestlikeFilename } from "../../utils/is-testlike-filename.js";
import { stripParenExpression } from "../../utils/strip-paren-expression.js";
import type { Rule } from "../../utils/rule.js";

const MESSAGE =
  "JSX prop receives a new Array on every render — extract it or memoize to avoid re-renders.";

// Data-collection-shape prop names that conventionally receive an
// inline array literal: list/table/menu/chart components, command
// palettes, tabs, etc. all take a `data` / `items` / `options` /
// `tabs` / `series` array. Flagging these creates noise on every
// library consumer without surfacing actual perf bugs.
const DATA_ARRAY_PROP_NAMES: ReadonlySet<string> = new Set([
  // Generic data slots
  "data",
  "items",
  "options",
  "entries",
  "list",
  "dataset",
  "elements",
  "values",
  // Domain-specific collections
  "tabs",
  "columns",
  "rows",
  "pages",
  "categories",
  "tags",
  "keywords",
  "files",
  "blocks",
  "entities",
  "shapes",
  "events",
  "messages",
  "users",
  "series",
  "datasets",
  "children",
  "subRows",
  "nodes",
  "edges",
  // Chart / virtualization specifics
  "size",
  "ticks",
  "yAxis",
  "xAxis",
  // Picker / list / menu / command palette
  "actions",
  "commands",
  "customCommandPaletteItems",
  "renderingShapes",
  "calendarEvents",
  // Chart / visualization series
  "bars",
  "trails",
  "lines",
  "areas",
  "marks",
  "points",
  "labels",
  // Filter / selection collections
  "filters",
  "selectedValues",
  "resources",
  "propertyFilters",
  "dayTimes",
  // UI: nav / menu / shortcut / keybind / hotkey collections
  "links",
  "panels",
  "shortcuts",
  "hotkeys",
  "keybind",
  "keybinds",
  "modifiers",
  // Generic-but-conventional data sources
  "dataSource",
  "suggestions",
  "people",
  "tasks",
  "colors",
  // Domain / taxonomy
  "nouns",
  "verbs",
  "iconButtons",
  // Layout / breadcrumb
  "breadcrumbs",
  "fallbackPlacements",
  // Generic value-as-collection (multi-select, multi-tag controls)
  "value",
  "currentValue",
  // Common domain collections (corpus-derived)
  "listParts",
  "objectNameSingulars",
  "tagsAvailable",
  "properties",
  "middleware",
  "middlewares",
  "variants",
  "surveys",
  "choices",
  "layers",
  "models",
  "roles",
  "metrics",
  "teams",
  "additionalActions",
  "additionalRefs",
  "addonFeatures",
  "operatorAllowlist",
  "goalLines",
  "selectedProperties",
  "panelActions",
  "operandsForFilterType",
  "dataWarehousePopoverFields",
  // Additional common patterns
  "avatars",
  "participants",
  "members",
  "accounts",
  "workspaces",
  "projects",
  "folders",
  "notes",
  "comments",
  "notifications",
  "posts",
  "threads",
  "authors",
  "recipients",
  "subscribers",
  "selections",
  "versions",
  "branches",
  "commits",
  "releases",
  "builds",
  "deployments",
  "jobs",
  "stages",
  "phases",
  "milestones",
  "cards",
  "tiles",
  "slides",
  "routes",
  "permissions",
  "capabilities",
  "settings",
  "attributes",
  "aspects",
  "stats",
  "statistics",
  "insights",
  "findings",
  "issues",
  "tickets",
  "bugs",
  "defects",
  "annotations",
  "markers",
  "pins",
  "stickers",
  "tools",
  "plugins",
  "extensions",
  "modules",
  "services",
  "providers",
  "adapters",
  "helpers",
  "validators",
  "transformers",
  "formatters",
  "serializers",
  "parsers",
  "vehicles",
  "devices",
]);

// Suffix patterns: `*Items`, `*Options`, `*Tabs`, `*Columns`, `*Rows`,
// `*List`, `*Series`, `*Categories`, `*Events`, `*Entries`, `*Elements`,
// `*Shapes`, `*Children`, `*Nodes`, `*Edges`, `*Data`, `*Collection`,
// `*Models`, `*Records`, `*Filters`, `*Values`, `*Times`, `*Resources`.
const DATA_ARRAY_PROP_SUFFIXES: ReadonlyArray<string> = [
  "Items",
  "Options",
  "Tabs",
  "Columns",
  "Rows",
  "List",
  "Series",
  "Categories",
  "Events",
  "Entries",
  "Elements",
  "Shapes",
  "Children",
  "Nodes",
  "Edges",
  "Data",
  "Collection",
  "Collections",
  "Models",
  "Records",
  "Filters",
  "Values",
  "Times",
  "Resources",
  // More plural collection suffixes
  "Types",
  "Ids",
  "IdArray",
  "IDs",
  "Names",
  "Tags",
  "Keys",
  "Labels",
  "Groups",
  "Buttons",
  "Icons",
  "Links",
  "Steps",
  "Stages",
  "Sources",
  "Targets",
  "Suggestions",
  "Operations",
  "Contexts",
  "Placements",
  "Breadcrumbs",
  "Hotkeys",
  "Shortcuts",
  "Panels",
  "Actions",
  "Activities",
  "Avatars",
  "Participants",
  "Members",
  "Users",
  "Accounts",
  "Workspaces",
  "Projects",
  "Files",
  "Folders",
  "Notes",
  "Comments",
  "Messages",
  "Notifications",
  "Posts",
  "Threads",
  "Authors",
  "Recipients",
  "Subscribers",
  "Choices",
  "Selections",
  "Variants",
  "Versions",
  "Branches",
  "Commits",
  "Releases",
  "Builds",
  "Deployments",
  "Jobs",
  "Tasks",
  "Phases",
  "Milestones",
  "Cards",
  "Tiles",
  "Slides",
  "Pages",
  "Routes",
  "Roles",
  "Permissions",
  "Capabilities",
  "Settings",
  "Properties",
  "Attributes",
  "Aspects",
  "Metrics",
  "Stats",
  "Statistics",
  "Insights",
  "Findings",
  "Issues",
  "Tickets",
  "Bugs",
  "Defects",
  "Annotations",
  "Markers",
  "Pins",
  "Stickers",
  "Tools",
  "Plugins",
  "Extensions",
  "Modules",
  "Services",
  "Providers",
  "Adapters",
  "Helpers",
  "Validators",
  "Transformers",
  "Formatters",
  "Serializers",
  "Parsers",
  "Vehicles",
  "Devices",
];

const isDataArrayPropName = (propName: string): boolean => {
  if (DATA_ARRAY_PROP_NAMES.has(propName)) return true;
  for (const suffix of DATA_ARRAY_PROP_SUFFIXES) {
    if (propName.length > suffix.length && propName.endsWith(suffix)) return true;
  }
  return false;
};

const ARRAY_CONSTRUCTOR_NAMES = new Set(["Array"]);
// `.map(fn)` / `.filter(fn)` always take exactly one callback argument
// — flagging them with a different arity is almost certainly a false
// positive on a non-Array `.map`/`.filter` (e.g. `Map#map` doesn't exist
// but custom utilities might). `.concat` is the odd one: zero args is a
// shallow copy, multi-args is a multi-element concat — both still
// allocate a new array, so we don't restrict by arity for it.
const SINGLE_ARG_ARRAY_METHODS = new Set(["map", "filter"]);
const ANY_ARG_ARRAY_METHODS = new Set(["concat"]);

const isEmptyArrayLiteralExpression = (expression: EsTreeNode): boolean => {
  const stripped = stripParenExpression(expression);
  return isNodeOfType(stripped, "ArrayExpression") && (stripped.elements ?? []).length === 0;
};

const isArrayProducingExpression = (expression: EsTreeNode): boolean => {
  const stripped = stripParenExpression(expression);
  if (isNodeOfType(stripped, "ArrayExpression")) return true;
  if (isNodeOfType(stripped, "NewExpression")) {
    return (
      isNodeOfType(stripped.callee, "Identifier") &&
      ARRAY_CONSTRUCTOR_NAMES.has(stripped.callee.name)
    );
  }
  if (isNodeOfType(stripped, "CallExpression")) {
    if (
      isNodeOfType(stripped.callee, "Identifier") &&
      ARRAY_CONSTRUCTOR_NAMES.has(stripped.callee.name)
    ) {
      return true;
    }
    if (
      isNodeOfType(stripped.callee, "MemberExpression") &&
      isNodeOfType(stripped.callee.property, "Identifier")
    ) {
      const methodName = stripped.callee.property.name;
      if (SINGLE_ARG_ARRAY_METHODS.has(methodName) && stripped.arguments.length === 1) {
        return true;
      }
      if (ANY_ARG_ARRAY_METHODS.has(methodName)) return true;
    }
    return false;
  }
  if (isNodeOfType(stripped, "LogicalExpression")) {
    // `value ?? []` / `value || []` — an empty array literal on
    // either side is a fallback that only allocates on the rare
    // null/undefined path. Short-circuit semantics mean `[]` isn't
    // evaluated when the other side is defined. Skip the empty side
    // and check the other; if NEITHER side is an empty fallback, the
    // expression always allocates an array somewhere (e.g.
    // `items={data ?? buildList()}` where `buildList()` is itself
    // array-producing), so check both sides.
    if (stripped.operator === "??" || stripped.operator === "||") {
      const leftIsEmptyFallback = isEmptyArrayLiteralExpression(stripped.left);
      const rightIsEmptyFallback = isEmptyArrayLiteralExpression(stripped.right);
      if (leftIsEmptyFallback) return isArrayProducingExpression(stripped.right);
      if (rightIsEmptyFallback) return isArrayProducingExpression(stripped.left);
    }
    return isArrayProducingExpression(stripped.left) || isArrayProducingExpression(stripped.right);
  }
  if (isNodeOfType(stripped, "ConditionalExpression")) {
    return (
      isArrayProducingExpression(stripped.consequent) ||
      isArrayProducingExpression(stripped.alternate)
    );
  }
  return false;
};

const followsRenderLocalArrayBinding = (
  expression: EsTreeNode,
  jsxAttribute: EsTreeNode,
): boolean => {
  const stripped = stripParenExpression(expression);
  if (!isNodeOfType(stripped, "Identifier")) return false;
  const binding = findVariableInitializer(stripped, stripped.name);
  if (!binding || !binding.initializer) return false;
  // Only flag if the binding's scope owner is also an ancestor of the
  // JSX attribute — i.e. the binding lives in the same render call.
  // Hoisted bindings (module-level / outside the render function) are
  // exempt because they aren't allocated per render.
  let walker: EsTreeNode | null = jsxAttribute;
  while (walker) {
    if (walker === binding.scopeOwner) {
      // Found the scope owner among JSX's ancestors — it's render-local
      // unless it IS the Program (module scope).
      if (binding.scopeOwner.type === "Program") return false;
      break;
    }
    walker = walker.parent ?? null;
  }
  return isArrayProducingExpression(binding.initializer);
};

// Port of `oxc_linter::rules::react_perf::jsx_no_new_array_as_prop`. Flags
// JSX prop values that allocate a new Array per render: `[]`,
// `new Array()`, `Array()`, `arr.concat(x)`, `arr.map(...)`, `arr.filter(...)`,
// and these wrapped in conditional / logical expressions. Top-level JSX
// (outside any function) is skipped — those allocations happen once.
//
// LIMITATION vs OXC: OXC additionally tracks identifier references and
// flags `let x = []; return <C list={x} />` (variable initialized inside
// a render scope). Without scope analysis we don't follow those refs;
// document and skip those tests.
export const jsxNoNewArrayAsProp = defineRule<Rule>({
  id: "jsx-no-new-array-as-prop",
  tags: ["react-jsx-only"],
  severity: "warn",
  // React Compiler auto-memoizes prop allocations. The perf footgun this
  // rule guards against doesn't exist in compiler-enabled projects.
  disabledBy: ["react-compiler"],
  recommendation: "Memoize the array (`useMemo`) or hoist it outside the component.",
  category: "Performance",
  create: (context) => {
    const isTestlikeFile = isTestlikeFilename(context.getFilename?.());
    let memoRegistry: Map<string, MemoStatus> | null = null;
    return {
      Program(node: EsTreeNodeOfType<"Program">) {
        memoRegistry = buildSameFileMemoRegistry(node as EsTreeNode);
      },
      JSXAttribute(node: EsTreeNodeOfType<"JSXAttribute">) {
        if (isTestlikeFile) return;
        // Intrinsic HTML elements aren't memoized; flagging inline
        // arrays on them is unactionable. See `jsx-no-new-function-as-prop`
        // for the full rationale.
        if (isJsxAttributeOnIntrinsicHtmlElement(node)) return;
        // Consumer-component memo-status: if the parent JSX element
        // is a plain function/arrow defined in this same file (no
        // memo/forwardRef/observer wrapper), the rule's "React.memo
        // bails" rationale doesn't apply — the parent re-renders
        // unconditionally on every prop change.
        const parentJsxOpening = node.parent;
        const openingName =
          parentJsxOpening && isNodeOfType(parentJsxOpening, "JSXOpeningElement")
            ? (parentJsxOpening.name as EsTreeNode)
            : null;
        if (memoStatusForJsxOpeningName(memoRegistry, openingName) === "not-memoised") return;
        // Data-collection slot props (`items`, `data`, `options`,
        // `tabs`, `*Items`, `*Options`, etc.) receive inline array
        // literals by convention — every list/table/menu/chart
        // component uses this pattern. The perf footgun the rule
        // targets is hot-path identity changes; these are one-time
        // configuration arrays.
        if (isNodeOfType(node.name, "JSXIdentifier") && isDataArrayPropName(node.name.name)) {
          return;
        }
        if (!isInsideFunctionScope(node)) return;
        const value = node.value;
        if (!value || !isNodeOfType(value, "JSXExpressionContainer")) return;
        const expression = value.expression;
        if (!expression || expression.type === "JSXEmptyExpression") return;
        const expressionNode = expression as EsTreeNode;
        if (
          !isArrayProducingExpression(expressionNode) &&
          !followsRenderLocalArrayBinding(expressionNode, node)
        ) {
          return;
        }
        context.report({ node, message: MESSAGE });
      },
    };
  },
});
