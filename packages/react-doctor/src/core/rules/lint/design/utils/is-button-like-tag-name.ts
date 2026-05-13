export const isButtonLikeTagName = (tagName: string): boolean => {
  if (tagName === "button") return true;
  if (tagName === "Button") return true;
  return false;
};
