// HACK: From "Lifecycle of Reactive Effects":
//
//   "Each Effect describes a separate synchronization process. When
//    the component is removed, your Effect needs to stop synchronizing.
//    The cleanup function should stop or undo whatever the Effect was
//    doing."
//
// An effect that adds a listener / subscribes / sets a timer but
// returns no cleanup leaks memory and triggers React's "you forgot
// to clean up an effect" StrictMode hint at runtime. We flag it
// statically. Three subscribe-shaped families:
//   - addEventListener (browser DOM, EventTarget-shaped libs)
//   - subscribe / addListener / on / watch / listen / sub
//   - setInterval / setTimeout (without explicit clear)
//
// The subscribe / unsubscribe method allowlists live in `constants.ts`
// (`SUBSCRIPTION_METHOD_NAMES`, `UNSUBSCRIPTION_METHOD_NAMES`) so the
// cleanup-needed detector and the prefer-use-sync-external-store
// detector share a single source of truth. Inline duplicates would
// silently drift out of sync as new library shapes get added.

export const SENTINEL_IDENTIFIER_NAMES = new Set(["undefined", "NaN", "null"]);
