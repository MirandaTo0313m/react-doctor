// Reads OXC's `role_supports_aria_props.rs` and emits a TypeScript
// table mapping each ARIA role to the set of ARIA-* props it supports.
// Re-run when the OXC source changes:
//   pnpm gen:role-aria-props
//
// Produces: src/plugin/constants/role-supports-aria-props.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const OXC_SOURCE = "/tmp/oxc/crates/oxc_linter/src/rules/jsx_a11y/role_supports_aria_props.rs";

const ARIA_PROPERTY_TO_ATTR = {
  ActiveDescendant: "aria-activedescendant",
  Atomic: "aria-atomic",
  AutoComplete: "aria-autocomplete",
  Busy: "aria-busy",
  Checked: "aria-checked",
  ColCount: "aria-colcount",
  ColIndex: "aria-colindex",
  ColSpan: "aria-colspan",
  Controls: "aria-controls",
  Current: "aria-current",
  DescribedBy: "aria-describedby",
  Description: "aria-description",
  Details: "aria-details",
  Disabled: "aria-disabled",
  DropEffect: "aria-dropeffect",
  ErrorMessage: "aria-errormessage",
  Expanded: "aria-expanded",
  FlowTo: "aria-flowto",
  Grabbed: "aria-grabbed",
  HasPopup: "aria-haspopup",
  Hidden: "aria-hidden",
  Invalid: "aria-invalid",
  KeyShortcuts: "aria-keyshortcuts",
  Label: "aria-label",
  LabelledBy: "aria-labelledby",
  Level: "aria-level",
  Live: "aria-live",
  Modal: "aria-modal",
  Multiline: "aria-multiline",
  MultiSelectable: "aria-multiselectable",
  Orientation: "aria-orientation",
  Owns: "aria-owns",
  Placeholder: "aria-placeholder",
  PosInSet: "aria-posinset",
  Pressed: "aria-pressed",
  ReadOnly: "aria-readonly",
  Relevant: "aria-relevant",
  Required: "aria-required",
  RoleDescription: "aria-roledescription",
  RowCount: "aria-rowcount",
  RowIndex: "aria-rowindex",
  RowSpan: "aria-rowspan",
  Selected: "aria-selected",
  SetSize: "aria-setsize",
  Sort: "aria-sort",
  ValueMax: "aria-valuemax",
  ValueMin: "aria-valuemin",
  ValueNow: "aria-valuenow",
  ValueText: "aria-valuetext",
  BrailleLabel: "aria-braillelabel",
  BrailleRoleDescription: "aria-brailleroledescription",
  Colindextext: "aria-colindextext",
  Rowindextext: "aria-rowindextext",
};

const source = fs.readFileSync(OXC_SOURCE, "utf8");

// Parse `const NAME_PROPS: &[AriaProperty] = &[ AriaProperty::X, … ];`
const constPropMap = new Map();
for (const match of source.matchAll(
  /const\s+([A-Z_]+):\s*&\[AriaProperty\]\s*=\s*&\[([^\]]+)\];/g,
)) {
  const constName = match[1];
  const body = match[2];
  const variants = [...body.matchAll(/AriaProperty::([A-Za-z]+)/g)].map((m) => m[1]);
  const attrs = variants
    .map((v) => ARIA_PROPERTY_TO_ATTR[v])
    .filter((value) => value !== undefined);
  constPropMap.set(constName, attrs);
}

// Parse `match role_value { ... }`. Find every `"role"|"role"|... =>
// CONSTNAME.contains(...)` line.
const matchStartIndex = source.indexOf("match role_value {");
const matchEndIndex = source.indexOf(
  '_ => unreachable!("role value is not valid"),',
  matchStartIndex,
);
const matchBody = source.slice(matchStartIndex, matchEndIndex);

// Split by `=> ` then re-attach prefixes. Better: regex out each arm
// where prefix is everything between previous `=> EXPR,` and next
// `=> EXPR,`. Easier: iterate `=> CONST.contains` / `=> false` and
// look BACKWARD for the role-string list.
const roleToConst = new Map();
const falseRoles = new Set();
const armPattern = /=>\s*(?:([A-Z_]+)\.contains\([^)]*\)|(false))/g;
let lastEndIndex = 0;
let armMatch;
while ((armMatch = armPattern.exec(matchBody)) !== null) {
  const armPrefix = matchBody.slice(lastEndIndex, armMatch.index);
  // The part before this arm includes the previous arm's body. We
  // want only the strings AFTER the previous comma (or the start).
  const lastComma = armPrefix.lastIndexOf(",");
  const rolesSlice = armPrefix.slice(lastComma + 1);
  const roleNames = [...rolesSlice.matchAll(/"([\w-]+)"/g)].map((m) => m[1]);
  if (armMatch[1]) {
    for (const role of roleNames) roleToConst.set(role, armMatch[1]);
  } else {
    for (const role of roleNames) falseRoles.add(role);
  }
  lastEndIndex = armPattern.lastIndex;
}

const roleToProps = {};
for (const [role, constName] of roleToConst.entries()) {
  const list = constPropMap.get(constName);
  if (!list) {
    console.warn(`Missing constant ${constName} for role ${role}`);
    continue;
  }
  roleToProps[role] = list;
}
for (const role of falseRoles) roleToProps[role] = [];

const sortedRoles = Object.keys(roleToProps).sort();
const lines = sortedRoles.map(
  (role) => `  "${role}": new Set([${roleToProps[role].map((p) => `"${p}"`).join(", ")}])`,
);
const output = `// GENERATED — do not edit by hand. Run \`pnpm gen:role-aria-props\`.
// Mirrors OXC's \`is_valid_aria_property_for_role\` table from
// \`oxc_linter::rules::jsx_a11y::role_supports_aria_props\`.

export const ROLE_SUPPORTS_ARIA_PROPS: Record<string, ReadonlySet<string>> = {
${lines.join(",\n")}
};
`;

fs.writeFileSync(
  path.join(PACKAGE_ROOT, "src/plugin/constants/role-supports-aria-props.ts"),
  output,
);
console.log(`Wrote role-supports-aria-props.ts (${sortedRoles.length} roles).`);
