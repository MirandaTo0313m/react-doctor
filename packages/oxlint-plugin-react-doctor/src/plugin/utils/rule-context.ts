import type { ReportDescriptor } from "./report-descriptor.js";
import type { SourceCode } from "./scope-types.js";

export interface RuleContext {
  report: (descriptor: ReportDescriptor) => void;
  getFilename?: () => string;
  readonly settings?: Readonly<Record<string, unknown>>;
  readonly sourceCode?: SourceCode;
}
