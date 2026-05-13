export const tokenizeClassName = (classNameValue: string): string[] =>
  classNameValue.split(/\s+/).filter(Boolean);
