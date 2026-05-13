export const splitShadowLayers = (shadowValue: string): string[] =>
  shadowValue.split(/,(?![^(]*\))/);
