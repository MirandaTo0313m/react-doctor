import { highlighter, logger } from "@react-doctor/core";
import type { ReactDoctorConfig } from "@react-doctor/types";

const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 32;

const parseConcurrencyFlag = (rawValue: string | undefined): number | null => {
  if (rawValue === undefined) return null;
  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < MIN_CONCURRENCY) {
    logger.warn(
      `--concurrency ${highlighter.info(rawValue)} is not a positive integer; falling back to 1.`,
    );
    return null;
  }
  if (parsedValue > MAX_CONCURRENCY) {
    logger.warn(
      `--concurrency ${parsedValue} clamped to ${MAX_CONCURRENCY} (over-parallelism slows large monorepo scans).`,
    );
    return MAX_CONCURRENCY;
  }
  return parsedValue;
};

export const resolveConcurrency = (
  flagValue: string | undefined,
  userConfig: ReactDoctorConfig | null,
): number => {
  const fromFlag = parseConcurrencyFlag(flagValue);
  if (fromFlag !== null) return fromFlag;
  const fromConfig = userConfig?.concurrency;
  if (fromConfig !== undefined && fromConfig >= MIN_CONCURRENCY) {
    return Math.min(fromConfig, MAX_CONCURRENCY);
  }
  return MIN_CONCURRENCY;
};
