import { SAFE_BUILD_ENV_VARS } from "./safe-build-env-vars.js";
import { SECRET_KEYWORD_PATTERN } from "./secret-keyword-pattern.js";

export const isLikelySecret = (envVarName: string): boolean => {
  if (SAFE_BUILD_ENV_VARS.has(envVarName)) return false;
  return SECRET_KEYWORD_PATTERN.test(envVarName);
};
