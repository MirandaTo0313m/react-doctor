import { isNonInteractiveEnvironment } from "./is-non-interactive-environment.js";

// Returns true only when `process.stdout` looks safe to drive an animated
// `ora` spinner.
//
// `ora`'s built-in `isInteractive` check only consults `stream.isTTY`,
// `TERM`, and the `CI` env var. That misses two non-interactive contexts
// where stdout is still a TTY:
//
//   1. Child processes launched under `script(1)` or a Git `pre-push` hook
//      (lefthook/husky). The parent TTY is inherited but
//      `process.stdout.columns` can be `0` or `undefined`. Ora's render
//      loop then computes `Math.ceil(width / 0) === Infinity` lines and
//      emits an unbounded stream of `\x1b[1A\x1b[0K` (cursor-up + erase
//      line) escapes, pegging a core at 99% CPU and never terminating
//      (issue #293).
//   2. Other CI-ish env vars (`GITHUB_ACTIONS`, `GITLAB_CI`,
//      `BUILDKITE`, etc.) and agent shells (`CURSOR_AGENT`,
//      `CLAUDECODE`) where animation has no consumer.
//
// `NO_SPINNER` is offered as an explicit per-invocation escape hatch.
export const isSpinnerInteractive = (): boolean => {
  if (process.stdout.isTTY !== true) return false;
  const columnCount = process.stdout.columns;
  if (!columnCount || columnCount <= 0) return false;
  if (process.env.TERM === "dumb") return false;
  if (process.env.NO_SPINNER) return false;
  if (isNonInteractiveEnvironment()) return false;
  return true;
};
