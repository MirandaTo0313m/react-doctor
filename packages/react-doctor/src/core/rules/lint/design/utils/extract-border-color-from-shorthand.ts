export const extractBorderColorFromShorthand = (shorthandValue: string): string | null => {
  const afterSolid = shorthandValue.match(/solid\s+(.+)$/i);
  if (!afterSolid) return null;
  return afterSolid[1].trim();
};
