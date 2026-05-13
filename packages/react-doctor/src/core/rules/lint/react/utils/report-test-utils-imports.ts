import type { EsTreeNode } from "../../utils/index.js";
import type { RuleContext } from "../../utils/index.js";
import { buildTestUtilsMessage } from "./build-test-utils-message.js";
import { isNodeOfType } from "../../utils/index.js";

// HACK: React 19 removes `Component.defaultProps` for FUNCTION components
// (class components still tolerate it but the team recommends ES6
// default parameters anyway). Detection target: any
// `<Identifier>.defaultProps = <ObjectExpression>` assignment where the
// identifier looks like a component (uppercase first letter). We can't
// distinguish class vs function from the assignment alone, but the
// recommendation is the same either way - switch to ES6 default params
// in destructured props - so the guidance is uniform.

// HACK: companion to `noReact19DeprecatedApis` for the react-dom side
// of the React 19 migration. Catches the legacy root API (render /
// hydrate / unmountComponentAtNode) and findDOMNode. The whole
// `react-dom/test-utils` entry point is gone in 19; we flag every
// import from it and steer users to `act` from `react` plus
// `fireEvent` / `render` from @testing-library/react. Kept as a
// separate rule from `noReact19DeprecatedApis` so the per-source
// binding tracking stays simple - `react` and `react-dom` namespace
// imports never collide.
//
// Deliberately omitted: `useFormState`. It's the *current* correct API
// in React 18 (`react-dom`) - only renamed to `useActionState` and
// moved to `react` in 19. A whole-rule version gate (`>= 18`) can't
// distinguish "still on 18" from "should have migrated" inside the
// rule, so we drop the entry rather than false-positive on 18 code.

export const reportTestUtilsImports = (node: EsTreeNode, context: RuleContext): void => {
  for (const specifier of node.specifiers ?? []) {
    if (isNodeOfType(specifier, "ImportSpecifier")) {
      const importedName = specifier.imported?.name ?? "default";
      context.report({ node: specifier, message: buildTestUtilsMessage(importedName) });
      continue;
    }
    context.report({
      node: specifier,
      message:
        "react-dom/test-utils is removed in React 19. Use `act` from `react` and `fireEvent` / `render` from `@testing-library/react` instead",
    });
  }
};
