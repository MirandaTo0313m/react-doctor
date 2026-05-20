import { describe, expect, it } from "vite-plus/test";
import { Cause, Effect, Exit, Layer, Ref, Stream } from "effect";

import { Config } from "../src/config.js";
import { DeadCode } from "../src/dead-code.js";
import type { Diagnostic } from "../src/diagnostic-schema.js";
import { OxlintTimedOut, ReactDoctorError } from "../src/errors.js";
import { Files } from "../src/files.js";
import { LintPartialFailures, Linter } from "../src/linter.js";
import { Project } from "../src/project.js";
import { Reporter, ReporterCapture } from "../src/reporter.js";
import { runInspect } from "../src/run-inspect.js";
import { Score } from "../src/score.js";
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

const noReactProject: ProjectInfo = {
  ...stubProject,
  reactVersion: null,
  reactMajorVersion: null,
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

const baseInput = {
  directory: "/repo",
  includePaths: [] as ReadonlyArray<string>,
  customRulesOnly: false,
  respectInlineDisables: true,
  adoptExistingLintConfig: true,
  ignoredTags: new Set<string>(),
  outputSurface: "cli" as const,
  runDeadCode: false,
};

describe("runInspect (full orchestration)", () => {
  it("composes Project + Config + Linter + Reporter + Score and returns the merged result", async () => {
    const diagnostic = makeDiagnostic();

    const program = Effect.gen(function* () {
      const result = yield* runInspect(baseInput);
      const captured = yield* Ref.get(yield* ReporterCapture);
      return { result, captured };
    });

    const { result, captured } = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            Project.layerOf(stubProject),
            Config.layerOf({ config: null, resolvedDirectory: "/repo" }),
            DeadCode.layerOf([]),
            Files.layerInMemory(new Map()),
            Linter.layerOf([diagnostic]),
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
            Score.layerOf({ score: 87, label: "Good" }),
          ),
        ),
      ),
    );

    expect(result.project).toEqual(stubProject);
    expect(result.score).toEqual({ score: 87, label: "Good" });
    expect(result.diagnostics).toEqual([diagnostic]);
    expect(result.didLintFail).toBe(false);
    expect(captured.map((entry) => entry.rule)).toEqual([diagnostic.rule]);
  });

  it("folds a mid-stream ReactDoctorError into didLintFail without rejecting the orchestration", async () => {
    const failingLinter = Linter.of({
      lint: () =>
        Stream.fail(
          new ReactDoctorError({
            reason: new OxlintTimedOut({ timeoutMilliseconds: 60_000 }),
          }),
        ),
    });

    const result = await Effect.runPromise(
      runInspect(baseInput).pipe(
        Effect.provide(
          Layer.mergeAll(
            Project.layerOf(stubProject),
            Config.layerOf({ config: null, resolvedDirectory: "/repo" }),
            DeadCode.layerOf([]),
            Files.layerInMemory(new Map()),
            Layer.succeed(Linter, failingLinter),
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
            Score.layerOf(null),
          ),
        ),
      ),
    );

    expect(result.didLintFail).toBe(true);
    expect(result.lintFailureReason).toContain("oxlint did not return within");
    expect(result.diagnostics).toEqual([]);
    expect(result.score).toBeNull();
  });

  it("yields a tagged NoReactDependency reason when the discovered project has no React", async () => {
    const program = runInspect(baseInput);

    const exit = await Effect.runPromiseExit(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            Project.layerOf(noReactProject),
            Config.layerOf({ config: null, resolvedDirectory: "/repo" }),
            DeadCode.layerOf([]),
            Files.layerInMemory(new Map()),
            Linter.layerNoop,
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
            Score.layerOf(null),
          ),
        ),
      ),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const failure = Cause.squash(exit.cause);
      expect(failure).toBeInstanceOf(ReactDoctorError);
      if (failure instanceof ReactDoctorError) {
        expect(failure.reason._tag).toBe("NoReactDependency");
      }
    }
  });

  it("invokes beforeLint / afterLint hooks in order with the right arguments", async () => {
    const events: string[] = [];

    const program = runInspect(baseInput, {
      beforeLint: (project) =>
        Effect.sync(() => {
          events.push(`before:${project.projectName}`);
        }),
      afterLint: (didFail) =>
        Effect.sync(() => {
          events.push(`after:didFail=${String(didFail)}`);
        }),
    });

    await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            Project.layerOf(stubProject),
            Config.layerOf({ config: null, resolvedDirectory: "/repo" }),
            DeadCode.layerOf([]),
            Files.layerInMemory(new Map()),
            Linter.layerOf([]),
            LintPartialFailures.layerLive,
            Reporter.layerCapture,
            Score.layerOf(null),
          ),
        ),
      ),
    );

    expect(events).toEqual([`before:${stubProject.projectName}`, "after:didFail=false"]);
  });
});
