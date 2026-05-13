You are working in `/Users/aidenybai/Developer/react-doctor`.

Use the strongest available model for this task. This must be a one-shot, end-to-end validation run. Do not stop after partial progress.

Goal:
Deeply validate `react-doctor-v2` against the GitHub repos listed below. Clone them into tmp, run v2, inspect every diagnostic, classify true positives / false positives / borderline findings, look for missed issues, and write durable reports to disk.

Repos:

- <owner/repo>
- <owner/repo>

Why this needs subagents:
This task is too large for one context if done honestly. Spawn parallel subagents so each repo can be investigated deeply without losing detail. Every subagent must write its findings to files, not just summarize in chat, so the parent agent can merge, verify, and resume if needed.

Use these repo paths as source of truth:

- CLI: `packages/react-doctor-v2/bin/react-doctor.js`
- Rule registry: `packages/react-doctor-v2/src/core/rules/lint/rules.ts`
- Rule metadata: `packages/react-doctor-v2/src/core/rules/lint/metadata.ts`
- Rule enablement/filtering: `packages/react-doctor-v2/src/core/rules/lint/config.ts`
- Existing validation examples:
  - `v2-react-grab-validation-report.md`
  - `v2-expect-validation-report.md`

Setup:

1. Build `react-doctor-v2`.
2. Clone every target repo into `/tmp/react-doctor-v2-validation/repos/<owner>__<repo>`.
3. Record each repo's exact commit SHA.
4. Run:
   `node packages/react-doctor-v2/bin/react-doctor.js <repo-path> --json --json-compact --offline --yes --full --no-dead-code --fail-on none`
5. Save raw JSON output to:
   `/tmp/react-doctor-v2-validation/raw/<owner>__<repo>.json`

Subagent plan:

- Spawn one repo-validation subagent per repo, in parallel when possible.
- Each repo subagent must:
  - Read the raw JSON diagnostics.
  - Inspect every referenced source file and line.
  - Cross-check the relevant rule implementation before calling anything a false positive.
  - Group repeated duplicate findings only when they are genuinely the same pattern, and still inspect representative concrete instances.
  - Look for missed issues covered by the existing rule list.
  - Write a markdown report to:
    `/tmp/react-doctor-v2-validation/reports/<owner>__<repo>.md`
  - Write structured findings to:
    `/tmp/react-doctor-v2-validation/findings/<owner>__<repo>.json`

Finding schema:

```json
{
  "repo": "owner/repo",
  "commit": "sha",
  "ruleId": "react-doctor/rule-name",
  "file": "relative/path.tsx",
  "line": 123,
  "verdict": "TP | FP | Borderline | Missed Issue",
  "confidence": "high | medium | low",
  "reason": "Specific explanation based on the code context.",
  "ruleImplementationChecked": "packages/react-doctor-v2/src/core/rules/lint/.../rule.ts",
  "recommendation": "Keep rule | improve rule logic | improve project/framework detection | improve ignore/generated-file handling | add missing detection",
  "solutionRationale": "Explain why this is a principled fix and not a narrow workaround."
}
```

Classification rules:

- `TP`: real, actionable issue.
- `FP`: the rule is wrong for this code context.
- `Borderline`: technically valid but likely low-value, intentional, test-only, generated, static, or context-dependent.
- `Missed Issue`: an obvious issue in the repo that should have been caught by one of the existing lint rules but was not.

Solution quality rules:

- Recommended fixes must be principled changes to rule logic, framework detection, project detection, generated-file handling, or the documented rule contract.
- Do not propose prompt-only fixes, instruction hacks, score manipulation, blanket disables, repo-specific allowlists, or one-off line/file exceptions as the final solution.
- Do not solve false positives by weakening a rule until it stops finding real issues. Preserve true positives and make the rule more precise.
- A context skip is only acceptable when it generalizes across a real category, such as generated files, non-React TSX, test fixtures, framework-specific APIs, or server-only/client-only environments. Explain the invariant that makes the skip safe.
- Every proposed fix must name the rule file or detection module that should change and include a short reason why that fix addresses the root cause.

Parent agent responsibilities:

1. Wait for all repo subagents to finish.
2. Read every markdown and JSON report from disk.
3. Merge them into:
   `v2-deep-validation-report.md`
4. Include:
   - repo list and commit SHAs
   - command used
   - total diagnostics per repo
   - TP / FP / Borderline / Missed Issue counts
   - top false-positive categories
   - rule-by-rule reliability notes
   - concrete recommended fixes with rule file paths
5. Also write:
   `v2-deep-validation-findings.json`
   containing the combined structured findings.

Important:
Do not rely on scores. Do not only inspect top rules. Do not do incremental or shallow validation. Actually open the code behind each diagnostic. Keep going until every repo and every diagnostic has been investigated or explicitly grouped with a justified reason.
