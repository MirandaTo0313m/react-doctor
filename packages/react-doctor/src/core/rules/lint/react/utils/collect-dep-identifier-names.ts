import type { EsTreeNode } from "../../utils/index.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: §6 of "You Might Not Need an Effect" - sending a POST request:
//
//   const [jsonToSubmit, setJsonToSubmit] = useState(null);
//   useEffect(() => {
//     if (jsonToSubmit !== null) {
//       post('/api/register', jsonToSubmit);
//     }
//   }, [jsonToSubmit]);
//
//   function handleSubmit(event) {
//     event.preventDefault();
//     setJsonToSubmit({ firstName, lastName });   // ← only writer
//   }
//
// Detector pre-conditions (all must hold):
//   (1) useEffect with deps = [stateX] - single dep that's a useState
//       binding declared in this component
//   (2) effect body is a single IfStatement guarding on stateX with one
//       of: bare truthy, !== null/undefined, === Literal, or .length
//   (3) IfStatement.consequent contains a CallExpression whose callee
//       is in EVENT_TRIGGERED_SIDE_EFFECT_CALLEES OR a MemberExpression
//       whose property is in EVENT_TRIGGERED_SIDE_EFFECT_MEMBER_METHODS
//   (4) every setStateX call site is inside a JSX `on*` handler (or a
//       function bound to one) - i.e. the trigger is set only by user
//       interactions, never by other reactive logic
//
// Why all four matter: (1) + (2) recognize the "trigger guard" shape;
// (3) restricts to side effects users would associate with a button
// click; (4) is the strongest signal that the state exists *only* to
// schedule the effect, distinguishing this from §5 (event-shared logic
// triggered by props) which already has its own rule.
// HACK: in JS, `undefined` is parsed as an Identifier (not a Literal
// like `null`). For `x !== undefined`, both sides of the
// BinaryExpression are Identifiers, so a naive "first Identifier
// wins" pick can return `"undefined"` instead of the trigger state
// name - silently dropping the violation for the reversed
// (`undefined !== x`) ordering. Skip the `undefined` / `null`
// sentinel side so the actual state Identifier is what we return.

export const collectDepIdentifierNames = (effectNode: EsTreeNode): Set<string> => {
  const depNames = new Set<string>();
  const depsNode = effectNode.arguments?.[1];
  if (!isNodeOfType(depsNode, "ArrayExpression")) return depNames;
  for (const element of depsNode.elements ?? []) {
    if (isNodeOfType(element, "Identifier")) depNames.add(element.name);
  }
  return depNames;
};
