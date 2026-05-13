export const splitVariant = (token: string): { variant: string; baseToken: string } => {
  const separatorIndex = token.lastIndexOf(":");
  if (separatorIndex === -1) return { variant: "", baseToken: token };
  return {
    variant: token.slice(0, separatorIndex + 1),
    baseToken: token.slice(separatorIndex + 1),
  };
};
