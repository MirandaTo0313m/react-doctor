import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  buildBaselineFile,
  fingerprintDiagnostic,
  partitionDiagnosticsByBaseline,
  readBaselineFile,
  resolveBaselineSettings,
  writeBaselineFile,
} from "@react-doctor/core";
import type { Diagnostic } from "@react-doctor/types";

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rd-baseline-"));

afterAll(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

const buildDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: path.join(projectRoot, "src/App.tsx"),
  plugin: "react-doctor",
  rule: "no-array-index-as-key",
  severity: "error",
  message: "Array index used as React key",
  help: "",
  line: 12,
  column: 4,
  category: "Correctness",
  ...overrides,
});

describe("fingerprintDiagnostic", () => {
  it("is stable across runs for an identical diagnostic", () => {
    const diagnostic = buildDiagnostic();
    expect(fingerprintDiagnostic(diagnostic, projectRoot)).toBe(
      fingerprintDiagnostic(diagnostic, projectRoot),
    );
  });

  it("ignores line/column drift so unrelated edits don't break the baseline", () => {
    const original = buildDiagnostic({ line: 12 });
    const shifted = buildDiagnostic({ line: 99 });
    expect(fingerprintDiagnostic(original, projectRoot)).toBe(
      fingerprintDiagnostic(shifted, projectRoot),
    );
  });

  it("differs across plugin/rule/file/message", () => {
    const baseDiagnostic = buildDiagnostic();
    const differentRule = buildDiagnostic({ rule: "no-direct-state-mutation" });
    const differentFile = buildDiagnostic({ filePath: path.join(projectRoot, "src/Other.tsx") });
    const differentMessage = buildDiagnostic({ message: "Different signal" });
    const fingerprintBase = fingerprintDiagnostic(baseDiagnostic, projectRoot);
    expect(fingerprintDiagnostic(differentRule, projectRoot)).not.toBe(fingerprintBase);
    expect(fingerprintDiagnostic(differentFile, projectRoot)).not.toBe(fingerprintBase);
    expect(fingerprintDiagnostic(differentMessage, projectRoot)).not.toBe(fingerprintBase);
  });

  it("normalizes absolute / relative + windows / posix file paths", () => {
    const relativeDiagnostic = buildDiagnostic({ filePath: "src/App.tsx" });
    const absoluteDiagnostic = buildDiagnostic({
      filePath: path.join(projectRoot, "src/App.tsx"),
    });
    expect(fingerprintDiagnostic(relativeDiagnostic, projectRoot)).toBe(
      fingerprintDiagnostic(absoluteDiagnostic, projectRoot),
    );
  });
});

describe("baseline read/write round-trip", () => {
  let baselinePath: string;
  beforeEach(() => {
    baselinePath = path.join(projectRoot, `baseline-${Date.now()}-${Math.random()}.json`);
  });

  it("writes a baseline and reads it back identically", () => {
    const diagnostics = [
      buildDiagnostic(),
      buildDiagnostic({ rule: "no-direct-state-mutation", line: 5 }),
    ];
    const baseline = buildBaselineFile(diagnostics, projectRoot);
    writeBaselineFile(baselinePath, baseline);
    const reread = readBaselineFile(baselinePath);
    expect(reread).not.toBeNull();
    expect(Object.keys(reread!.diagnostics)).toHaveLength(2);
  });

  it("returns null for a missing baseline file", () => {
    expect(readBaselineFile(path.join(projectRoot, "does-not-exist.json"))).toBeNull();
  });

  it("returns null for an invalid baseline file", () => {
    fs.writeFileSync(baselinePath, "{}");
    expect(readBaselineFile(baselinePath)).toBeNull();
  });
});

describe("partitionDiagnosticsByBaseline", () => {
  it("separates known baseline diagnostics from new ones", () => {
    const known = buildDiagnostic({ rule: "no-array-index-as-key" });
    const otherKnown = buildDiagnostic({ rule: "no-direct-state-mutation", message: "Other" });
    const baseline = buildBaselineFile([known, otherKnown], projectRoot);
    const incoming = [
      known,
      buildDiagnostic({ rule: "no-array-index-as-key", line: 200 }),
      buildDiagnostic({ rule: "no-effect-chain", message: "Newly introduced" }),
    ];
    const partition = partitionDiagnosticsByBaseline(incoming, baseline, projectRoot);
    expect(partition.baselineDiagnostics).toHaveLength(2);
    expect(partition.newDiagnostics).toHaveLength(1);
    expect(partition.newDiagnostics[0].rule).toBe("no-effect-chain");
  });
});

describe("resolveBaselineSettings", () => {
  it("defaults to disabled when neither config nor CLI flag is set", () => {
    const resolved = resolveBaselineSettings(null, undefined, projectRoot);
    expect(resolved.enabled).toBe(false);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "react-doctor-baseline.json"));
  });

  it("enables baseline mode when the CLI flag is true", () => {
    const resolved = resolveBaselineSettings(null, true, projectRoot);
    expect(resolved.enabled).toBe(true);
  });

  it("honors a string CLI flag as the baseline file path", () => {
    const resolved = resolveBaselineSettings(null, "custom/path.json", projectRoot);
    expect(resolved.enabled).toBe(true);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "custom/path.json"));
  });

  it("treats a boolean `true` config as enabled with the default path", () => {
    const resolved = resolveBaselineSettings({ baseline: true }, undefined, projectRoot);
    expect(resolved.enabled).toBe(true);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "react-doctor-baseline.json"));
  });

  it("falls back to the default file when baseline.path is an empty string", () => {
    const resolved = resolveBaselineSettings({ baseline: { path: "" } }, undefined, projectRoot);
    expect(resolved.enabled).toBe(true);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "react-doctor-baseline.json"));
  });

  it("falls back to the default file when the CLI flag is an empty string", () => {
    const resolved = resolveBaselineSettings(null, "", projectRoot);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "react-doctor-baseline.json"));
  });

  it("preserves config showBaselineMatches even when the CLI flag is also passed", () => {
    // CLI --baseline only overrides enabled / path; display-only fields
    // like showBaselineMatches have no CLI equivalent and should be
    // sourced from the config object regardless of which surface
    // triggered enabled.
    const resolved = resolveBaselineSettings(
      { baseline: { showBaselineMatches: true } },
      true,
      projectRoot,
    );
    expect(resolved.enabled).toBe(true);
    expect(resolved.showBaselineMatches).toBe(true);
  });

  it("reads showBaselineMatches from a baseline config object", () => {
    const resolved = resolveBaselineSettings(
      { baseline: { path: "qa.json", showBaselineMatches: true } },
      undefined,
      projectRoot,
    );
    expect(resolved.enabled).toBe(true);
    expect(resolved.showBaselineMatches).toBe(true);
    expect(resolved.filePath).toBe(path.resolve(projectRoot, "qa.json"));
  });

  it("lets the CLI flag override the config setting", () => {
    const resolved = resolveBaselineSettings({ baseline: false }, true, projectRoot);
    expect(resolved.enabled).toBe(true);
  });
});
