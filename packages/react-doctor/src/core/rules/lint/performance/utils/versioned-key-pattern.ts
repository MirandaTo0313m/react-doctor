// HACK: keys that store JSON-serialized objects in localStorage /
// sessionStorage live forever and often outlast the JavaScript that
// wrote them. When you change the stored shape (rename a field, switch
// encoding, etc.), old code in existing browsers reads the new format
// and either crashes or silently loses data. Versioning the key
// (`prefs:v1`, `cache@1`, etc.) means a schema change just reads from a
// new key, leaving the old one to either migrate cleanly or be ignored.
//
// Heuristic: flag only when the *value* is a `JSON.stringify(...)` call
// - those are the cases where schema versioning matters. Simple flags
// like `setItem("count", "5")` don't need versioning and would be noise.

export const VERSIONED_KEY_PATTERN = /(?:[._:-]v\d+|@\d+|\bv\d+\b)/i;
