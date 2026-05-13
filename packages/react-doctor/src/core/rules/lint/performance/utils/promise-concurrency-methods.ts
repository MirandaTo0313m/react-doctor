// HACK: `await Promise.all(items.map(async item => { await fetch(item); }))`
// is the canonical PARALLEL-async pattern - not a bug. The async callbacks
// produce an array of promises that `Promise.all` (and friends) await
// concurrently. Don't flag `.map` (or `.flatMap`) when its result flows
// directly into one of the concurrency combinators. We only recognise
// direct member calls (`Promise.all(...)`) since that's how 99% of code
// writes it; `Promise["all"](...)` etc. are rare enough to accept.

export const PROMISE_CONCURRENCY_METHODS = new Set(["all", "allSettled", "race", "any"]);
