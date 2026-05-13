//#region src/constants.ts
const REACT_DOCTOR_CONFIG_FILENAME = "react-doctor.config.json";
const PACKAGE_JSON_FILENAME = "package.json";
const PACKAGE_JSON_CONFIG_KEY = "reactDoctor";
const ERROR_RULE_PENALTY = 1.5;
const WARNING_RULE_PENALTY = 0.75;
const SCORE_API_URL = "https://www.react.doctor/api/score";
const FETCH_TIMEOUT_MS = 1e4;
//#endregion
//#region src/core/score.ts
const getScoreLabel = (score) => {
  if (score >= 75) return "Great";
  if (score >= 50) return "Needs work";
  return "Critical";
};
const rulePenalty = (severity, count) => {
  return (
    (severity === "error" ? ERROR_RULE_PENALTY : WARNING_RULE_PENALTY) *
    Math.min(1 + Math.log2(count), 4)
  );
};
const calculateScore = (diagnostics, options = {}) => {
  const perfectScore = options.perfectScore ?? 100;
  if (diagnostics.length === 0) return perfectScore;
  const ruleCounts = /* @__PURE__ */ new Map();
  const ruleSeverities = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    ruleCounts.set(ruleKey, (ruleCounts.get(ruleKey) ?? 0) + 1);
    if (diagnostic.severity === "error" || !ruleSeverities.has(ruleKey))
      ruleSeverities.set(ruleKey, diagnostic.severity);
  }
  let totalPenalty = 0;
  for (const [ruleKey, count] of ruleCounts) {
    const severity = ruleSeverities.get(ruleKey) ?? "warning";
    totalPenalty += rulePenalty(severity, count);
  }
  return Math.max(0, Math.min(perfectScore, Math.round(perfectScore - totalPenalty)));
};
//#endregion
export {
  PACKAGE_JSON_FILENAME as a,
  PACKAGE_JSON_CONFIG_KEY as i,
  getScoreLabel as n,
  REACT_DOCTOR_CONFIG_FILENAME as o,
  FETCH_TIMEOUT_MS as r,
  SCORE_API_URL as s,
  calculateScore as t,
};

//# sourceMappingURL=score-C2C2ephU.js.map
