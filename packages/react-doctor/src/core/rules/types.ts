import type { ReactDoctorIssue } from "../types.js";
import type { CodebaseAnalysisResult } from "./codebase/analyzer/index.js";

export interface ReactDoctorRuleExample {
  before: string;
  after: string;
}

export interface ReactDoctorRuleMetadata {
  id: string;
  name: string;
  description: string;
  recommendation?: string;
  examples?: ReactDoctorRuleExample[];
  category: string;
  severity: ReactDoctorIssue["severity"];
  defaultEnabled: boolean;
  tags: string[];
  docsUrl?: string;
}

export interface ReactDoctorRuleContext {
  rootDirectory: string;
  includePaths?: string[];
  excludePatterns?: string[];
  signal?: AbortSignal;
  getCodebaseAnalysis?: () => Promise<CodebaseAnalysisResult>;
}

export interface ReactDoctorRuleResult {
  issues: ReactDoctorIssue[];
}

export interface ReactDoctorRule {
  metadata: ReactDoctorRuleMetadata;
  run: (context: ReactDoctorRuleContext) => ReactDoctorRuleResult | Promise<ReactDoctorRuleResult>;
}
