import { ANALYTICS_DEFERRABLE_METHODS } from "./analytics-deferrable-methods.js";
import { ANALYTICS_DEFERRABLE_OBJECTS } from "./analytics-deferrable-objects.js";
import { CONSOLE_DEFERRABLE_METHODS } from "./console-deferrable-methods.js";

export const isDeferrableSideEffectCall = (objectName: string, methodName: string): boolean => {
  if (objectName === "console") return CONSOLE_DEFERRABLE_METHODS.has(methodName);
  if (ANALYTICS_DEFERRABLE_OBJECTS.has(objectName)) {
    return ANALYTICS_DEFERRABLE_METHODS.has(methodName);
  }
  return false;
};
