import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import path from "node:path";
import { render } from "ink-testing-library";
import { DashboardView } from "../src/components/dashboard-view.js";
import { ReviewView } from "../src/components/review-view.js";
import { Header } from "../src/components/header.js";
import { ProgressChecklist } from "../src/components/progress-checklist.js";
import { ScoreGauge } from "../src/components/score-gauge.js";
import { DoctorFace } from "../src/components/doctor-face.js";
import { buildInitialState } from "../src/store.js";
import type { AppState, GroupedRule } from "../src/types.js";
import type { Diagnostic, ProjectInfo } from "react-doctor/api";

const SAMPLE_PROJECT: ProjectInfo = {
  rootDirectory: "/repo",
  projectName: "demo",
  reactVersion: "19.2.0",
  framework: "nextjs",
  hasTypeScript: true,
  hasReactCompiler: true,
  hasTanStackQuery: true,
  sourceFileCount: 42,
};

const buildDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: path.join(SAMPLE_PROJECT.rootDirectory, "src/App.tsx"),
  plugin: "react-doctor",
  rule: "no-fetch-in-effect",
  severity: "warning",
  message: "Avoid fetch inside useEffect.",
  help: "Use a data-fetching library.",
  line: 14,
  column: 1,
  category: "state-effects",
  ...overrides,
});

const populatedState = (): AppState => {
  const baseState = buildInitialState("/repo");
  const groupedRule: GroupedRule = {
    ruleKey: "react-doctor/no-fetch-in-effect",
    plugin: "react-doctor",
    rule: "no-fetch-in-effect",
    severity: "error",
    category: "state-effects",
    message: "Avoid fetch inside useEffect.",
    help: "Use a data-fetching library.",
    diagnostics: [buildDiagnostic({ severity: "error" }), buildDiagnostic({ line: 99 })],
  };
  const populated: AppState = {
    ...baseState,
    project: SAMPLE_PROJECT,
    scanStatus: "complete",
    score: { score: 78, label: "Great" },
    previousScore: { score: 72, label: "Needs work" },
    diagnostics: groupedRule.diagnostics,
    filteredDiagnostics: groupedRule.diagnostics,
    groupedRules: [groupedRule],
    selectedRuleIndex: 0,
    selectedSiteIndex: 0,
    lastScanElapsedMs: 1234,
    scanCount: 1,
    isOffline: false,
    scoreHistory: [
      { score: 60, diagnosticCount: 12, timestamp: 1 },
      { score: 72, diagnosticCount: 9, timestamp: 2 },
      { score: 78, diagnosticCount: 6, timestamp: 3 },
    ],
  };
  return populated;
};

describe("Ink components render without throwing", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Header with project metadata", () => {
    const { lastFrame } = render(
      <Header rootDirectory="/repo" project={SAMPLE_PROJECT} isWatching />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("React Doctor");
    expect(frame).toContain("demo");
    expect(frame).toContain("Next.js");
    expect(frame).toContain("watching");
  });

  it("renders the DoctorFace without crashing under animation", () => {
    const { lastFrame, unmount } = render(<DoctorFace mood="great" isAnimating />);
    expect(lastFrame()).toContain("┌─────┐");
    unmount();
  });

  it("renders the ScoreGauge with delta, history, and bar segments", () => {
    const { lastFrame } = render(
      <ScoreGauge
        score={82}
        label="Great"
        previousScore={75}
        isOffline={false}
        history={[
          { score: 60, diagnosticCount: 1, timestamp: 1 },
          { score: 75, diagnosticCount: 1, timestamp: 2 },
          { score: 82, diagnosticCount: 1, timestamp: 3 },
        ]}
      />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("/ 100");
    expect(frame).toMatch(/Great/);
    expect(frame).toContain("history");
  });

  it("renders ProgressChecklist with mixed step statuses", () => {
    const { lastFrame } = render(
      <ProgressChecklist
        steps={[
          { id: "framework", message: "Detecting framework", status: "succeed", detail: "Vite" },
          { id: "lint", message: "Running lint checks", status: "running" },
          { id: "score", message: "Calculating score", status: "pending" },
        ]}
      />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Detecting framework");
    expect(frame).toContain("Running lint checks");
  });

  it("renders the dashboard for a populated state", () => {
    const { lastFrame, unmount } = render(<DashboardView state={populatedState()} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("error");
    expect(frame).toContain("warning");
    expect(frame).toMatch(/scan #1/);
    unmount();
  });

  it("renders the review master/detail layout for a populated state", () => {
    const { lastFrame } = render(<ReviewView state={populatedState()} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("react-doctor/no-fetch-in-effect");
    expect(frame).toContain("site");
    expect(frame).toContain("Avoid fetch inside useEffect.");
  });
});
