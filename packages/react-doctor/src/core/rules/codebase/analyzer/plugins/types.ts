import type { EntryPointRole, PackageJsonObject, WorkspaceInfo } from "../types.js";

export interface CodebasePluginResult {
  entryPatterns: CodebasePluginEntryPattern[];
  alwaysUsedPatterns: string[];
  usedExports: Map<string, Set<string>>;
  toolingDependencies: Set<string>;
  virtualModulePrefixes: string[];
  generatedImportSuffixes: string[];
}

export interface CodebasePluginEntryPattern {
  pattern: string;
  role: EntryPointRole;
}

export interface CodebasePlugin {
  name: string;
  enablers: string[];
  entryPatterns: string[];
  entryRole: EntryPointRole;
  alwaysUsedPatterns?: string[];
  toolingDependencies?: string[];
  virtualModulePrefixes?: string[];
  generatedImportSuffixes?: string[];
  usedExports?: Array<{ pattern: string; exports: string[] }>;
  isEnabled?: (workspace: WorkspaceInfo) => boolean;
  resolvePackageJson?: (manifest: PackageJsonObject) => CodebasePluginResult | null;
}
