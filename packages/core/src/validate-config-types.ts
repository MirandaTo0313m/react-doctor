import { z } from "zod";
import type { DiagnosticSurface, ReactDoctorConfig } from "@react-doctor/types";
import { DIAGNOSTIC_SURFACES } from "./diagnostic-surface.js";

// HACK: write to stderr directly so the warning is visible even in
// `--json` mode (where the logger is silenced to keep stdout a single
// valid JSON document). Same pattern as `coerceDiffValue` in cli.ts.
const warnConfigField = (message: string): void => {
  process.stderr.write(`[react-doctor] ${message}\n`);
};

const formatType = (value: unknown): string => {
  if (Array.isArray(value)) return "array";
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  return typeof value;
};

/**
 * Boolean fields where the user might write `"true"` / `"false"` strings
 * in JSON by mistake. Coerce-and-warn rather than silently accept the
 * string (which JS treats as truthy and bypasses the negation path).
 * The warning fires from the preprocess so it sees the original string
 * even after coercion.
 */
const stringyBooleanSchema = (fieldName: string) =>
  z.preprocess((value) => {
    if (value !== "true" && value !== "false") return value;
    const coerced = value === "true";
    warnConfigField(
      `config field "${fieldName}" is the string "${value}"; treating as boolean ${coerced}.`,
    );
    return coerced;
  }, z.boolean());

const RULE_SEVERITY_VALUES = ["error", "warn", "off"] as const;
const ruleSeveritySchema = z.enum(RULE_SEVERITY_VALUES);

/**
 * Drop-and-warn array transform: keeps every entry that passes
 * `predicate`, logs `warnMessage(entry)` on every dropped entry, and
 * returns the filtered array. Used by the per-field array validators
 * so a single bad entry never invalidates the whole list.
 */
const filteringArrayTransform =
  <Out>(predicate: (value: unknown) => value is Out, warnMessage: (value: unknown) => string) =>
  (entries: ReadonlyArray<unknown>): Out[] => {
    const collected: Out[] = [];
    for (const entry of entries) {
      if (predicate(entry)) {
        collected.push(entry);
        continue;
      }
      warnConfigField(warnMessage(entry));
    }
    return collected;
  };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const filteringStringArraySchema = (fieldName: string) =>
  z.array(z.unknown()).transform(
    filteringArrayTransform(
      (entry): entry is string => typeof entry === "string",
      (entry) =>
        `config field "${fieldName}" contains a non-string entry (${formatType(entry)}); ignoring the entry.`,
    ),
  );

/**
 * Filtering record schema for the severity maps (`rules` / `categories`).
 * Records preserve every key whose value is a valid `RuleSeverityOverride`;
 * entries with invalid keys (empty string) or invalid values are dropped
 * with a stderr warning that names the offending path.
 */
const severityMapSchema = (fieldName: string) =>
  z.record(z.string(), z.unknown()).transform((rawMap) => {
    const validated: Record<string, (typeof RULE_SEVERITY_VALUES)[number]> = {};
    for (const [key, value] of Object.entries(rawMap)) {
      if (key.length === 0) {
        warnConfigField(`config field "${fieldName}" has an empty key; ignoring the entry.`);
        continue;
      }
      const parsed = ruleSeveritySchema.safeParse(value);
      if (!parsed.success) {
        warnConfigField(
          `config field "${fieldName}.${key}" must be one of: ${RULE_SEVERITY_VALUES.join(", ")} (got ${formatType(value)}); ignoring the entry.`,
        );
        continue;
      }
      validated[key] = parsed.data;
    }
    return validated;
  });

const SURFACE_CONTROL_FIELDS = [
  "includeTags",
  "excludeTags",
  "includeCategories",
  "excludeCategories",
  "includeRules",
  "excludeRules",
] as const;

/**
 * Validates each surface control field independently and drops invalid
 * siblings without invalidating the rest of the surface. Using a single
 * `z.object({...})` here would fail the whole surface on one malformed
 * field; this transform mirrors the per-field-safeParse pattern the
 * old hand-rolled validator used.
 */
