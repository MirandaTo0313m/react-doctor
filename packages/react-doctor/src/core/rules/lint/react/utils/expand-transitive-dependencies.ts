// HACK: From "Separating Events from Effects" - when a function-typed
// prop (or local callback) is read from an effect ONLY inside a sub-
// handler (setTimeout / addEventListener / store.subscribe / etc.),
// listing it in the dep array forces the whole effect to re-synchronize
// every time its identity changes. The article's recommended fix is
// `useEffectEvent`, which is React 19+. The rule is registered as
// version-gated in `oxlint-config.ts` (USE_EFFECT_EVENT_MIN_MAJOR) so
// pre-19 projects don't see noisy diagnostics for an API they don't
// have.
//
//   function SearchInput({ onSearch }) {
//     const [query, setQuery] = useState('');
//     useEffect(() => {
//       const id = setTimeout(() => onSearch(query), 300);  // sub-handler
//       return () => clearTimeout(id);
//     }, [query, onSearch]);
//   }
//
// Detector pre-conditions (all must hold) - chosen to keep FPs near zero:
//   (1) useEffect with at least 2 dep array elements, all Identifiers
//   (2) at least one dep `F` is a function-shaped reactive value:
//         - a destructured prop named `on[A-Z]…`, OR
//         - a local declared via `const F = useCallback(...)`
//   (3) every read of `F` inside the effect body sits inside a sub-
//       handler (TIMER_AND_SCHEDULER_DIRECT_CALLEE_NAMES, OR a
//       MemberExpression whose property is in SUBSCRIPTION_METHOD_NAMES
//       - same set the prefer-use-sync-external-store family uses)
//   (4) `F` is NEVER read at the effect's own top level

export const expandTransitiveDependencies = (
  seedNames: Set<string>,
  dependencyGraph: Map<string, Set<string>>,
): Set<string> => {
  const reachable = new Set(seedNames);
  const queue: string[] = Array.from(seedNames);
  while (queue.length > 0) {
    const currentName = queue.pop();
    if (currentName === undefined) continue;
    const dependencyNames = dependencyGraph.get(currentName);
    if (!dependencyNames) continue;
    for (const dependencyName of dependencyNames) {
      if (reachable.has(dependencyName)) continue;
      reachable.add(dependencyName);
      queue.push(dependencyName);
    }
  }
  return reachable;
};
