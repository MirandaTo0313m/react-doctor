import type { Diagnostic } from "react-doctor/api";

export const colorForSeverity = (severity: Diagnostic["severity"]): "red" | "yellow" =>
  severity === "error" ? "red" : "yellow";

export const symbolForSeverity = (severity: Diagnostic["severity"]): string =>
  severity === "error" ? "✗" : "⚠";
