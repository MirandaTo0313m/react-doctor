import { describe, expect, it } from "vite-plus/test";
import { Effect, Layer, Ref } from "effect";

import { LintPartialFailures, Linter, type LintInput } from "../src/linter.js";
import { Reporter, ReporterCapture } from "../src/reporter.js";
import { runDiagnosticPipeline } from "../src/pipeline.js";
import type { Diagnostic } from "../src/diagnostic-schema.js";
import type { ProjectInfo } from "@react-doctor/types";

const stubProject: ProjectInfo = {
  rootDirectory: "/repo",
  projectName: "stub",
  reactVersion: "19.0.0",
  reactMajorVersion: 19,
  tailwindVersion: null,
  framework: "vite",
  hasTypeScript: true,
  hasReactCompiler: false,
  hasTanStackQuery: false,
  hasReactNativeWorkspace: false,
  sourceFileCount: 1,
};

const stubInput: LintInput = {
  rootDirectory: "/repo",
  project: stubProject,
};

const makeDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: "src/App.tsx",
  plugin: "react-doctor",
  rule: "no-secrets-in-client-code",
  severity: "error",
  message: "API key checked into client bundle",
  help: "Move the secret to server-only code",
  line: 1,
  column: 1,
  category: "Security",
  ...overrides,
});

describe("runDiagnosticPipeline (Stream-based, services swappable via Layer)", () => {
  it("streams every linter-emitted diagnostic through the reporter and folds counts in one pass", async () => {
    const diagnostics: ReadonlyArray<Diagnostic> = [
      makeDiagnostic({ severity: "error", line: 1 }),
      makeDiagnostic({ severity: "warning", line: 2 }),
      makeDiagnostic({ severity: "warning", line: 3 }),
    ];

    const program = Effect.gen(function* () {
      const counts = yield* runDiagnosticPipeline(stubInput);
      const captured = yield* Ref.get(yield* ReporterCapture);
      return { counts, captured };
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            Linter.layerOf(diagnostics),
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
          ),
        ),
      ),
    );

    expect(result.counts).toEqual({ errorCount: 1, warningCount: 2, totalCount: 3 });
    expect(result.captured.map((diagnostic) => diagnostic.line)).toEqual([1, 2, 3]);
  });

  it("honors a per-diagnostic `keep` predicate without materializing the full list", async () => {
    const diagnostics: ReadonlyArray<Diagnostic> = [
      makeDiagnostic({ rule: "weak-design-rule", category: "Design" }),
      makeDiagnostic({ rule: "use-stable-keys", category: "Correctness" }),
    ];

    const program = Effect.gen(function* () {
      const counts = yield* runDiagnosticPipeline(stubInput, {
        keep: (diagnostic) => diagnostic.category !== "Design",
      });
      const captured = yield* Ref.get(yield* ReporterCapture);
      return { counts, captured };
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            Linter.layerOf(diagnostics),
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
          ),
        ),
      ),
    );

    expect(result.counts.totalCount).toBe(1);
    expect(result.captured.map((diagnostic) => diagnostic.rule)).toEqual(["use-stable-keys"]);
  });

  it("emits zero diagnostics when the Linter is the noop layer (e.g. --no-lint)", async () => {
    const program = Effect.gen(function* () {
      const counts = yield* runDiagnosticPipeline(stubInput);
      const captured = yield* Ref.get(yield* ReporterCapture);
      return { counts, captured };
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(Linter.layerNoop, LintPartialFailures.layerLive, Reporter.layerCapture),
        ),
      ),
    );

    expect(result.counts).toEqual({ errorCount: 0, warningCount: 0, totalCount: 0 });
    expect(result.captured).toEqual([]);
  });
});
