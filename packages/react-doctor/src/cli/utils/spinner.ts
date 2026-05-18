import ora, { type Ora } from "ora";
import { SPINNER_INDENT_CHARS } from "@react-doctor/core";
import { isSpinnerInteractive } from "./is-spinner-interactive.js";

let isSilent = false;
let forceStatic = false;

export const setSpinnerSilent = (silent: boolean): void => {
  isSilent = silent;
};

export const isSpinnerSilent = (): boolean => isSilent;

// Forces every spinner to use the static (no-animation) one-shot variant.
// Wired in from the `--no-spinner` CLI flag.
export const setSpinnerStatic = (staticOnly: boolean): void => {
  forceStatic = staticOnly;
};

export const isSpinnerStatic = (): boolean => forceStatic;

interface SpinnerHandle {
  succeed(displayText: string): void;
  fail(displayText: string): void;
}

const noopHandle: SpinnerHandle = Object.freeze({
  succeed: () => {},
  fail: () => {},
});

const createHandle = (instance: Ora): SpinnerHandle => {
  let didFinalize = false;
  return {
    succeed(displayText) {
      if (didFinalize) return;
      didFinalize = true;
      instance.succeed(displayText);
    },
    fail(displayText) {
      if (didFinalize) return;
      didFinalize = true;
      instance.fail(displayText);
    },
  };
};

export const spinner = (text: string) => ({
  start(): SpinnerHandle {
    if (isSilent) return noopHandle;

    // HACK: when the run isn't interactive we hand ora `isEnabled: false`
    // and skip the animation loop entirely. We also avoid calling
    // `start()` on the instance so it doesn't print a "- <text>"
    // placeholder line — only the final `succeed()` / `fail()` line is
    // emitted. This dodges the cursor-up + erase-line escape stream that
    // `log-update`-style rendering produces when stdout is a TTY but
    // `columns` is 0/undefined (issue #293: react-doctor pegging 99% CPU
    // inside Git pre-push hooks and under `script(1)`).
    const shouldAnimate = !forceStatic && isSpinnerInteractive();
    const instance = ora({
      text,
      indent: SPINNER_INDENT_CHARS,
      isEnabled: shouldAnimate,
    });
    if (shouldAnimate) instance.start();
    return createHandle(instance);
  },
});
