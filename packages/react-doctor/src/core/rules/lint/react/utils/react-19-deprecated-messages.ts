export const REACT_19_DEPRECATED_MESSAGES = new Map<string, string>([
  [
    "forwardRef",
    "forwardRef is no longer needed on React 19+ - refs are regular props on function components; remove forwardRef and pass ref directly",
  ],
  [
    "useContext",
    "useContext is superseded by `use()` on React 19+ - `use()` reads context conditionally inside hooks, branches, and loops; switch to `import { use } from 'react'`",
  ],
]);
