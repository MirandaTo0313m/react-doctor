export const getSpacingGroup = (baseToken: string): string | null => {
  const match = baseToken.match(/^-?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-/);
  return match ? match[1] : null;
};
