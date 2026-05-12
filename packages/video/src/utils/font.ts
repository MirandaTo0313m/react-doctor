import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const loaded = loadFont("normal", {
  weights: ["400", "500", "700"],
});

export const { fontFamily, waitUntilDone } = loaded;
