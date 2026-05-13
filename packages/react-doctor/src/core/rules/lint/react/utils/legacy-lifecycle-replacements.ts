export const LEGACY_LIFECYCLE_REPLACEMENTS = new Map<string, string>([
  [
    "componentWillMount",
    "Move side effects to `componentDidMount`; move initial state to `constructor`",
  ],
  [
    "componentWillReceiveProps",
    "Move side effects to `componentDidUpdate` (compare prevProps); move pure state derivation to the static `getDerivedStateFromProps`",
  ],
  [
    "componentWillUpdate",
    "Move DOM reads to `getSnapshotBeforeUpdate` (passes the value to `componentDidUpdate`); move other work to `componentDidUpdate`",
  ],
]);
