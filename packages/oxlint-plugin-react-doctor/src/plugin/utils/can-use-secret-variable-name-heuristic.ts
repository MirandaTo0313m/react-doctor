import {
  NON_CLIENT_SECRET_HEURISTIC_DIRECTORY_NAMES,
  SECRET_HEURISTIC_CONFIG_FILE_PATTERN,
  SECRET_HEURISTIC_NEXT_PAGES_API_FILE_PATTERN,
  SECRET_HEURISTIC_NON_CLIENT_FILE_SUFFIX_PATTERN,
  SECRET_HEURISTIC_RC_CONFIG_FILE_PATTERN,
  SECRET_HEURISTIC_SERVER_ENTRY_FILE_PATTERN,
} from "../constants/security.js";

export const canUseSecretVariableNameHeuristic = (filename: string): boolean => {
  if (filename.length === 0) return true;

  const normalizedFilename = filename.replaceAll("\\", "/");
  if (SECRET_HEURISTIC_CONFIG_FILE_PATTERN.test(normalizedFilename)) return false;
  if (SECRET_HEURISTIC_RC_CONFIG_FILE_PATTERN.test(normalizedFilename)) return false;
  if (SECRET_HEURISTIC_NON_CLIENT_FILE_SUFFIX_PATTERN.test(normalizedFilename)) return false;
  if (SECRET_HEURISTIC_SERVER_ENTRY_FILE_PATTERN.test(normalizedFilename)) return false;
  if (SECRET_HEURISTIC_NEXT_PAGES_API_FILE_PATTERN.test(normalizedFilename)) return false;

  const pathSegments = normalizedFilename.split("/");
  const isInsideNonClientDirectory = pathSegments.some((pathSegment) =>
    NON_CLIENT_SECRET_HEURISTIC_DIRECTORY_NAMES.has(pathSegment),
  );

  return !isInsideNonClientDirectory;
};
