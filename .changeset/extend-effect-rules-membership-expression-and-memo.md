---
"react-doctor": patch
---

fix(react-doctor): widen `no-effect-event-handler` and split `no-derived-state-effect` message on memo-worthy derivations

Two detector improvements aligned with React's
["You Might Not Need an Effect"](https://react.dev/learn/you-might-not-need-an-effect)
guide. No new rule IDs.

**`no-effect-event-handler`** — the detector required the `if`'s test
to be a bare `Identifier`, so it missed the article's literal §5
example
([Sharing logic between event handlers](https://react.dev/learn/you-might-not-need-an-effect#sharing-logic-between-event-handlers)):

```tsx
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to the shopping cart!`);
  }
}, [product]);
```

The test predicate is now widened to walk a `MemberExpression` chain
down to its root identifier, so both `if (isOpen)` and
`if (product.isInCart)` are recognized when the root identifier
appears in the deps array.

**`no-derived-state-effect`** — the diagnostic message now branches
on whether the derivation is potentially expensive. A setter argument
that contains a user-defined `CallExpression` (e.g.
`setVisibleTodos(getFilteredTodos(todos, filter))`) gets the
[§2 _Caching expensive calculations_](https://react.dev/learn/you-might-not-need-an-effect#caching-expensive-calculations)
recommendation:

> Derived state in useEffect — wrap the calculation in
> `useMemo([deps])` (or compute it directly during render if it isn't
> expensive).

Pure data shaping like `firstName + " " + lastName` keeps the existing
"compute during render" message. Coercion / parsing helpers
(`Number`, `parseInt`, `Math.*`, `Boolean`, etc.) count as trivial.

As part of this change the detector switched to an AST-aware walker
that no longer over-counts the callee identifier of a
`CallExpression` or the static property name of a non-computed
`MemberExpression` as a "reactive value read" — these are
function references and static property names, not values that need
to be in the deps array. This also fixes a pre-existing
under-detection bug where derivations like
`setX(getDerivedValue(propA, propB))` would short-circuit the rule
because `getDerivedValue` (a stable module-scoped helper) wasn't in
deps.