const surfaceControlsSchema = (surface: DiagnosticSurface) =>
  z.record(z.string(), z.unknown()).transform((rawControls) => {
    const validated: Record<string, string[]> = {};
    for (const controlField of SURFACE_CONTROL_FIELDS) {
      const rawValue = rawControls[controlField];
      if (rawValue === undefined) continue;
      const fieldSchema = filteringStringArraySchema(`surfaces.${surface}.${controlField}`);
      const parsed = fieldSchema.safeParse(rawValue);
      if (parsed.success) {
        validated[controlField] = parsed.data;
        continue;
      }
      warnConfigField(
        `config field "surfaces.${surface}.${controlField}" must be an array of strings (got ${formatType(rawValue)}); ignoring this field.`,
      );
    }
    return validated;
  });

const KNOWN_DIAGNOSTIC_SURFACES = new Set<string>(DIAGNOSTIC_SURFACES);

const surfacesSchema = z.record(z.string(), z.unknown()).transform((rawSurfaces) => {
  const validated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawSurfaces)) {
    if (!KNOWN_DIAGNOSTIC_SURFACES.has(key)) {
      warnConfigField(
        `config field "surfaces.${key}" is not a known surface (expected one of: ${DIAGNOSTIC_SURFACES.join(", ")}); ignoring.`,
      );
      continue;
    }
    const surfaceKey = key as DiagnosticSurface;
    const parsed = surfaceControlsSchema(surfaceKey).safeParse(value);
    if (!parsed.success) {
      warnConfigField(
        `config field "surfaces.${surfaceKey}" must be an object (got ${formatType(value)}); ignoring this surface.`,
      );
      continue;
    }
    validated[surfaceKey] = parsed.data;
  }
  return validated;
});

const extendsSchema = z.union([
  z.string().min(1),
  z
    .array(z.unknown())
    .transform(
      filteringArrayTransform(isNonEmptyString, (entry) =>
        typeof entry === "string"
          ? `config field "extends" contains an empty string; ignoring the entry.`
          : `config field "extends" contains a non-string entry (${formatType(entry)}); ignoring the entry.`,
      ),
    ),
]);

const concurrencySchema = z.number().int().min(1);

const BOOLEAN_CONFIG_FIELDS = [
  "lint",
  "verbose",
  "customRulesOnly",
  "share",
  "respectInlineDisables",
  "adoptExistingLintConfig",
  "offline",
] as const satisfies ReadonlyArray<keyof ReactDoctorConfig>;

interface FieldDescriptor {
  expectedDescription: string;
  schema: z.ZodType;
}

const buildBooleanDescriptors = (): Record<string, FieldDescriptor> =>
  Object.fromEntries(
    BOOLEAN_CONFIG_FIELDS.map((fieldName) => [
      fieldName,
      { expectedDescription: "a boolean", schema: stringyBooleanSchema(fieldName) },
    ]),
  );

/**
 * Per-field schema map. Fields are checked in iteration order; missing
 * entries fall through unchanged - consumers still do their own runtime
 * checks for those.
 */
const fieldDescriptors = {
  ...buildBooleanDescriptors(),
  rootDir: { expectedDescription: "a string", schema: z.string() },
  barrelAllowlist: {
    expectedDescription: "an array of strings",
    schema: filteringStringArraySchema("barrelAllowlist"),
  },
  surfaces: { expectedDescription: "an object", schema: surfacesSchema },
  rules: { expectedDescription: "an object", schema: severityMapSchema("rules") },
  categories: { expectedDescription: "an object", schema: severityMapSchema("categories") },
  extends: {
    expectedDescription: "a non-empty string or array of strings",
    schema: extendsSchema,
  },
  concurrency: { expectedDescription: "a positive integer", schema: concurrencySchema },
} satisfies Record<string, FieldDescriptor>;

/**
 * Returns a config with boolean fields coerced from common JSON-typing
 * mistakes (string "true"/"false") and other invalid types stripped.
 * Non-validated fields pass through untouched - consumers still do their
 * own runtime checks for those.
 */
export const validateConfigTypes = (config: ReactDoctorConfig): ReactDoctorConfig => {
  const validated: ReactDoctorConfig = { ...config };
  for (const [fieldName, descriptor] of Object.entries(fieldDescriptors)) {
    const raw = (config as Record<string, unknown>)[fieldName];
    if (raw === undefined) continue;
    const parsed = descriptor.schema.safeParse(raw);
    if (parsed.success) {
      (validated as Record<string, unknown>)[fieldName] = parsed.data;
      continue;
    }
    warnConfigField(
      `config field "${fieldName}" must be ${descriptor.expectedDescription} (got ${formatType(raw)}); ignoring this field.`,
    );
    delete (validated as Record<string, unknown>)[fieldName];
  }
  return validated;
};
