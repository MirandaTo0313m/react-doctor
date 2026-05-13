//#region src/core/score.d.ts
/**
 * Log-scaled per rule. One issue still costs; 1000 issues don't zero a big repo.
 * Comparable across repo sizes.
 */
interface ScoreDiagnostic {
  plugin: string;
  rule: string;
  severity: "error" | "warning";
}
interface CalculateScoreOptions {
  perfectScore?: number;
}
declare const getScoreLabel: (score: number) => string;
declare const calculateScore: (
  diagnostics: ScoreDiagnostic[],
  options?: CalculateScoreOptions,
) => number;
//#endregion
export { CalculateScoreOptions, ScoreDiagnostic, calculateScore, getScoreLabel };
//# sourceMappingURL=score.d.ts.map
