import type { BaselineConfig, ReactDoctorConfig, SurfaceControls } from "@react-doctor/types";

const dedupeStringArray = (input: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of input) {
    if (typeof entry !== "string" || entry.length === 0) continue;
    if (seen.has(entry)) continue;
    seen.add(entry);
    result.push(entry);
  }
  return result;
};

const concatDedupedArrays = (
  parentArray: string[] | undefined,
  childArray: string[] | undefined,
): string[] | undefined => {
  if (parentArray === undefined && childArray === undefined) return undefined;
  return dedupeStringArray([...(parentArray ?? []), ...(childArray ?? [])]);
};

const mergeSurfaceControls = (
  parentControls: SurfaceControls | undefined,
  childControls: SurfaceControls | undefined,
): SurfaceControls | undefined => {
  if (!parentControls && !childControls) return undefined;
  const merged: SurfaceControls = {};
  const includeTags = concatDedupedArrays(parentControls?.includeTags, childControls?.includeTags);
  if (includeTags) merged.includeTags = includeTags;
  const excludeTags = concatDedupedArrays(parentControls?.excludeTags, childControls?.excludeTags);
  if (excludeTags) merged.excludeTags = excludeTags;
  const includeCategories = concatDedupedArrays(
    parentControls?.includeCategories,
    childControls?.includeCategories,
  );
  if (includeCategories) merged.includeCategories = includeCategories;
  const excludeCategories = concatDedupedArrays(
    parentControls?.excludeCategories,
    childControls?.excludeCategories,
  );
  if (excludeCategories) merged.excludeCategories = excludeCategories;
  const includeRules = concatDedupedArrays(
    parentControls?.includeRules,
    childControls?.includeRules,
  );
  if (includeRules) merged.includeRules = includeRules;
  const excludeRules = concatDedupedArrays(
    parentControls?.excludeRules,
    childControls?.excludeRules,
  );
  if (excludeRules) merged.excludeRules = excludeRules;
  return merged;
};

const mergeBaseline = (
  parentValue: ReactDoctorConfig["baseline"],
  childValue: ReactDoctorConfig["baseline"],
): ReactDoctorConfig["baseline"] => {
  if (childValue === undefined) return parentValue;
  if (parentValue === undefined) return childValue;
  // Booleans always replace - merging `true` with `{ path }` would
  // require inventing semantics. Objects merge field-by-field.
  if (typeof childValue !== "object") return childValue;
  if (typeof parentValue !== "object") return childValue;
  const merged: BaselineConfig = { ...parentValue, ...childValue };
  return merged;
};

/**
 * Merge a child react-doctor config on top of an already-resolved
 * parent config. Child values always win; arrays concatenate +
 * deduplicate so a parent's `ignore.files` is not lost when a child
 * adds its own entries. Used by `loadConfigWithSource` to flatten an
 * `extends` chain into a single `ReactDoctorConfig` the rest of the
 * pipeline consumes unchanged.
 */
export const mergeReactDoctorConfigs = (
  parent: ReactDoctorConfig,
  child: ReactDoctorConfig,
): ReactDoctorConfig => {
  const merged: ReactDoctorConfig = { ...parent, ...child };

  if (parent.ignore || child.ignore) {
    merged.ignore = {
      ...parent.ignore,
      ...child.ignore,
      files: concatDedupedArrays(parent.ignore?.files, child.ignore?.files),
      rules: concatDedupedArrays(parent.ignore?.rules, child.ignore?.rules),
      tags: concatDedupedArrays(parent.ignore?.tags, child.ignore?.tags),
      overrides: [...(parent.ignore?.overrides ?? []), ...(child.ignore?.overrides ?? [])],
    };
  }

  const mergedTextComponents = concatDedupedArrays(parent.textComponents, child.textComponents);
  if (mergedTextComponents) merged.textComponents = mergedTextComponents;

  const mergedRawWrappers = concatDedupedArrays(
    parent.rawTextWrapperComponents,
    child.rawTextWrapperComponents,
  );
  if (mergedRawWrappers) merged.rawTextWrapperComponents = mergedRawWrappers;

  const mergedAuth = concatDedupedArrays(
    parent.serverAuthFunctionNames,
    child.serverAuthFunctionNames,
  );
  if (mergedAuth) merged.serverAuthFunctionNames = mergedAuth;

  const mergedBarrel = concatDedupedArrays(parent.barrelAllowlist, child.barrelAllowlist);
  if (mergedBarrel) merged.barrelAllowlist = mergedBarrel;

  if (parent.surfaces || child.surfaces) {
    const mergedSurfaces: NonNullable<ReactDoctorConfig["surfaces"]> = { ...parent.surfaces };
    for (const [surfaceName, childControls] of Object.entries(child.surfaces ?? {})) {
      if (!childControls) continue;
      const mergedControls = mergeSurfaceControls(
        parent.surfaces?.[surfaceName as keyof typeof mergedSurfaces],
        childControls,
      );
      if (mergedControls)
        mergedSurfaces[surfaceName as keyof typeof mergedSurfaces] = mergedControls;
    }
    merged.surfaces = mergedSurfaces;
  }

  if (parent.baseline !== undefined || child.baseline !== undefined) {
    merged.baseline = mergeBaseline(parent.baseline, child.baseline);
  }

  // Severity maps (`rules` / `categories`) merge field-by-field with
  // child wins, the same convention as scalar field overrides.
  if (parent.rules || child.rules) {
    merged.rules = { ...parent.rules, ...child.rules };
  }
  if (parent.categories || child.categories) {
    merged.categories = { ...parent.categories, ...child.categories };
  }

  delete (merged as Record<string, unknown>).extends;
  return merged;
};
