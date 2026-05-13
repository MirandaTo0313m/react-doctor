import type { TailwindClassConflict } from "./tailwind-class-conflict.js";
import { getTailwindTokenGroup } from "./get-tailwind-token-group.js";
import { tokenizeClassName } from "./tokenize-class-name.js";

export const findTailwindClassConflict = (classNameValue: string): TailwindClassConflict | null => {
  const seenGroups = new Map<string, string>();
  for (const token of tokenizeClassName(classNameValue)) {
    const groupedToken = getTailwindTokenGroup(token);
    if (!groupedToken) continue;
    const previousToken = seenGroups.get(groupedToken.group);
    if (previousToken && previousToken !== groupedToken.token) {
      return {
        group: groupedToken.group,
        previousToken,
        token: groupedToken.token,
      };
    }
    seenGroups.set(groupedToken.group, groupedToken.token);
  }
  return null;
};
