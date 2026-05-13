import type { EsTreeNode } from "../../utils/index.js";
import { findClassNameLiteral } from "./find-class-name-literal.js";

export const getClassNameLiteral = (openingElement: EsTreeNode): string | null =>
  findClassNameLiteral(openingElement)?.value ?? null;
