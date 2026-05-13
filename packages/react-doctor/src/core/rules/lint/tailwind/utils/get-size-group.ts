export const getSizeGroup = (baseToken: string): string | null => {
  const match = baseToken.match(/^(w|h|min-w|min-h|max-w|max-h)-/);
  return match ? match[1] : null;
};
