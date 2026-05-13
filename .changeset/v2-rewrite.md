---
"react-doctor": minor
---

v2 rewrite: SDK-first surface (`react-doctor` exports the SDK; the legacy
`diagnose()` shape lives at `react-doctor/api`). Adds a new
`react-doctor/score` subpath. Drops the `react-doctor/browser-poc` export
and the install-skill flow's `agent-install` runtime dependency.
