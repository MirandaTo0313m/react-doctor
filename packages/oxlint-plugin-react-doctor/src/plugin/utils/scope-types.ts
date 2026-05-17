import type { EsTreeNode } from "./es-tree-node.js";

export interface ScopeDefinition {
  type: string;
  node: EsTreeNode;
  parent: EsTreeNode | null;
}

export interface ScopeVariable {
  name: string;
  defs: ScopeDefinition[];
  references: ScopeReference[];
  identifiers: EsTreeNode[];
  scope: Scope;
}

export interface ScopeReference {
  identifier: EsTreeNode;
  resolved: ScopeVariable | null;
  from: Scope;
  isWrite: () => boolean;
  isRead: () => boolean;
  writeExpr: EsTreeNode | null;
}

export interface Scope {
  type: string;
  block: EsTreeNode;
  upper: Scope | null;
  childScopes: Scope[];
  references: ScopeReference[];
  variables: ScopeVariable[];
  through: ScopeReference[];
}

export interface ScopeManager {
  scopes: Scope[];
  acquire: (node: EsTreeNode) => Scope | null;
}

export interface SourceCode {
  scopeManager: ScopeManager;
  getScope: (node: EsTreeNode) => Scope;
  getText: (node: EsTreeNode) => string;
  visitorKeys: Record<string, string[]>;
}
