export interface CallableReadClassification {
  hasAnyRead: boolean;
  allReadsAreInSubHandlers: boolean;
  firstSubHandlerName: string | null;
}
