export interface ScannedIssue {
  message: string;
  severity: "error" | "warning" | "ok";
  pointsLost: number;
  file: string;
}
