import {
  SECRET_CLIENT_ENTRY_FILE_PATTERN,
  SECRET_CLIENT_FILE_SUFFIX_PATTERN,
  SECRET_CLIENT_SOURCE_DIRECTORY_NAMES,
  SECRET_NEXT_PAGES_API_FILE_PATTERN,
  SECRET_SERVER_DIRECTORY_NAMES,
  SECRET_SERVER_ENTRY_FILE_PATTERN,
  SECRET_SERVER_FILE_SUFFIX_PATTERN,
  SECRET_TEST_FILE_PATTERN,
  SECRET_TEST_DIRECTORY_NAMES,
  SECRET_TOOLING_DIRECTORY_NAMES,
  SECRET_TOOLING_FILE_PATTERN,
  SECRET_TOOLING_RC_FILE_PATTERN,
} from "../constants/security.js";

export interface SecretFileExposureOptions {
  hasUseClientDirective?: boolean;
}

const SOURCE_FILE_EXTENSION_PATTERN = /\.[cm]?[jt]sx?$/;
const CLIENT_SOURCE_FILE_EXTENSION_PATTERN = /\.[cm]?[jt]sx$/;

const isInsideDirectory = (pathSegments: string[], directoryNames: ReadonlySet<string>): boolean =>
  pathSegments.some((pathSegment) => directoryNames.has(pathSegment));

const getClassifiablePathSegments = (pathSegments: string[]): string[] => {
  const srcIndex = pathSegments.lastIndexOf("src");
  if (srcIndex === -1) return pathSegments;
  return pathSegments.slice(srcIndex + 1);
};

const isClientSourceFile = (
  normalizedFilename: string,
  pathSegments: string[],
  classifiablePathSegments: string[],
): boolean => {
  if (!SOURCE_FILE_EXTENSION_PATTERN.test(normalizedFilename)) return false;
  if (!pathSegments.includes("src")) return false;
  if (classifiablePathSegments[0] === "app") return false;
  if (CLIENT_SOURCE_FILE_EXTENSION_PATTERN.test(normalizedFilename)) return true;

  return classifiablePathSegments.some((pathSegment) =>
    SECRET_CLIENT_SOURCE_DIRECTORY_NAMES.has(pathSegment),
  );
};

export const classifySecretFileExposure = (
  filename: string,
  options: SecretFileExposureOptions = {},
) => {
  if (filename.length === 0) return "unknown";

  const normalizedFilename = filename.replaceAll("\\", "/");
  const pathSegments = normalizedFilename.split("/");
  const classifiablePathSegments = getClassifiablePathSegments(pathSegments);

  if (SECRET_TEST_FILE_PATTERN.test(normalizedFilename)) return "test";
  if (isInsideDirectory(classifiablePathSegments, SECRET_TEST_DIRECTORY_NAMES)) return "test";
  if (SECRET_TOOLING_FILE_PATTERN.test(normalizedFilename)) return "tooling";
  if (SECRET_TOOLING_RC_FILE_PATTERN.test(normalizedFilename)) return "tooling";
  if (isInsideDirectory(classifiablePathSegments, SECRET_TOOLING_DIRECTORY_NAMES)) return "tooling";

  if (SECRET_SERVER_FILE_SUFFIX_PATTERN.test(normalizedFilename)) return "server";
  if (SECRET_SERVER_ENTRY_FILE_PATTERN.test(normalizedFilename)) return "server";
  if (SECRET_NEXT_PAGES_API_FILE_PATTERN.test(normalizedFilename)) return "server";
  if (isInsideDirectory(classifiablePathSegments, SECRET_SERVER_DIRECTORY_NAMES)) return "server";

  if (options.hasUseClientDirective === true) return "client";
  if (SECRET_CLIENT_FILE_SUFFIX_PATTERN.test(normalizedFilename)) return "client";
  if (SECRET_CLIENT_ENTRY_FILE_PATTERN.test(normalizedFilename)) return "client";
  if (isClientSourceFile(normalizedFilename, pathSegments, classifiablePathSegments)) {
    return "client";
  }

  return "unknown";
};
