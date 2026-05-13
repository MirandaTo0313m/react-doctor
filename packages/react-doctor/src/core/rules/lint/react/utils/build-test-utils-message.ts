import { REACT_DOM_TEST_UTILS_REPLACEMENTS } from "./react-dom-test-utils-replacements.js";

// HACK: legacy context (`childContextTypes` + `getChildContext` on
// providers, `contextTypes` on consumers) was deprecated in 16.3, warns
// in 18.3.1, and is REMOVED in 19. Migration is cross-file (provider +
// every consumer must be moved together) so flagging surface area early
// is high-leverage. We catch the static class-property forms AND the
// `Foo.contextTypes = {...}` shape - both styles appear in the wild,
// and missing one leaves silent gaps.

export const buildTestUtilsMessage = (importedName: string): string => {
  const replacement = REACT_DOM_TEST_UTILS_REPLACEMENTS.get(importedName);
  const replacementText = replacement
    ? `Use ${replacement}.`
    : "Switch to `act` from `react` or the equivalent in `@testing-library/react`.";
  return `react-dom/test-utils is removed in React 19. ${replacementText}`;
};
