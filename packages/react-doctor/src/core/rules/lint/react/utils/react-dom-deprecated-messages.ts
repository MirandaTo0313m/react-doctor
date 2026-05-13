export const REACT_DOM_DEPRECATED_MESSAGES = new Map<string, string>([
  [
    "render",
    "ReactDOM.render is the legacy root API - switch to `import { createRoot } from 'react-dom/client'` and call `createRoot(container).render(...)` (REMOVED in React 19)",
  ],
  [
    "hydrate",
    "ReactDOM.hydrate is the legacy SSR API - switch to `import { hydrateRoot } from 'react-dom/client'` and call `hydrateRoot(container, <App />)` (REMOVED in React 19)",
  ],
  [
    "unmountComponentAtNode",
    "ReactDOM.unmountComponentAtNode no longer works on roots created with `createRoot` - keep a reference to the root and call `root.unmount()` instead (REMOVED in React 19)",
  ],
  [
    "findDOMNode",
    "ReactDOM.findDOMNode crawls the rendered tree and breaks composition - accept a ref directly and read `ref.current` (REMOVED in React 19)",
  ],
]);
