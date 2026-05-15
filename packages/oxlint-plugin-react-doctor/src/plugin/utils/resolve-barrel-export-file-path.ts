import { getBarrelIndexModuleInfo } from "./is-barrel-index-module.js";
import { resolveRelativeImportPath } from "./resolve-relative-import-path.js";

export const resolveBarrelExportFilePath = (
  barrelFilePath: string,
  exportedName: string,
  visitedFilePaths = new Set<string>(),
): string | null => {
  if (visitedFilePaths.has(barrelFilePath)) return null;
  visitedFilePaths.add(barrelFilePath);

  const moduleInfo = getBarrelIndexModuleInfo(barrelFilePath);
  if (!moduleInfo.isBarrel) return null;

  const target = moduleInfo.exportsByName.get(exportedName);
  if (target) {
    const resolvedTargetPath = resolveRelativeImportPath(barrelFilePath, target.source);
    if (!resolvedTargetPath) return null;

    const nestedTargetPath = resolveBarrelExportFilePath(
      resolvedTargetPath,
      target.importedName,
      visitedFilePaths,
    );
    return nestedTargetPath ?? resolvedTargetPath;
  }

  if (moduleInfo.starExportSources.length === 1) {
    const resolvedTargetPath = resolveRelativeImportPath(
      barrelFilePath,
      moduleInfo.starExportSources[0] ?? "",
    );
    if (!resolvedTargetPath) return null;

    const nestedTargetPath = resolveBarrelExportFilePath(
      resolvedTargetPath,
      exportedName,
      visitedFilePaths,
    );
    return nestedTargetPath ?? resolvedTargetPath;
  }

  return null;
};
