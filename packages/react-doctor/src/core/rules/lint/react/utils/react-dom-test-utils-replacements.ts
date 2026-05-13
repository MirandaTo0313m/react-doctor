export const REACT_DOM_TEST_UTILS_REPLACEMENTS = new Map<string, string>([
  ["act", "`import { act } from 'react'` instead"],
  ["Simulate", "`fireEvent` from `@testing-library/react` instead"],
  ["renderIntoDocument", "`render` from `@testing-library/react` instead"],
  ["findRenderedDOMComponentWithTag", "`getByRole` / `getByTestId` from `@testing-library/react`"],
  ["findRenderedDOMComponentWithClass", "`getByRole` or `container.querySelector` from RTL"],
  ["scryRenderedDOMComponentsWithTag", "`getAllByRole` from `@testing-library/react`"],
]);
