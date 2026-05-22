import { defineRule } from "../../utils/define-rule.js";
import type { EsTreeNodeOfType } from "../../utils/es-tree-node-of-type.js";
import { isNodeOfType } from "../../utils/is-node-of-type.js";
import { isSetStateCallInLifecycle } from "../../utils/is-set-state-in-lifecycle.js";
import type { Rule } from "../../utils/rule.js";

const LIFECYCLE_NAMES = new Set(["componentDidMount"]);
const MESSAGE = "Do not use `this.setState` in `componentDidMount`.";

interface NoDidMountSetStateSettings {
  mode?: "allowed" | "disallow-in-func";
}

const resolveSettings = (
  settings: Readonly<Record<string, unknown>> | undefined,
): Required<NoDidMountSetStateSettings> => {
  const reactDoctor = settings?.["react-doctor"];
  const ruleSettings =
    typeof reactDoctor === "object" && reactDoctor !== null
      ? ((reactDoctor as { noDidMountSetState?: NoDidMountSetStateSettings }).noDidMountSetState ??
        {})
      : {};
  return { mode: ruleSettings.mode ?? "allowed" };
};

// Port of `oxc_linter::rules::react::no_did_mount_set_state`. Flags
// `this.setState(...)` directly inside a `componentDidMount` lifecycle
// (default), or inside any nested function within `componentDidMount`
// when `mode: "disallow-in-func"`.
export const noDidMountSetState = defineRule<Rule>({
  id: "no-did-mount-set-state",
  severity: "warn",
  recommendation:
    "Move state-derivation logic into `getDerivedStateFromProps` or initial state — setting state in `componentDidMount` triggers an extra render.",
  create: (context) => {
    const { mode } = resolveSettings(context.settings);
    return {
      CallExpression(node: EsTreeNodeOfType<"CallExpression">) {
        if (!isNodeOfType(node.callee, "MemberExpression")) return;
        if (!isNodeOfType(node.callee.object, "ThisExpression")) return;
        if (
          !isNodeOfType(node.callee.property, "Identifier") ||
          node.callee.property.name !== "setState"
        ) {
          return;
        }
        const shouldFlag = isSetStateCallInLifecycle(node, LIFECYCLE_NAMES, {
          disallowInNestedFunctions: mode === "disallow-in-func",
        });
        if (!shouldFlag) return;
        context.report({ node: node.callee, message: MESSAGE });
      },
    };
  },
});
